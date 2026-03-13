import { supabase, db, BUCKETS, uploadFile } from "../../config/supabase";

// =============================================================================
// lib/api/profile.js
//
// Operations on the `profiles` table — the extension of auth.users that holds
// role, tenant_id, and display information.
// =============================================================================

const PROFILE_SELECT =
  "id, role, tenant_id, full_name, avatar_url, phone, email, created_at, updated_at";

// ─────────────────────────────────────────────────────────────────────────────
// fetchProfile
// Loads a single profile row by user ID.
//
// @param {string} userId   auth.users UUID
// @returns {Promise<{ data: object | null, error }>}
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchProfile(userId) {
  const { data, error } = await db
    .profiles()
    .select(PROFILE_SELECT)
    .eq("id", userId)
    .single();
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// updateProfile
// Updates display fields on the caller's own profile row.
// Role and tenant_id changes are NOT permitted from the client — those go
// through FastAPI role-elevation endpoints.
//
// @param {string} userId
// @param {object} updates   { full_name?, phone?, email? }
// @returns {Promise<{ data, error }>}
// ─────────────────────────────────────────────────────────────────────────────
export async function updateProfile(userId, updates) {
  // Strip out protected columns before writing
  const { role: _r, tenant_id: _t, id: _i, created_at: _c, ...safe } = updates;

  const { data, error } = await db
    .profiles()
    .update({ ...safe, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select(PROFILE_SELECT)
    .single();
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// updateAvatar
// Uploads a new avatar image to Supabase Storage and updates the profile row.
//
// @param {string} userId
// @param {File}   file     Browser File object (image/*)
// @returns {Promise<{ data: { avatar_url: string } | null, error }>}
// ─────────────────────────────────────────────────────────────────────────────
export async function updateAvatar(userId, file) {
  const ext  = file.name.split(".").pop();
  const path = `${userId}/avatar.${ext}`;

  let avatarUrl;
  try {
    avatarUrl = await uploadFile(BUCKETS.AVATARS, path, file, { upsert: true });
  } catch (err) {
    return { data: null, error: err };
  }

  const { data, error } = await db
    .profiles()
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select("id, avatar_url")
    .single();
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// fetchTenantProfiles
// Returns all profiles belonging to a tenant (managers + clients + workers).
// Only managers / owners can call this — RLS enforces.
//
// @param {string} tenantId
// @param {{ role?: string, limit?: number, offset?: number }} [opts]
// @returns {Promise<{ data: object[], error }>}
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchTenantProfiles(tenantId, opts = {}) {
  let query = db
    .profiles()
    .select(PROFILE_SELECT)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (opts.role)   query = query.eq("role", opts.role);
  if (opts.limit)  query = query.limit(opts.limit);
  if (opts.offset) query = query.range(opts.offset, opts.offset + (opts.limit ?? 50) - 1);

  const { data, error } = await query;
  return { data: data ?? [], error };
}

// ─────────────────────────────────────────────────────────────────────────────
// searchProfiles
// Full-text search on full_name within a tenant.
// Used for the manager's resident search / assign-worker dropdowns.
//
// @param {string} tenantId
// @param {string} query      Search term (name or email fragment)
// @returns {Promise<{ data: object[], error }>}
// ─────────────────────────────────────────────────────────────────────────────
export async function searchProfiles(tenantId, query) {
  const { data, error } = await db
    .profiles()
    .select("id, full_name, avatar_url, role, email, phone")
    .eq("tenant_id", tenantId)
    .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(20);
  return { data: data ?? [], error };
}

// ─────────────────────────────────────────────────────────────────────────────
// fetchManagerInvites
// Lists all pending/accepted invites for a tenant.
//
// @param {string} tenantId
// @returns {Promise<{ data: object[], error }>}
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchManagerInvites(tenantId) {
  const { data, error } = await db
    .managerInvites()
    .select("id, email, status, expires_at, created_at, invited_by, profiles!invited_by(full_name)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  return { data: data ?? [], error };
}

// ─────────────────────────────────────────────────────────────────────────────
// sendManagerInvite
// Creates a manager_invites row. The actual email is sent by FastAPI.
//
// @param {string} tenantId
// @param {string} email
// @param {string} invitedBy   Profile UUID of the sender
// @returns {Promise<{ data, error }>}
// ─────────────────────────────────────────────────────────────────────────────
export async function sendManagerInvite(tenantId, email, invitedBy) {
  const { data, error } = await db
    .managerInvites()
    .insert({ tenant_id: tenantId, email: email.trim().toLowerCase(), invited_by: invitedBy })
    .select()
    .single();
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// fetchInviteByToken
// Loads an invite row by its token. Used on the /invite/:token page.
// The invites_token_lookup RLS policy allows this without authentication.
//
// @param {string} token
// @returns {Promise<{ data: object | null, error }>}
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchInviteByToken(token) {
  const { data, error } = await db
    .managerInvites()
    .select("id, tenant_id, email, status, expires_at, tenants(name, slug)")
    .eq("token", token)
    .single();
  return { data, error };
}
