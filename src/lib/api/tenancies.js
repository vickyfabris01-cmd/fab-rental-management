import { db } from "../../config/supabase";

// =============================================================================
// lib/api/tenancies.js
//
// Operations on `tenancies` and `room_transfers`.
// Financial immutability note: tenancy status changes are UPDATE-based (status
// field only) — actual billing is immutable in billing_cycles rows.
// =============================================================================

const TENANCY_SELECT = `
  id, tenant_id, room_id, client_id, request_id, rental_request_id,
  status, move_in_date, move_out_date, billing_type, agreed_price,
  approved_by, notes, created_at, updated_at,
  rooms(id, room_number, room_type, monthly_price, buildings(id, name)),
  profiles!client_id(id, full_name, avatar_url, phone, email)
`;

const TRANSFER_SELECT = `
  id, tenant_id, tenancy_id, from_room_id, to_room_id,
  transfer_date, reason, approved_by, created_at,
  from_room:rooms!from_room_id(id, room_number, buildings(name)),
  to_room:rooms!to_room_id(id, room_number, buildings(name))
`;

// ─────────────────────────────────────────────────────────────────────────────
// getTenancies
// All tenancies for a tenant (manager / owner view).
//
// @param {string} tenantId
// @param {object} [opts]
// @param {string}   [opts.status]    'active' | 'completed' | 'terminated' | 'transferred'
// @param {string}   [opts.roomId]    Filter by room
// @param {number}   [opts.limit]
// @param {number}   [opts.offset]
// ─────────────────────────────────────────────────────────────────────────────
export async function getTenancies(tenantId, opts = {}) {
  let query = db
    .tenancies()
    .select(TENANCY_SELECT)
    .eq("tenant_id", tenantId)
    .order("move_in_date", { ascending: false });

  if (opts.status) query = query.eq("status", opts.status);
  if (opts.roomId) query = query.eq("room_id", opts.roomId);
  if (opts.limit) query = query.limit(opts.limit);
  if (opts.offset)
    query = query.range(opts.offset, opts.offset + (opts.limit ?? 50) - 1);

  const { data, error } = await query;
  return { data: data ?? [], error };
}

