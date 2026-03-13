import { useEffect, useMemo } from "react";
import useTenantStore from "../store/tenantStore";
import useAuthStore from "../store/authStore";
import { COLORS } from "../config/constants";

// =============================================================================
// useTenant
//
// Primary tenant hook for components. Reads from tenantStore and triggers
// a fetch whenever the authenticated user's tenant_id changes.
//
// Call this once in DashboardLayout — child components should subscribe
// to the store directly via useTenantStore(selector) to avoid prop drilling.
//
// Usage:
//   const { tenant, branding, settings, loading } = useTenant();
//   const { primaryColor, logoUrl, billingType }  = useTenant();
// =============================================================================
export function useTenant() {
  const tenantId       = useAuthStore(s => s.profile?.tenant_id ?? null);
  const fetchTenant    = useTenantStore(s => s.fetchTenantData);
  const tenant         = useTenantStore(s => s.tenant);
  const branding       = useTenantStore(s => s.branding);
  const settings       = useTenantStore(s => s.settings);
  const loading        = useTenantStore(s => s.loading);
  const error          = useTenantStore(s => s.error);
  const updateBranding = useTenantStore(s => s.updateBranding);
  const updateSettings = useTenantStore(s => s.updateSettings);
  const injectBranding = useTenantStore(s => s.injectBranding);
  const clearError     = useTenantStore(s => s.clearError);

  // Auto-fetch when tenantId is known and store doesn't already have this tenant
  useEffect(() => {
    if (tenantId) fetchTenant(tenantId);
  }, [tenantId, fetchTenant]);

  // ── Derived / resolved values ─────────────────────────────────────────────
  const primaryColor   = branding?.primary_color   ?? COLORS.brand;
  const secondaryColor = branding?.secondary_color ?? COLORS.inkMuted;
  const accentColor    = branding?.accent_color    ?? COLORS.brand;
  const logoUrl        = branding?.logo_url        ?? null;
  const fontFamily     = branding?.font_family     ?? "DM Sans";
  const billingType    = settings?.billing_type    ?? "monthly";
  const currency       = settings?.currency        ?? "KES";
  const paymentDueDay  = settings?.payment_due_day ?? 5;
  const lateFeeAmount  = settings?.late_fee_amount ?? 0;

  /** True if a valid tenant row is loaded */
  const isLoaded       = tenant !== null;

  /** True if tenant is active (not suspended / pending) */
  const isActive       = tenant?.status === "active";

  /**
   * CSS variable map — pass this to a style prop to override brand colours
   * for a specific subtree without touching document.documentElement.
   */
  const cssVars = useMemo(() => ({
    "--brand-primary":   primaryColor,
    "--brand-secondary": secondaryColor,
    "--brand-accent":    accentColor,
    "--brand-font":      `'${fontFamily}', system-ui, sans-serif`,
  }), [primaryColor, secondaryColor, accentColor, fontFamily]);

  return {
    // Raw data
    tenant,
    branding,
    settings,
    loading,
    error,
    // Derived values
    primaryColor,
    secondaryColor,
    accentColor,
    logoUrl,
    fontFamily,
    billingType,
    currency,
    paymentDueDay,
    lateFeeAmount,
    // Status flags
    isLoaded,
    isActive,
    // CSS helpers
    cssVars,
    // Actions
    updateBranding,
    updateSettings,
    injectBranding,
    clearError,
  };
}

// =============================================================================
// useTenantBranding
//
// Lightweight hook for components that only need colour/logo values.
// Avoids re-rendering when unrelated settings fields change.
//
// Usage:
//   const { primaryColor, logoUrl } = useTenantBranding();
// =============================================================================
export function useTenantBranding() {
  const branding = useTenantStore(s => s.branding);

  return {
    primaryColor:   branding?.primary_color   ?? COLORS.brand,
    secondaryColor: branding?.secondary_color ?? COLORS.inkMuted,
    accentColor:    branding?.accent_color    ?? COLORS.brand,
    logoUrl:        branding?.logo_url        ?? null,
    fontFamily:     branding?.font_family     ?? "DM Sans",
  };
}

// =============================================================================
// useTenantSettings
//
// Lightweight hook for components that only need billing / config values.
//
// Usage:
//   const { billingType, paymentDueDay } = useTenantSettings();
// =============================================================================
export function useTenantSettings() {
  const settings = useTenantStore(s => s.settings);

  return {
    billingType:    settings?.billing_type          ?? "monthly",
    paymentDueDay:  settings?.payment_due_day       ?? 5,
    lateFeeAmount:  settings?.late_fee_amount       ?? 0,
    gracedays:      settings?.late_fee_grace_days   ?? 3,
    currency:       settings?.currency              ?? "KES",
    smsEnabled:     settings?.sms_notifications     ?? true,
    emailEnabled:   settings?.email_notifications   ?? true,
    transfersAllowed: settings?.allow_transfer_requests ?? true,
    requireIdUpload:  settings?.require_id_upload   ?? false,
    onlinePayments:   settings?.online_payments_enabled ?? false,
  };
}

// =============================================================================
// useTenantId
//
// Returns just the tenantId string — use in data-fetching hooks that need
// it as a query key without subscribing to the whole tenant object.
//
// Usage:
//   const tenantId = useTenantId();
//   useQuery(["rooms", tenantId], () => api.getRooms(tenantId), { enabled: !!tenantId });
// =============================================================================
export function useTenantId() {
  return useAuthStore(s => s.profile?.tenant_id ?? null);
}

export default useTenant;
