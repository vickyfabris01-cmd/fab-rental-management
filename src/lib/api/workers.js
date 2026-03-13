import { db } from "../../config/supabase";

// =============================================================================
// lib/api/workers.js
//
// Operations on `workers`, `worker_payments`, and `attendance`.
// =============================================================================

const WORKER_SELECT =
  "id, tenant_id, user_id, full_name, phone, id_number, role, salary, pay_cycle, status, start_date, end_date, created_at, updated_at";

const WORKER_PAYMENT_SELECT = `
  id, tenant_id, worker_id, amount, period_start, period_end,
  payment_method, payment_status, mpesa_transaction_id,
  paid_at, recorded_by, notes, created_at,
  workers(id, full_name, role),
  recorder:profiles!recorded_by(id, full_name)
`;

const ATTENDANCE_SELECT = `
  id, tenant_id, worker_id, date, status, notes, recorded_by, created_at,
  workers(id, full_name, role)
`;

// ─────────────────────────────────────────────────────────────────────────────
// Workers CRUD
// ─────────────────────────────────────────────────────────────────────────────

export async function getWorkers(tenantId, opts = {}) {
  let query = db
    .workers()
    .select(WORKER_SELECT)
    .eq("tenant_id", tenantId)
    .order("full_name");

  if (opts.status) query = query.eq("status", opts.status);
  if (opts.role)   query = query.eq("role", opts.role);
  if (opts.limit)  query = query.limit(opts.limit);

  const { data, error } = await query;
  return { data: data ?? [], error };
}

export async function getWorker(workerId) {
  const { data, error } = await db
    .workers()
    .select(WORKER_SELECT)
    .eq("id", workerId)
    .single();
  return { data, error };
}

/**
 * Create a new worker record.
 *
 * @param {string} tenantId
 * @param {object} payload
 * @param {string}   payload.fullName
 * @param {string}   payload.role       'security' | 'cleaner' | 'maintenance' | ...
 * @param {number}   payload.salary
 * @param {string}   [payload.phone]
 * @param {string}   [payload.idNumber]
 * @param {string}   [payload.payCycle]  'weekly' | 'biweekly' | 'monthly'
 * @param {string}   [payload.startDate] ISO date
 * @param {string}   [payload.userId]    If worker has an app login
 */
export async function createWorker(tenantId, payload) {
  const { data, error } = await db
    .workers()
    .insert({
      tenant_id:  tenantId,
      full_name:  payload.fullName,
      role:       payload.role,
      salary:     Number(payload.salary),
      phone:      payload.phone      ?? null,
      id_number:  payload.idNumber   ?? null,
      pay_cycle:  payload.payCycle   ?? "monthly",
      start_date: payload.startDate  ?? null,
      user_id:    payload.userId     ?? null,
      status:     "active",
    })
    .select(WORKER_SELECT)
    .single();
  return { data, error };
}

export async function updateWorker(workerId, updates) {
  const { data, error } = await db
    .workers()
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", workerId)
    .select(WORKER_SELECT)
    .single();
  return { data, error };
}

/**
 * Deactivate a worker — sets status → 'terminated' and records end_date.
 */
