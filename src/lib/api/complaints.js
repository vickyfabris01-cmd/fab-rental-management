import { db } from "../../config/supabase";

// =============================================================================
// lib/api/complaints.js
//
// Operations on `complaints` and `complaint_messages`.
// =============================================================================

const COMPLAINT_SELECT = `
  id, tenant_id, submitted_by, tenancy_id, category,
  title, body, status, priority, assigned_to,
  resolved_at, created_at, updated_at,
  submitter:profiles!submitted_by(id, full_name, avatar_url, phone),
  assignee:profiles!assigned_to(id, full_name, avatar_url)
`;

const MESSAGE_SELECT = `
  id, complaint_id, sender_id, body, attachments, created_at,
  profiles!sender_id(id, full_name, avatar_url, role)
`;

// ─────────────────────────────────────────────────────────────────────────────
// getComplaints
// List complaints for a tenant (manager / owner view).
//
// @param {string} tenantId
// @param {object} [opts]
// @param {string}   [opts.status]     'open' | 'in_progress' | 'resolved' | 'closed'
// @param {string}   [opts.priority]   'low' | 'normal' | 'high' | 'urgent'
// @param {string}   [opts.assignedTo] Filter by assigned manager
// @param {number}   [opts.limit]
// @param {number}   [opts.offset]
// ─────────────────────────────────────────────────────────────────────────────
export async function getComplaints(tenantId, opts = {}) {
  let query = db
    .complaints()
    .select(COMPLAINT_SELECT)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (opts.status)     query = query.eq("status", opts.status);
  if (opts.priority)   query = query.eq("priority", opts.priority);
  if (opts.assignedTo) query = query.eq("assigned_to", opts.assignedTo);
  if (opts.limit)      query = query.limit(opts.limit);
  if (opts.offset)     query = query.range(opts.offset, opts.offset + (opts.limit ?? 50) - 1);

  const { data, error } = await query;
  return { data: data ?? [], error };
}

// ─────────────────────────────────────────────────────────────────────────────
// getMyComplaints
// Client view — complaints the authenticated user submitted.
// ─────────────────────────────────────────────────────────────────────────────
export async function getMyComplaints(submittedBy, opts = {}) {
  let query = db
    .complaints()
    .select(COMPLAINT_SELECT)
    .eq("submitted_by", submittedBy)
    .order("created_at", { ascending: false });

  if (opts.status) query = query.eq("status", opts.status);
  if (opts.limit)  query = query.limit(opts.limit);

  const { data, error } = await query;
  return { data: data ?? [], error };
}

// ─────────────────────────────────────────────────────────────────────────────
// getComplaint
// Single complaint with full detail.
// ─────────────────────────────────────────────────────────────────────────────
export async function getComplaint(complaintId) {
  const { data, error } = await db
    .complaints()
    .select(COMPLAINT_SELECT)
    .eq("id", complaintId)
    .single();
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// createComplaint
//
// @param {object} payload
// @param {string} payload.tenantId
// @param {string} payload.submittedBy   Client profile UUID
// @param {string} [payload.tenancyId]
// @param {string} payload.title
// @param {string} payload.description
// @param {string} [payload.category]    'maintenance' | 'noise' | 'billing' | 'other'
// @param {string} [payload.priority]    'low' | 'normal' | 'high' | 'urgent'
// ─────────────────────────────────────────────────────────────────────────────
export async function createComplaint({
  tenantId, submittedBy, tenancyId,
  title, description, category, priority,
}) {
  const { data, error } = await db
    .complaints()
    .insert({
      tenant_id:    tenantId,
      submitted_by: submittedBy,
      tenancy_id:   tenancyId  ?? null,
      title:        title.trim(),
      body:         description?.trim() ?? "",
      category:     category  ?? "other",
      priority:     priority  ?? "normal",
      status:       "open",
    })
    .select(COMPLAINT_SELECT)
    .single();
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// updateComplaintStatus
// Manager / owner action to change complaint status or re-assign.
//
// @param {string} complaintId
// @param {object} updates
// @param {string}   [updates.status]     'open' | 'in_progress' | 'resolved' | 'closed'
// @param {string}   [updates.priority]
// @param {string}   [updates.assignedTo] Profile UUID
// ─────────────────────────────────────────────────────────────────────────────
export async function updateComplaintStatus(complaintId, updates) {
  const patch = { updated_at: new Date().toISOString() };

  if (updates.status)     patch.status      = updates.status;
  if (updates.priority)   patch.priority    = updates.priority;
  if (updates.assignedTo !== undefined) patch.assigned_to = updates.assignedTo;

  if (updates.status === "resolved") {
    patch.resolved_at = new Date().toISOString();
  }

  const { data, error } = await db
    .complaints()
    .update(patch)
    .eq("id", complaintId)
    .select(COMPLAINT_SELECT)
    .single();
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// Messages
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Load all messages for a complaint thread, oldest-first.
 */
export async function getComplaintMessages(complaintId) {
  const { data, error } = await db
    .complaintMessages()
    .select(MESSAGE_SELECT)
    .eq("complaint_id", complaintId)
    .order("created_at", { ascending: true });
  return { data: data ?? [], error };
}

/**
 * Post a new message to a complaint thread.
 *
 * @param {object} payload
 * @param {string} payload.tenantId
 * @param {string} payload.complaintId
 * @param {string} payload.senderId       Profile UUID
 * @param {string} payload.body
 * @param {string[]} [payload.attachments] Supabase Storage URLs
 */
export async function addComplaintMessage({ tenantId, complaintId, senderId, body, attachments }) {
  // Also bump the complaint updated_at so it surfaces in lists
  await db
    .complaints()
    .update({ updated_at: new Date().toISOString() })
    .eq("id", complaintId);

  const { data, error } = await db
    .complaintMessages()
    .insert({
      tenant_id:    tenantId,
      complaint_id: complaintId,
      sender_id:    senderId,
      body:         body.trim(),
      attachments:  attachments ?? [],
    })
    .select(MESSAGE_SELECT)
    .single();
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// getOpenComplaintsCount
// Dashboard badge count.
// ─────────────────────────────────────────────────────────────────────────────
export async function getOpenComplaintsCount(tenantId) {
  const { count, error } = await db
    .complaints()
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .in("status", ["open", "in_progress"]);
  return { count: count ?? 0, error };
}
