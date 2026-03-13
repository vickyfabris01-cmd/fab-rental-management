import { db } from "../../config/supabase";

// =============================================================================
// lib/api/notifications.js
//
// Direct Supabase operations on `notifications`.
// These raw functions are used by notificationStore — components use
// useNotifications() hook which wraps the store.
// =============================================================================

const NOTIF_SELECT =
  "id, tenant_id, user_id, type, title, body, is_read, metadata, created_at";

// ─────────────────────────────────────────────────────────────────────────────
// getNotifications
// Loads notifications for a user, newest first.
//
// @param {string} userId
// @param {object} [opts]
// @param {boolean}  [opts.unreadOnly]  If true, only return unread rows
// @param {number}   [opts.limit]       Default 50
// ─────────────────────────────────────────────────────────────────────────────
export async function getNotifications(userId, opts = {}) {
  let query = db
    .notifications()
    .select(NOTIF_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 50);

  if (opts.unreadOnly) query = query.eq("is_read", false);

  const { data, error } = await query;
  return { data: data ?? [], error };
}

// ─────────────────────────────────────────────────────────────────────────────
// markRead
// Marks a single notification as read.
//
// @param {string} notificationId
// ─────────────────────────────────────────────────────────────────────────────
export async function markRead(notificationId) {
  const { data, error } = await db
    .notifications()
    .update({ is_read: true })
    .eq("id", notificationId)
    .select("id, is_read")
    .single();
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// markAllRead
// Marks all unread notifications for a user as read.
//
// @param {string} userId
// ─────────────────────────────────────────────────────────────────────────────
export async function markAllRead(userId) {
  const { error } = await db
    .notifications()
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  return { error };
}

// ─────────────────────────────────────────────────────────────────────────────
// getUnreadCount
// Quick count for the bell badge.
//
// @param {string} userId
// @returns {Promise<{ count: number, error }>}
// ─────────────────────────────────────────────────────────────────────────────
export async function getUnreadCount(userId) {
  const { count, error } = await db
    .notifications()
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  return { count: count ?? 0, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// createNotification
// Creates an in-system notification row.
// Typically called by FastAPI after a payment, request update, etc.
// The frontend can call this for manager-to-client announcements.
//
// @param {object} payload
// @param {string}   payload.tenantId
// @param {string}   payload.userId       Recipient profile UUID
// @param {string}   payload.type         e.g. 'payment_confirmed' | 'request_approved' | 'complaint_update'
// @param {string}   payload.title
// @param {string}   [payload.body]
// @param {object}   [payload.metadata]   Arbitrary context (billing_cycle_id, etc.)
// ─────────────────────────────────────────────────────────────────────────────
export async function createNotification({ tenantId, userId, type, title, body, metadata }) {
  const { data, error } = await db
    .notifications()
    .insert({
      tenant_id: tenantId ?? null,
      user_id:   userId,
      type,
      title:     title.trim(),
      body:      body?.trim() ?? null,
      metadata:  metadata ?? {},
      is_read:   false,
    })
    .select(NOTIF_SELECT)
    .single();
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// broadcastNotification
// Creates the same notification for multiple recipients at once.
// Used for manager announcements (all clients, all workers, etc.).
//
// @param {string}   tenantId
// @param {string[]} userIds     Array of profile UUIDs
// @param {object}   payload     { type, title, body?, metadata? }
// ─────────────────────────────────────────────────────────────────────────────
export async function broadcastNotification(tenantId, userIds, { type, title, body, metadata }) {
  if (!userIds.length) return { data: [], error: null };

  const rows = userIds.map(userId => ({
    tenant_id: tenantId,
    user_id:   userId,
    type,
    title:     title.trim(),
    body:      body?.trim() ?? null,
    metadata:  metadata ?? {},
    is_read:   false,
  }));

  const { data, error } = await db
    .notifications()
    .insert(rows)
    .select(NOTIF_SELECT);
  return { data: data ?? [], error };
}

// ─────────────────────────────────────────────────────────────────────────────
// deleteNotification
// Soft-delete isn't modelled — just remove the row for the current user.
// RLS prevents deleting another user's notifications.
//
// @param {string} notificationId
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteNotification(notificationId) {
  const { error } = await db.notifications().delete().eq("id", notificationId);
  return { error };
}
