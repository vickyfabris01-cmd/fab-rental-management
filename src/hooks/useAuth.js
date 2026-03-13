import { useEffect } from "react";
import useAuthStore from "../store/authStore";
import useTenantStore from "../store/tenantStore";
import useNotificationStore from "../store/notificationStore";

// =============================================================================
// useAuth
//
// The primary auth hook for components. Wraps authStore and adds:
//   - Derived boolean flags (isAuthenticated, isLoading, etc.)
//   - Role-check helpers (hasRole, hasAnyRole, can)
//   - Avatar / display-name helpers
//
// This hook does NOT call init() — that is done once in AppLoader.
// Components just subscribe to the already-hydrated store state.
//
// Usage:
//   const { user, profile, role, isAuthenticated, signOut } = useAuth();
//   const { hasRole, can } = useAuth();
//
//   if (hasRole("manager")) { ... }
//   if (can("manage_properties")) { ... }
// =============================================================================

// ── Permission map ─────────────────────────────────────────────────────────────
// Maps named permissions → which roles hold them.
// Add entries here as new features are built; keep it co-located with useAuth
// so permission rules are in one place.
const PERMISSION_MAP = {
  // Resident actions
  view_own_billing:        ["client"],
  pay_rent:                ["client"],
  submit_complaint:        ["client", "manager", "owner"],
  request_room_transfer:   ["client"],

  // Property management
  manage_properties:       ["manager", "owner"],
  manage_rooms:            ["manager", "owner"],
  invite_manager:          ["manager", "owner"],
  approve_rental_requests: ["manager", "owner"],
  record_manual_payment:   ["manager", "owner"],
  generate_invoice:        ["manager", "owner"],
  make_announcement:       ["manager", "owner"],

  // Workforce
  manage_workers:          ["manager", "owner"],
  record_attendance:       ["manager"],
  run_payroll:             ["manager", "owner"],

  // Owner-only analytics
  view_financial_reports:  ["owner", "super_admin"],
  view_worker_costs:       ["owner", "super_admin"],
  view_analytics:          ["owner", "super_admin"],

  // Platform admin
  manage_tenants:          ["super_admin"],
  view_platform_revenue:   ["super_admin"],
  manage_all_users:        ["super_admin"],
  view_audit_log:          ["super_admin"],
};

// =============================================================================
// Hook
// =============================================================================
export function useAuth() {
  const user             = useAuthStore(s => s.user);
  const profile          = useAuthStore(s => s.profile);
  const loading          = useAuthStore(s => s.loading);
  const error            = useAuthStore(s => s.error);
  const signIn           = useAuthStore(s => s.signIn);
  const signUp           = useAuthStore(s => s.signUp);
  const signOut          = useAuthStore(s => s.signOut);
  const sendPasswordReset= useAuthStore(s => s.sendPasswordReset);
  const updatePassword   = useAuthStore(s => s.updatePassword);
  const refreshProfile   = useAuthStore(s => s.refreshProfile);
  const updateProfile    = useAuthStore(s => s.updateProfile);
  const acceptInvite     = useAuthStore(s => s.acceptInvite);
  const clearError       = useAuthStore(s => s.clearError);

  // ── Derived state ─────────────────────────────────────────────────────────
  const isAuthenticated  = user !== null;
  const isLoading        = loading;
  const role             = profile?.role ?? null;
  const tenantId         = profile?.tenant_id ?? null;
  const userId           = user?.id ?? null;

  // ── Display helpers ───────────────────────────────────────────────────────
  /** Full name, falling back to email, then "User" */
  const displayName = profile?.full_name?.trim() || user?.email?.split("@")[0] || "User";

  /** Initials for avatar fallback — e.g. "John Doe" → "JD" */
  const initials = displayName
    .split(" ")
    .map(w => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const avatarUrl = profile?.avatar_url ?? null;

  // ── Role helpers ──────────────────────────────────────────────────────────
  /**
   * Returns true if the user's role exactly matches `r`.
   * @param {string} r
   */
  const hasRole = (r) => role === r;

  /**
   * Returns true if the user's role is any of the provided roles.
   * @param {string[]} roles
   */
  const hasAnyRole = (...roles) => roles.flat().includes(role);

  /**
   * Returns true if the user's role has the named permission.
   * @param {string} permission  Key from PERMISSION_MAP
   */
  const can = (permission) => {
    const allowed = PERMISSION_MAP[permission];
    if (!allowed) {
      console.warn(`[useAuth] Unknown permission: "${permission}"`);
      return false;
    }
    return role !== null && allowed.includes(role);
  };

  // ── Computed flags ────────────────────────────────────────────────────────
  const isClient     = hasRole("client");
  const isManager    = hasRole("manager");
  const isOwner      = hasRole("owner");
  const isWorker     = hasRole("worker");
  const isSuperAdmin = hasRole("super_admin");
  const isVisitor    = hasRole("visitor") || !isAuthenticated;
  const isStaff      = hasAnyRole("manager", "owner"); // can manage properties

  return {
    // Raw state
    user,
    profile,
    loading:    isLoading,
    error,
    // IDs
    userId,
    tenantId,
    role,
    // Display
    displayName,
    initials,
    avatarUrl,
    // Booleans
    isAuthenticated,
    isClient,
    isManager,
    isOwner,
    isWorker,
    isSuperAdmin,
    isVisitor,
    isStaff,
    // Permission helpers
    hasRole,
    hasAnyRole,
    can,
    // Actions (pass-through from store)
    signIn,
    signUp,
    signOut,
    refreshProfile,
    updateProfile,
    updatePassword,
    sendPasswordReset,
    acceptInvite,
    clearError,
  };
}

// =============================================================================
// useRequireAuth
//
// Imperative guard hook. Call inside a component that needs authentication.
// On mount it checks the session; if not authenticated it calls `onUnauthed`.
// Typically used in layouts rather than individual pages.
//
// Usage (in DashboardLayout):
//   useRequireAuth({ onUnauthed: () => navigate("/login") });
//
// @param {{ onUnauthed: Function, requiredRoles?: string[] }} options
// =============================================================================
export function useRequireAuth({ onUnauthed, requiredRoles } = {}) {
  const isAuthenticated = useAuthStore(s => s.user !== null);
  const loading         = useAuthStore(s => s.loading);
  const role            = useAuthStore(s => s.profile?.role);

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      onUnauthed?.();
      return;
    }

    if (requiredRoles && role && !requiredRoles.includes(role)) {
      onUnauthed?.();
    }
  }, [isAuthenticated, loading, role, requiredRoles, onUnauthed]);

  return { isAuthenticated, loading, role };
}

// =============================================================================
// useSignOutWithCleanup
//
// Wraps signOut with tenant + notification store cleanup.
// Use this instead of calling signOut directly so all stores are cleared
// in the correct order.
//
// Usage:
//   const signOut = useSignOutWithCleanup();
//   <button onClick={signOut}>Sign out</button>
// =============================================================================
export function useSignOutWithCleanup() {
  const signOut    = useAuthStore(s => s.signOut);
  const clearTenant= useTenantStore(s => s.clear);
  const clearNotifs= useNotificationStore(s => s.clearNotifications);

  return async () => {
    clearNotifs();
    clearTenant();
    await signOut();
  };
}

export default useAuth;