export async function terminateWorker(workerId, endDate) {
  const { data, error } = await db
    .workers()
    .update({
      status:     "terminated",
      end_date:   endDate ?? new Date().toISOString().slice(0, 10),
      updated_at: new Date().toISOString(),
    })
    .eq("id", workerId)
    .select("id, status, end_date")
    .single();
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// Worker payments (salary disbursements)
// ─────────────────────────────────────────────────────────────────────────────

export async function getWorkerPayments(tenantId, opts = {}) {
  let query = db
    .workerPayments()
    .select(WORKER_PAYMENT_SELECT)
    .eq("tenant_id", tenantId)
    .order("paid_at", { ascending: false });

  if (opts.workerId) query = query.eq("worker_id", opts.workerId);
  if (opts.limit)    query = query.limit(opts.limit);
  if (opts.offset)   query = query.range(opts.offset, opts.offset + (opts.limit ?? 50) - 1);

  const { data, error } = await query;
  return { data: data ?? [], error };
}

export async function getMyWorkerPayments(workerId) {
  const { data, error } = await db
    .workerPayments()
    .select(WORKER_PAYMENT_SELECT)
    .eq("worker_id", workerId)
    .order("paid_at", { ascending: false });
  return { data: data ?? [], error };
}

/**
 * Record a salary payment for a worker. Append-only.
 *
 * @param {object} payload
 * @param {string} payload.tenantId
 * @param {string} payload.workerId
 * @param {number} payload.amount
 * @param {string} payload.periodStart    ISO date
 * @param {string} payload.periodEnd      ISO date
 * @param {string} [payload.method]       'mpesa' | 'cash' | 'bank_transfer' | 'other'
 * @param {string} [payload.recordedBy]   Manager profile UUID
 * @param {string} [payload.notes]
 * @param {string} [payload.paidAt]       ISO timestamp
 */
export async function recordSalaryPayment({
  tenantId, workerId, amount, periodStart, periodEnd,
  method, recordedBy, notes, paidAt,
}) {
  const { data, error } = await db
    .workerPayments()
    .insert({
      tenant_id:      tenantId,
      worker_id:      workerId,
      amount:         Number(amount),
      period_start:   periodStart,
      period_end:     periodEnd,
      payment_method: method        ?? "cash",
      payment_status: "paid",
      recorded_by:    recordedBy    ?? null,
      notes:          notes?.trim() ?? null,
      paid_at:        paidAt        ?? new Date().toISOString(),
    })
    .select(WORKER_PAYMENT_SELECT)
    .single();
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// Payroll summary
// Total salary cost for a period — used on owner workforce cost page.
// ─────────────────────────────────────────────────────────────────────────────
export async function getPayrollSummary(tenantId, periodStart, periodEnd) {
  const { data, error } = await db
    .workerPayments()
    .select("amount, workers(role)")
    .eq("tenant_id", tenantId)
    .eq("payment_status", "paid")
    .gte("period_start", periodStart)
    .lte("period_end",   periodEnd);

  if (error) return { data: null, error };

  const summary = (data ?? []).reduce(
    (acc, p) => {
      acc.total += Number(p.amount);
      const role = p.workers?.role ?? "other";
      acc.byRole[role] = (acc.byRole[role] ?? 0) + Number(p.amount);
      return acc;
    },
    { total: 0, byRole: {} }
  );

  return { data: summary, error: null };
}

// ─────────────────────────────────────────────────────────────────────────────
// Attendance
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get attendance records for a tenant.
 *
 * @param {string} tenantId
 * @param {object} [opts]
 * @param {string}   [opts.workerId]
 * @param {string}   [opts.dateFrom]   ISO date (inclusive)
 * @param {string}   [opts.dateTo]     ISO date (inclusive)
 * @param {string}   [opts.status]     'present' | 'absent' | 'half_day' | 'leave'
 */
export async function getAttendance(tenantId, opts = {}) {
  let query = db
    .attendance()
    .select(ATTENDANCE_SELECT)
    .eq("tenant_id", tenantId)
    .order("date", { ascending: false });

  if (opts.workerId) query = query.eq("worker_id", opts.workerId);
  if (opts.status)   query = query.eq("status", opts.status);
  if (opts.dateFrom) query = query.gte("date", opts.dateFrom);
  if (opts.dateTo)   query = query.lte("date", opts.dateTo);
  if (opts.limit)    query = query.limit(opts.limit);

  const { data, error } = await query;
  return { data: data ?? [], error };
}

/**
 * Record a single attendance entry. UNIQUE (worker_id, date) — upsert safe.
 *
 * @param {object} payload
 * @param {string} payload.tenantId
 * @param {string} payload.workerId
 * @param {string} payload.date        ISO date 'YYYY-MM-DD'
 * @param {string} payload.status      'present' | 'absent' | 'half_day' | 'leave'
 * @param {string} [payload.notes]
 * @param {string} [payload.recordedBy] Manager profile UUID
 */
export async function recordAttendance({ tenantId, workerId, date, status, notes, recordedBy }) {
  const { data, error } = await db
    .attendance()
    .upsert(
      {
        tenant_id:   tenantId,
        worker_id:   workerId,
        date,
        status,
        notes:       notes?.trim() ?? null,
        recorded_by: recordedBy ?? null,
      },
      { onConflict: "worker_id,date" }   // overwrite if same worker/day
    )
    .select(ATTENDANCE_SELECT)
    .single();
  return { data, error };
}

/**
 * Bulk-record attendance for multiple workers on the same date.
 *
 * @param {string} tenantId
 * @param {string} date
 * @param {Array<{ workerId, status, notes?, recordedBy? }>} records
 */
export async function bulkRecordAttendance(tenantId, date, records) {
  const rows = records.map(r => ({
    tenant_id:   tenantId,
    worker_id:   r.workerId,
    date,
    status:      r.status,
    notes:       r.notes?.trim() ?? null,
    recorded_by: r.recordedBy ?? null,
  }));

  const { data, error } = await db
    .attendance()
    .upsert(rows, { onConflict: "worker_id,date" })
    .select(ATTENDANCE_SELECT);
  return { data: data ?? [], error };
}
