import { db } from "../../config/supabase";

// =============================================================================
// lib/api/billing.js
//
// Read operations on `billing_cycles` and `invoices`.
//
// IMMUTABILITY RULE: billing_cycles rows are never mutated by the frontend.
// Status changes (unpaid → paid → partial) happen only via:
//   1. The trg_reconcile_payment DB trigger (after a payment is confirmed)
//   2. A FastAPI admin endpoint (waive / cancel)
// The only safe writes from the client are creating payment records and
// waiving cycles via manager action.
// =============================================================================

const CYCLE_SELECT = `
  id, tenant_id, tenancy_id, client_id, room_id,
  billing_type, period_start, period_end,
  amount_due, late_fee, status, due_date,
  invoice_number, notes, created_at,
  rooms(id, room_number, buildings(name)),
  profiles!client_id(id, full_name, avatar_url)
`;

const INVOICE_SELECT = `
  id, tenant_id, billing_cycle_id, client_id,
  invoice_number, issued_at, pdf_url, total_amount, created_at,
  billing_cycles(period_start, period_end, status),
  profiles!client_id(id, full_name, email)
`;

// ─────────────────────────────────────────────────────────────────────────────
// getBillingCycles
// Manager / owner view — all cycles for a tenant.
//
// @param {string} tenantId
// @param {object} [opts]
// @param {string}   [opts.status]     Filter by status (unpaid / partial / paid / overdue)
// @param {string}   [opts.clientId]   Filter by client
// @param {string}   [opts.tenancyId]  Filter by tenancy
// @param {number}   [opts.limit]
// @param {number}   [opts.offset]
// ─────────────────────────────────────────────────────────────────────────────
export async function getBillingCycles(tenantId, opts = {}) {
  let query = db
    .billingCycles()
    .select(CYCLE_SELECT)
    .eq("tenant_id", tenantId)
    .order("period_start", { ascending: false });

  if (opts.status)    query = query.eq("status", opts.status);
  if (opts.clientId)  query = query.eq("client_id", opts.clientId);
  if (opts.tenancyId) query = query.eq("tenancy_id", opts.tenancyId);
  if (opts.limit)     query = query.limit(opts.limit);
  if (opts.offset)    query = query.range(opts.offset, opts.offset + (opts.limit ?? 50) - 1);

  const { data, error } = await query;
  return { data: data ?? [], error };
}

// ─────────────────────────────────────────────────────────────────────────────
// getMyBillingCycles
// Client view — all billing cycles for the authenticated client.
//
// @param {string} clientId
// @param {object} [opts]
// @param {string}   [opts.status]
// ─────────────────────────────────────────────────────────────────────────────
export async function getMyBillingCycles(clientId, opts = {}) {
  let query = db
    .billingCycles()
    .select(CYCLE_SELECT)
    .eq("client_id", clientId)
    .order("period_start", { ascending: false });

  if (opts.status) query = query.eq("status", opts.status);

  const { data, error } = await query;
  return { data: data ?? [], error };
}

