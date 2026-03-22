import { db } from "../../config/supabase";

// =============================================================================
// lib/api/payments.js
//
// Operations on the `payments` table.
//
// APPEND-ONLY RULE: payments rows are never updated or deleted by the frontend.
//   - M-Pesa status changes happen via the FastAPI /payments/mpesa/callback endpoint
//   - Manual payments are inserted by managers (recorded_by is populated)
//   - The trg_reconcile_payment trigger updates the parent billing_cycle on INSERT
//
// The mpesaSTKPush function hits the FastAPI backend (not Supabase directly)
// because it needs the Daraja API credentials kept server-side.
// =============================================================================

const FASTAPI_BASE = import.meta.env.VITE_API_BASE_URL;

const PAYMENT_SELECT = `
  id, tenant_id, billing_cycle_id, client_id,
  amount, payment_method, payment_status,
  mpesa_transaction_id, mpesa_receipt, reference,
  paid_at, recorded_by, notes, created_at,
  billing_cycles(period_start, period_end, amount_due),
  client:profiles!client_id(id, full_name, avatar_url),
  recorder:profiles!recorded_by(id, full_name)
`;

// ─────────────────────────────────────────────────────────────────────────────
// getPayments
// List payments for a tenant (manager / owner view).
//
// @param {string} tenantId
// @param {object} [opts]
// @param {string}   [opts.clientId]
// @param {string}   [opts.cycleId]      billing_cycle_id
// @param {string}   [opts.method]       'mpesa' | 'cash' | 'bank_transfer' | 'other'
// @param {string}   [opts.status]       'pending' | 'confirmed' | 'failed' | 'reversed'
// @param {number}   [opts.limit]
// @param {number}   [opts.offset]
// ─────────────────────────────────────────────────────────────────────────────
export async function getPayments(tenantId, opts = {}) {
  let query = db
    .payments()
    .select(PAYMENT_SELECT)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (opts.clientId) query = query.eq("client_id", opts.clientId);
  if (opts.cycleId)  query = query.eq("billing_cycle_id", opts.cycleId);
  if (opts.method)   query = query.eq("payment_method", opts.method);
  if (opts.status)   query = query.eq("payment_status", opts.status);
  if (opts.limit)    query = query.limit(opts.limit);
  if (opts.offset)   query = query.range(opts.offset, opts.offset + (opts.limit ?? 50) - 1);

  const { data, error } = await query;
  return { data: data ?? [], error };
}

// ─────────────────────────────────────────────────────────────────────────────
// getMyPayments
// Client view — payments for the authenticated user.
// ─────────────────────────────────────────────────────────────────────────────
export async function getMyPayments(clientId, opts = {}) {
  let query = db
    .payments()
    .select(PAYMENT_SELECT)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (opts.status) query = query.eq("payment_status", opts.status);
  if (opts.limit)  query = query.limit(opts.limit);

  const { data, error } = await query;
  return { data: data ?? [], error };
}

// ─────────────────────────────────────────────────────────────────────────────
// getPaymentsForCycle
// All payments (any status) for a specific billing cycle.
// Used on the billing cycle detail view.
// ─────────────────────────────────────────────────────────────────────────────
export async function getPaymentsForCycle(cycleId) {
  const { data, error } = await db
    .payments()
    .select(PAYMENT_SELECT)
    .eq("billing_cycle_id", cycleId)
    .order("created_at", { ascending: false });
  return { data: data ?? [], error };
}