// ─────────────────────────────────────────────────────────────────────────────
// getMyTenancy
// Returns the single active tenancy for a client (there can only be one).
//
// @param {string} clientId
// ─────────────────────────────────────────────────────────────────────────────
export async function getMyTenancy(clientId) {
  const { data, error } = await db
    .tenancies()
    .select(TENANCY_SELECT)
    .eq("client_id", clientId)
    .eq("status", "active")
    .maybeSingle(); // returns null (not error) if no active tenancy
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// getTenancy
// Single tenancy by ID.
// ─────────────────────────────────────────────────────────────────────────────
export async function getTenancy(tenancyId) {
  const { data, error } = await db
    .tenancies()
    .select(TENANCY_SELECT)
    .eq("id", tenancyId)
    .single();
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// createTenancy
// Move a client in. Creates the tenancy row; the DB trigger fires to:
//   1. Generate 12 monthly (or 2 semester) billing_cycles
//   2. Set room status → 'occupied'
//
// @param {object} payload
// @param {string} payload.tenantId
// @param {string} payload.roomId
// @param {string} [payload.bedId]
// @param {string} payload.clientId
// @param {string} [payload.rentalRequestId]
// @param {string} payload.moveInDate         ISO date
// @param {string} payload.billingType        'monthly' | 'semester'
// @param {number} payload.agreedPrice
// @param {string} [payload.approvedBy]       Manager UUID
// @param {string} [payload.notes]
// ─────────────────────────────────────────────────────────────────────────────
export async function createTenancy({
  tenantId,
  roomId,
  bedId,
  clientId,
  rentalRequestId,
  moveInDate,
  billingType,
  agreedPrice,
  approvedBy,
  notes,
}) {
  const { data, error } = await db
    .tenancies()
    .insert({
      tenant_id: tenantId,
      room_id: roomId,
      client_id: clientId,
      request_id: rentalRequestId ?? null,
      rental_request_id: rentalRequestId ?? null,
      move_in_date: moveInDate,
      billing_type: billingType,
      agreed_price: agreedPrice,
      approved_by: approvedBy ?? null,
      notes: notes?.trim() ?? null,
      status: "active",
    })
    .select(TENANCY_SELECT)
    .single();
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// moveOut
// Records the move-out date and sets status → 'completed'.
// The DB trigger sets room status → 'available'.
//
// @param {string} tenancyId
// @param {string} moveOutDate   ISO date
// @param {string} [notes]
// ─────────────────────────────────────────────────────────────────────────────
export async function moveOut(tenancyId, moveOutDate, notes) {
  const { data, error } = await db
    .tenancies()
    .update({
      status: "completed",
      move_out_date: moveOutDate,
      notes: notes?.trim() ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", tenancyId)
    .select(TENANCY_SELECT)
    .single();
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// terminateTenancy
// Hard termination (eviction etc.). Sets status → 'terminated'.
// ─────────────────────────────────────────────────────────────────────────────
export async function terminateTenancy(tenancyId, notes) {
  const { data, error } = await db
    .tenancies()
    .update({
      status: "terminated",
      notes: notes?.trim() ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", tenancyId)
    .select("id, status")
    .single();
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// Room transfers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Client requests a room transfer.
 *
 * @param {object} payload
 * @param {string} payload.tenantId
 * @param {string} payload.tenancyId
 * @param {string} payload.fromRoomId
 * @param {string} payload.toRoomId
 * @param {string} [payload.fromBedId]
 * @param {string} [payload.toBedId]
 * @param {string} payload.transferDate   ISO date
 * @param {string} [payload.reason]
 */
export async function requestTransfer({
  tenantId,
  tenancyId,
  fromRoomId,
  toRoomId,
  fromBedId,
  toBedId,
  transferDate,
  reason,
}) {
  const { data, error } = await db
    .roomTransfers()
    .insert({
      tenant_id: tenantId,
      tenancy_id: tenancyId,
      from_room_id: fromRoomId,
      to_room_id: toRoomId,
      from_bed_id: fromBedId ?? null,
      to_bed_id: toBedId ?? null,
      transfer_date: transferDate,
      reason: reason?.trim() ?? null,
    })
    .select(TRANSFER_SELECT)
    .single();
  return { data, error };
}

/**
 * Manager approves a transfer — updates the transfer row and the tenancy room.
 */
export async function approveTransfer(transferId, approvedBy) {
  // Fetch transfer to get the new room
  const { data: transfer, error: fetchErr } = await db
    .roomTransfers()
    .select("tenancy_id, to_room_id, to_bed_id")
    .eq("id", transferId)
    .single();

  if (fetchErr) return { data: null, error: fetchErr };

  // Update the transfer record
  await db
    .roomTransfers()
    .update({ approved_by: approvedBy })
    .eq("id", transferId);

  // Move the tenancy to the new room
  const { data, error } = await db
    .tenancies()
    .update({
      room_id: transfer.to_room_id,
      bed_id: transfer.to_bed_id ?? null,
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", transfer.tenancy_id)
    .select(TENANCY_SELECT)
    .single();

  return { data, error };
}

/**
 * List transfer history for a tenant.
 */
export async function getTransfers(tenantId, opts = {}) {
  let query = db
    .roomTransfers()
    .select(TRANSFER_SELECT)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (opts.tenancyId) query = query.eq("tenancy_id", opts.tenancyId);
  if (opts.limit) query = query.limit(opts.limit);

  const { data, error } = await query;
  return { data: data ?? [], error };
}

// ─────────────────────────────────────────────────────────────────────────────
// getActiveTenantsCount
// Quick count for dashboard stats.
// ─────────────────────────────────────────────────────────────────────────────
export async function getActiveTenantsCount(tenantId) {
  const { count, error } = await db
    .tenancies()
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "active");
  return { count: count ?? 0, error };
}