// ─────────────────────────────────────────────────────────────────────────────
// getBillingCycle
// Single cycle by ID.
// ─────────────────────────────────────────────────────────────────────────────
export async function getBillingCycle(cycleId) {
  const { data, error } = await db
    .billingCycles()
    .select(CYCLE_SELECT)
    .eq("id", cycleId)
    .single();
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// getOverdueCycles
// Fetch overdue cycles for manager dashboard — those past due_date and unpaid.
//
// @param {string} tenantId
// @param {number} [limit]
// ─────────────────────────────────────────────────────────────────────────────
export async function getOverdueCycles(tenantId, limit = 20) {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await db
    .billingCycles()
    .select(CYCLE_SELECT)
    .eq("tenant_id", tenantId)
    .in("status", ["unpaid", "partial", "overdue"])
    .lt("due_date", today)
    .order("due_date")
    .limit(limit);
  return { data: data ?? [], error };
}

// ─────────────────────────────────────────────────────────────────────────────
// getCurrentCycle
// Returns the current (most recent unpaid or partial) cycle for a client.
// Used on the client dashboard payment card.
// ─────────────────────────────────────────────────────────────────────────────
export async function getCurrentCycle(clientId) {
  const { data, error } = await db
    .billingCycles()
    .select(CYCLE_SELECT)
    .eq("client_id", clientId)
    .in("status", ["unpaid", "partial", "overdue"])
    .order("due_date")
    .limit(1)
    .maybeSingle();
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// getUpcomingCycles
// Next N cycles regardless of status — used in the client billing timeline.
// ─────────────────────────────────────────────────────────────────────────────
export async function getUpcomingCycles(clientId, limit = 6) {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await db
    .billingCycles()
    .select(CYCLE_SELECT)
    .eq("client_id", clientId)
    .gte("period_start", today)
    .order("period_start")
    .limit(limit);
  return { data: data ?? [], error };
}

// ─────────────────────────────────────────────────────────────────────────────
// getBillingSummary
// Aggregate totals for a client — total paid, outstanding, next due.
// ─────────────────────────────────────────────────────────────────────────────
export async function getBillingSummary(clientId) {
  const { data, error } = await db
    .billingCycles()
    .select("status, amount_due, late_fee, due_date")
    .eq("client_id", clientId);

  if (error) return { data: null, error };

  const summary = (data ?? []).reduce(
    (acc, c) => {
      const total = Number(c.amount_due) + Number(c.late_fee ?? 0);
      if (c.status === "paid") {
        acc.totalPaid += total;
      } else if (["unpaid", "partial", "overdue"].includes(c.status)) {
        acc.outstanding += total;
        if (!acc.nextDueDate || c.due_date < acc.nextDueDate) {
          acc.nextDueDate = c.due_date;
        }
      }
      return acc;
    },
    { totalPaid: 0, outstanding: 0, nextDueDate: null }
  );

  return { data: summary, error: null };
}

// ─────────────────────────────────────────────────────────────────────────────
// waiveCycle
// Manager marks a billing cycle as waived (no payment required).
// This is the only status change allowed from the client — still restricted
// by RLS to manager/owner roles.
//
// @param {string} cycleId
// @param {string} notes   Reason for waiver
// ─────────────────────────────────────────────────────────────────────────────
export async function waiveCycle(cycleId, notes) {
  const { data, error } = await db
    .billingCycles()
    .update({ status: "waived", notes: notes?.trim() ?? null })
    .eq("id", cycleId)
    .select("id, status, notes")
    .single();
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// Invoices
// ─────────────────────────────────────────────────────────────────────────────

export async function getInvoices(tenantId, opts = {}) {
  let query = db
    .invoices()
    .select(INVOICE_SELECT)
    .eq("tenant_id", tenantId)
    .order("issued_at", { ascending: false });

  if (opts.clientId) query = query.eq("client_id", opts.clientId);
  if (opts.limit)    query = query.limit(opts.limit);
  if (opts.offset)   query = query.range(opts.offset, opts.offset + (opts.limit ?? 50) - 1);

  const { data, error } = await query;
  return { data: data ?? [], error };
}

export async function getMyInvoices(clientId) {
  const { data, error } = await db
    .invoices()
    .select(INVOICE_SELECT)
    .eq("client_id", clientId)
    .order("issued_at", { ascending: false });
  return { data: data ?? [], error };
}

export async function getInvoice(invoiceId) {
  const { data, error } = await db
    .invoices()
    .select(INVOICE_SELECT)
    .eq("id", invoiceId)
    .single();
  return { data, error };
}

// createInvoice is handled by FastAPI's invoice_service (PDF generation + Storage upload)
// The frontend calls POST /invoices via the FastAPI backend, not Supabase directly.