// ─────────────────────────────────────────────────────────────────────────────
// recordManualPayment
// Manager records a cash / bank transfer payment on behalf of a client.
// Inserts a confirmed payment row directly — the reconcile trigger fires.
//
// @param {object} payload
// @param {string} payload.tenantId
// @param {string} payload.cycleId         billing_cycle_id
// @param {string} payload.clientId
// @param {number} payload.amount
// @param {string} payload.method          'cash' | 'bank_transfer' | 'other'
// @param {string} payload.recordedBy      Manager's profile UUID
// @param {string} [payload.notes]
// @param {string} [payload.paidAt]        ISO timestamp, defaults to now
// ─────────────────────────────────────────────────────────────────────────────
export async function recordManualPayment({
  tenantId, cycleId, clientId, amount, method, recordedBy, notes, paidAt,
}) {
  const { data, error } = await db
    .payments()
    .insert({
      tenant_id:        tenantId,
      billing_cycle_id: cycleId,
      client_id:        clientId,
      amount:           Number(amount),
      payment_method:   method,
      payment_status:   "confirmed",   // manual = already confirmed
      recorded_by:      recordedBy,
      notes:            notes?.trim() ?? null,
      paid_at:          paidAt ?? new Date().toISOString(),
    })
    .select(PAYMENT_SELECT)
    .single();
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// mpesaSTKPush
// Initiates an M-Pesa STK Push via the FastAPI backend.
// FastAPI creates the pending payment row, calls Daraja, returns the
// checkout_request_id used to poll for status.
//
// The async callback (POST /payments/mpesa/callback) is handled entirely by
// FastAPI — the frontend polls or listens via Realtime for the status change.
//
// @param {object} payload
// @param {string} payload.cycleId       billing_cycle_id
// @param {string} payload.clientId
// @param {string} payload.phone         KE phone e.g. "254712345678"
// @param {number} payload.amount        Integer KES amount
// @param {string} payload.reference     Account reference shown in M-Pesa prompt
// @returns {Promise<{ data: { checkout_request_id, payment_id } | null, error }>}
// ─────────────────────────────────────────────────────────────────────────────
export async function mpesaSTKPush({ cycleId, clientId, phone, amount, reference }) {
  // M-Pesa STK Push requires the FastAPI backend (Daraja credentials are server-side only).
  // If the backend is not running, return a clear error rather than ERR_CONNECTION_REFUSED.
  if (!FASTAPI_BASE || FASTAPI_BASE === "http://localhost:8000") {
    // Check if backend is actually available first
    try {
      const ping = await fetch(`${FASTAPI_BASE}/health`, { signal: AbortSignal.timeout(2000) });
      if (!ping.ok) throw new Error("backend down");
    } catch {
      return {
        data: null,
        error: {
          message: "M-Pesa payments require the FastAPI backend to be running. " +
                   "Start it with: cd backend && uvicorn main:app --reload",
        },
      };
    }
  }

  // Get the current session JWT to authenticate with FastAPI
  const { data: { session } } = await import("../../config/supabase")
    .then(m => m.supabase.auth.getSession());

  if (!session) return { data: null, error: { message: "Not authenticated" } };

  try {
    const res = await fetch(`${FASTAPI_BASE}/payments/mpesa/stk-push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:  `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        billing_cycle_id: cycleId,
        client_id:        clientId,
        phone,
        amount:           Math.ceil(amount), // M-Pesa requires integer KES
        reference:        reference ?? "Rent Payment",
        description:      `Rent payment – ${reference}`,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      return { data: null, error: { message: err.detail ?? "STK Push failed" } };
    }

    const data = await res.json();
    return { data, error: null };
  } catch (err) {
    return { data: null, error: { message: err.message } };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// pollPaymentStatus
// Polls a payment row until it leaves 'pending' status.
// Used as a fallback when the Realtime channel isn't available.
//
// @param {string}   paymentId
// @param {object}   [opts]
// @param {number}     [opts.intervalMs]   Default 3000ms
// @param {number}     [opts.maxAttempts]  Default 20 (= 60s at 3s intervals)
// @param {Function}   [opts.onUpdate]     Called with each status update
// @returns {Promise<string>} Final payment_status
// ─────────────────────────────────────────────────────────────────────────────
export async function pollPaymentStatus(paymentId, opts = {}) {
  const { intervalMs = 3000, maxAttempts = 20, onUpdate } = opts;
  let attempts = 0;

  return new Promise((resolve) => {
    const timer = setInterval(async () => {
      attempts++;

      const { data } = await db
        .payments()
        .select("payment_status")
        .eq("id", paymentId)
        .single();

      const status = data?.payment_status;
      onUpdate?.(status);

      if (status && status !== "pending") {
        clearInterval(timer);
        resolve(status);
        return;
      }

      if (attempts >= maxAttempts) {
        clearInterval(timer);
        resolve("pending"); // timed out
      }
    }, intervalMs);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// getPaymentSummary
// Aggregate stats for the manager payments overview.
// ─────────────────────────────────────────────────────────────────────────────
export async function getPaymentSummary(tenantId) {
  const { data, error } = await db
    .payments()
    .select("payment_method, payment_status, amount")
    .eq("tenant_id", tenantId)
    .eq("payment_status", "confirmed");

  if (error) return { data: null, error };

  const summary = (data ?? []).reduce(
    (acc, p) => {
      acc.total       += Number(p.amount);
      acc.count++;
      acc.byMethod[p.payment_method] = (acc.byMethod[p.payment_method] ?? 0) + Number(p.amount);
      return acc;
    },
    { total: 0, count: 0, byMethod: {} }
  );

  return { data: summary, error: null };
}
