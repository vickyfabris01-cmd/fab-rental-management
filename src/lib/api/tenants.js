import { db } from "../../config/supabase";

// =============================================================================
// lib/api/tenants.js
//
// Super-admin operations on the `tenants` table.
// All functions here are RLS-gated to super_admin role at the DB level.
// Regular managers / owners / clients will get empty data or an error if
// they somehow call these.
// =============================================================================

const TENANT_SELECT = `
  id, name, slug, email, phone, address, county, country,
  logo_url, status, plan, created_at, updated_at
`;

const TENANT_DETAIL_SELECT = `
  ${TENANT_SELECT.trim()},
  tenant_branding(primary_color, secondary_color, logo_url, font_family),
  tenant_settings(billing_type, currency, billing_due_day)
`;

// ─────────────────────────────────────────────────────────────────────────────
// getTenants
// List all tenant accounts on the platform.
//
// @param {object} [opts]
// @param {string}   [opts.status]   'pending' | 'active' | 'suspended'
// @param {string}   [opts.search]   Name / email search term
// @param {number}   [opts.limit]
// @param {number}   [opts.offset]
// ─────────────────────────────────────────────────────────────────────────────
export async function getTenants(opts = {}) {
  let query = db
    .tenants()
    .select(TENANT_SELECT)
    .order("created_at", { ascending: false });

  if (opts.status) query = query.eq("status", opts.status);
  if (opts.search) query = query.or(`name.ilike.%${opts.search}%,email.ilike.%${opts.search}%`);
  if (opts.limit)  query = query.limit(opts.limit);
  if (opts.offset) query = query.range(opts.offset, opts.offset + (opts.limit ?? 50) - 1);

  const { data, error } = await query;
  return { data: data ?? [], error };
}

