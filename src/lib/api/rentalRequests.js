import { db } from "../../config/supabase";

// =============================================================================
// lib/api/rentalRequests.js
//
// Operations on the `rental_requests` table.
// Flow: visitor submits → pending → manager offers → client accepts → tenancy created
// =============================================================================

const REQUEST_SELECT = `
  id, tenant_id, room_id, requester_id, status,
  message, preferred_move_in, reviewed_by, reviewed_at,
  offer_expires_at, created_at, updated_at,
  rooms(id, room_number, room_type, monthly_price, buildings(name)),
  profiles!requester_id(id, full_name, avatar_url, phone, email)
`;

// ─────────────────────────────────────────────────────────────────────────────
// getRequests
// List rental requests for a tenant. Managers see all; clients see their own
// (RLS enforces this at the DB level).
//
// @param {string} tenantId
// @param {object} [opts]
// @param {string}   [opts.status]      'pending' | 'offered' | 'accepted' | 'rejected' | 'expired'
// @param {string}   [opts.requesterId] Filter to a specific client
// @param {number}   [opts.limit]
// @param {number}   [opts.offset]
// ─────────────────────────────────────────────────────────────────────────────
export async function getRequests(tenantId, opts = {}) {
  let query = db
    .rentalRequests()
    .select(REQUEST_SELECT)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (opts.status)      query = query.eq("status", opts.status);
  if (opts.requesterId) query = query.eq("requester_id", opts.requesterId);
  if (opts.limit)       query = query.limit(opts.limit);
  if (opts.offset)      query = query.range(opts.offset, opts.offset + (opts.limit ?? 50) - 1);

  const { data, error } = await query;
  return { data: data ?? [], error };
}

// ─────────────────────────────────────────────────────────────────────────────
// getMyRequests
// Returns all rental requests submitted by the current user (client view).
//
// @param {string} requesterId   auth.users UUID
// ─────────────────────────────────────────────────────────────────────────────
export async function getMyRequests(requesterId) {
  const { data, error } = await db
    .rentalRequests()
    .select(REQUEST_SELECT)
    .eq("requester_id", requesterId)
    .order("created_at", { ascending: false });
  return { data: data ?? [], error };
}

// ─────────────────────────────────────────────────────────────────────────────
// getRequest
// Single request by ID.
// ─────────────────────────────────────────────────────────────────────────────
export async function getRequest(requestId) {
  const { data, error } = await db
    .rentalRequests()
    .select(REQUEST_SELECT)
    .eq("id", requestId)
    .single();
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// createRequest
// Visitor / client submits a rental request for a room.
//
// @param {object} payload
// @param {string} payload.tenantId
// @param {string} payload.roomId
// @param {string} payload.requesterId
// @param {string} [payload.message]
// @param {string} [payload.preferredMoveIn]   ISO date string
// ─────────────────────────────────────────────────────────────────────────────
export async function createRequest({ tenantId, roomId, requesterId, message, preferredMoveIn }) {
  const { data, error } = await db
    .rentalRequests()
    .insert({
      tenant_id:          tenantId,
      room_id:            roomId,
      requester_id:       requesterId,
      message:            message?.trim() ?? null,
      preferred_move_in:  preferredMoveIn ?? null,
      status:             "pending",
    })
    .select(REQUEST_SELECT)
    .single();
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// approveRequest
// Manager moves a request to 'offered' status with an optional offer expiry.
//
// @param {string} requestId
// @param {string} reviewedBy       Manager's profile UUID
// @param {string} [offerExpiresAt] ISO timestamp — e.g. 48h from now
// ─────────────────────────────────────────────────────────────────────────────
export async function approveRequest(requestId, reviewedBy, offerExpiresAt) {
  const expiryDefault = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  const { data, error } = await db
    .rentalRequests()
    .update({
      status:           "offered",
      reviewed_by:      reviewedBy,
      reviewed_at:      new Date().toISOString(),
      offer_expires_at: offerExpiresAt ?? expiryDefault,
    })
    .eq("id", requestId)
    .select(REQUEST_SELECT)
    .single();
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// rejectRequest
// Manager rejects a request.
// ─────────────────────────────────────────────────────────────────────────────
export async function rejectRequest(requestId, reviewedBy) {
  const { data, error } = await db
    .rentalRequests()
    .update({
      status:      "rejected",
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .select(REQUEST_SELECT)
    .single();
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// acceptOffer
// Client accepts an offer — status becomes 'accepted'.
// The actual tenancy creation is then triggered via createTenancy().
// ─────────────────────────────────────────────────────────────────────────────
export async function acceptOffer(requestId) {
  const { data, error } = await db
    .rentalRequests()
    .update({ status: "accepted", updated_at: new Date().toISOString() })
    .eq("id", requestId)
    .select(REQUEST_SELECT)
    .single();
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// expireRequest
// Mark a request as expired (run server-side by cron, or optimistically by UI).
// ─────────────────────────────────────────────────────────────────────────────
export async function expireRequest(requestId) {
  const { data, error } = await db
    .rentalRequests()
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .eq("id", requestId)
    .select("id, status")
    .single();
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// getPendingCount
// Quick count for dashboard badge — pending requests for a tenant.
// ─────────────────────────────────────────────────────────────────────────────
export async function getPendingRequestCount(tenantId) {
  const { count, error } = await db
    .rentalRequests()
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "pending");
  return { count: count ?? 0, error };
}