// ─────────────────────────────────────────────────────────────────────────────
// getTenant
// Single tenant with branding and settings.
// ─────────────────────────────────────────────────────────────────────────────
export async function getTenant(tenantId) {
  const { data, error } = await db
    .tenants()
    .select(TENANT_DETAIL_SELECT)
    .eq("id", tenantId)
    .single();
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// getTenantBySlug
// Used on the public property detail page — slug-based lookup.
// ─────────────────────────────────────────────────────────────────────────────
export async function getTenantBySlug(slug) {
  const { data, error } = await db
    .tenants()
    .select(TENANT_DETAIL_SELECT)
    .eq("slug", slug)
    // No status filter — RLS handles access (active tenants visible publicly,
    // managers can see their own pending tenant)
    .single();
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// approveTenant
// Super admin approves a pending tenant signup → status: 'active'.
// ─────────────────────────────────────────────────────────────────────────────
export async function approveTenant(tenantId) {
  const { data, error } = await db
    .tenants()
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("id", tenantId)
    .select(TENANT_SELECT)
    .single();
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// suspendTenant
// Suspends an active tenant. All RLS policies check status indirectly via
// the profile.tenant_id relationship, so data is still accessible by
// super_admin for review.
// ─────────────────────────────────────────────────────────────────────────────
export async function suspendTenant(tenantId) {
  const { data, error } = await db
    .tenants()
    .update({ status: "suspended", updated_at: new Date().toISOString() })
    .eq("id", tenantId)
    .select(TENANT_SELECT)
    .single();
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// reactivateTenant
// Restores a suspended tenant to active status.
// ─────────────────────────────────────────────────────────────────────────────
export async function reactivateTenant(tenantId) {
  const { data, error } = await db
    .tenants()
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("id", tenantId)
    .select(TENANT_SELECT)
    .single();
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// updateTenant
// General update (name, contact info, plan, etc.).
// ─────────────────────────────────────────────────────────────────────────────
export async function updateTenant(tenantId, updates) {
  const { status: _s, id: _i, created_at: _c, slug: _sl, ...safe } = updates;
  const { data, error } = await db
    .tenants()
    .update({ ...safe, updated_at: new Date().toISOString() })
    .eq("id", tenantId)
    .select(TENANT_SELECT)
    .single();
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// getPlatformStats
// Quick aggregate stats for the super admin overview dashboard.
// Returns total tenants by status + user counts.
// ─────────────────────────────────────────────────────────────────────────────
export async function getPlatformStats() {
  const [tenantsRes, profilesRes] = await Promise.all([
    db.tenants().select("status"),
    db.profiles().select("role"),
  ]);

  if (tenantsRes.error || profilesRes.error) {
    return {
      data: null,
      error: tenantsRes.error ?? profilesRes.error,
    };
  }

  const tenantCounts = (tenantsRes.data ?? []).reduce(
    (acc, t) => { acc[t.status] = (acc[t.status] ?? 0) + 1; acc.total++; return acc; },
    { total: 0, active: 0, pending: 0, suspended: 0 }
  );

  const roleCounts = (profilesRes.data ?? []).reduce(
    (acc, p) => { acc[p.role] = (acc[p.role] ?? 0) + 1; acc.total++; return acc; },
    { total: 0, client: 0, manager: 0, owner: 0, worker: 0, visitor: 0 }
  );

  return {
    data: { tenants: tenantCounts, users: roleCounts },
    error: null,
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// createTenant
// Super admin creates a new tenant (rental business) on the platform.
// Also bootstraps tenant_branding and tenant_settings rows.
//
// @param {object} payload
// @param {string}   payload.name
// @param {string}   [payload.email]
// @param {string}   [payload.phone]
// @param {string}   [payload.address]
// @param {string}   [payload.county]
// @param {string}   [payload.plan]       'basic' | 'pro' | 'enterprise'
// @param {string}   [payload.ownerUserId] profile id to assign as owner
// ─────────────────────────────────────────────────────────────────────────────
export async function createTenant(payload) {
  const { ownerUserId, ...tenantData } = payload;

  // 1. Generate slug from name
  const slug = tenantData.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const { data: tenant, error: tenantError } = await db
    .tenants()
    .insert({
      name:          tenantData.name.trim(),
      slug:          `${slug}-${Date.now().toString(36)}`,  // ensure uniqueness
      status:        "pending",
      plan:          tenantData.plan     ?? "basic",
      email:         tenantData.email    ?? null,
      phone:         tenantData.phone    ?? null,
      address:       tenantData.address  ?? null,
      county:        tenantData.county   ?? null,
      country:       "Kenya",
      owner_user_id: ownerUserId         ?? null,
    })
    .select(TENANT_SELECT)
    .single();

  if (tenantError) return { data: null, error: tenantError };

  // 2. Bootstrap branding row
  await db.tenantBranding().insert({
    tenant_id:       tenant.id,
    primary_color:   "#C5612C",
    secondary_color: "#1A1412",
    font_family:     "DM Sans",
  });

  // 3. Bootstrap settings row
  await db.tenantSettings().insert({
    tenant_id:        tenant.id,
    billing_type:     "monthly",
    billing_due_day:  5,
    grace_period_days:3,
    currency:         "KES",
    email_enabled:    true,
    sms_enabled:      false,
  });

  // 4. If an owner was provided, link their profile to this tenant and set role
  if (ownerUserId) {
    await db
      .profiles()
      .update({ tenant_id: tenant.id, role: "owner", updated_at: new Date().toISOString() })
      .eq("id", ownerUserId);
  }

  return { data: tenant, error: null };
}

// ─────────────────────────────────────────────────────────────────────────────
// assignUserToTenant
// Links an existing user (by profile id) to a tenant with a given role.
// Used to assign owner or manager after tenant creation.
//
// @param {string} tenantId
// @param {string} userId     — profiles.id
// @param {string} role       — 'owner' | 'manager'
// ─────────────────────────────────────────────────────────────────────────────
export async function assignUserToTenant(tenantId, userId, role) {
  const { data, error } = await db
    .profiles()
    .update({
      tenant_id:  tenantId,
      role:       role,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("id, full_name, email, role, tenant_id")
    .single();

  // Also update the tenant's owner_user_id if assigning owner
  if (!error && role === "owner") {
    await db
      .tenants()
      .update({ owner_user_id: userId, updated_at: new Date().toISOString() })
      .eq("id", tenantId);
  }

  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// removeUserFromTenant
// Unlinks a user from a tenant — resets to visitor role.
//
// @param {string} userId  — profiles.id
// ─────────────────────────────────────────────────────────────────────────────
export async function removeUserFromTenant(userId) {
  const { data, error } = await db
    .profiles()
    .update({ tenant_id: null, role: "visitor", updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select("id, full_name, role")
    .single();
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// getPendingTenantCount
// Super admin nav badge count.
// ─────────────────────────────────────────────────────────────────────────────
export async function getPendingTenantCount() {
  const { count, error } = await db
    .tenants()
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  return { count: count ?? 0, error };
}
