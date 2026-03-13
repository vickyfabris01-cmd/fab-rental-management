import { create } from "zustand";
import { db } from "../config/supabase";
import { COLORS } from "../config/constants";

// =============================================================================
// tenantStore
//
// Holds the current tenant's data, branding, and settings.
// Also owns the CSS variable injection that lets tenants customise the UI
// with their own colours and font (DashboardLayout calls injectBranding()).
//
// Usage:
//   const { tenant, branding, settings, fetchTenantData } = useTenantStore();
//   const primaryColor = useTenantStore(s => s.branding?.primary_color ?? COLORS.brand);
// =============================================================================

// ── Default branding fallbacks ────────────────────────────────────────────────
const DEFAULT_BRANDING = {
  primary_color:   COLORS.brand,       // #C5612C
  secondary_color: COLORS.inkMuted,    // #5C4A3A
  logo_url:        null,
  font_family:     "DM Sans",
  accent_color:    COLORS.brand,
};

const DEFAULT_SETTINGS = {
  billing_type:          "monthly",    // "monthly" | "semester"
  payment_due_day:       5,            // day of month rent is due
  late_fee_amount:       0,
  late_fee_grace_days:   3,
  currency:              "KES",
  sms_notifications:     true,
  email_notifications:   true,
  allow_transfer_requests: true,
  require_id_upload:     false,
};

// =============================================================================
// Store
// =============================================================================
const useTenantStore = create((set, get) => ({
  // ── State ────────────────────────────────────────────────────────────────

  /** Row from the `tenants` table */
  tenant: null,

  /** Row from `tenant_branding` — colours, logo, font */
  branding: null,

  /** Row from `tenant_settings` — billing rules, notifications config */
  settings: null,

  /** True while any tenant data fetch is in flight */
  loading: false,

  /** Non-null if the last fetch failed */
  error: null,

  // ── Computed helpers ──────────────────────────────────────────────────────

  /** Resolved primary colour: tenant brand or fabrentals default */
  get primaryColor() {
    return get().branding?.primary_color ?? DEFAULT_BRANDING.primary_color;
  },

  /** Resolved secondary colour */
  get secondaryColor() {
    return get().branding?.secondary_color ?? DEFAULT_BRANDING.secondary_color;
  },

  /** Resolved logo URL — null means use the default fabrentals logo */
  get logoUrl() {
    return get().branding?.logo_url ?? null;
  },

  /** Active billing type for this tenant */
  get billingType() {
    return get().settings?.billing_type ?? DEFAULT_SETTINGS.billing_type;
  },

  /** True if the tenant has M-Pesa / online payment enabled */
  get onlinePaymentsEnabled() {
    return get().settings?.online_payments_enabled ?? false;
  },

  // ── Actions ───────────────────────────────────────────────────────────────

  /**
   * Fetch tenant, branding, and settings in one go.
   * Called by DashboardLayout on mount whenever tenantId is available.
   *
   * @param {string} tenantId  UUID from profile.tenant_id
   */
  fetchTenantData: async (tenantId) => {
    if (!tenantId) return;

    // Avoid re-fetching if we already have this tenant loaded
    if (get().tenant?.id === tenantId && !get().error) return;

    set({ loading: true, error: null });

    try {
      // Run all three queries in parallel
      const [tenantRes, brandingRes, settingsRes] = await Promise.all([
        db.tenants()
          .select("id, name, slug, status, owner_user_id, created_at")
          .eq("id", tenantId)
          .single(),

        db.tenantBranding()
          .select("*")
          .eq("tenant_id", tenantId)
          .maybeSingle(),        // not every tenant has a branding row yet

        db.tenantSettings()
          .select("*")
          .eq("tenant_id", tenantId)
          .maybeSingle(),
      ]);

      if (tenantRes.error) throw tenantRes.error;

      set({
        tenant:   tenantRes.data,
        branding: brandingRes.data ?? null,
        settings: settingsRes.data ?? null,
        loading:  false,
        error:    null,
      });

      // Inject CSS variables so tenant colours work across the whole app
      get().injectBranding();

    } catch (err) {
      console.error("[tenantStore] fetchTenantData error:", err.message);
      set({ loading: false, error: err.message });
    }
  },

  /**
   * Inject tenant branding as CSS custom properties on <html>.
   * Called automatically after fetchTenantData completes, and can be called
   * again if branding is updated live.
   *
   * Variables set:
   *   --brand-primary      primary action colour
   *   --brand-secondary    secondary / text accent colour
   *   --brand-accent       same as primary by default
   *   --brand-font         font-family string
   */
  injectBranding: () => {
    const branding = get().branding ?? {};
    const root = document.documentElement;

    root.style.setProperty(
      "--brand-primary",
      branding.primary_color ?? DEFAULT_BRANDING.primary_color
    );
    root.style.setProperty(
      "--brand-secondary",
      branding.secondary_color ?? DEFAULT_BRANDING.secondary_color
    );
    root.style.setProperty(
      "--brand-accent",
      branding.accent_color ?? DEFAULT_BRANDING.accent_color
    );
    root.style.setProperty(
      "--brand-font",
      `'${branding.font_family ?? DEFAULT_BRANDING.font_family}', system-ui, sans-serif`
    );
  },

  /**
   * Remove tenant CSS variables — called on sign-out so the next tenant
   * starts fresh.
   */
  removeBranding: () => {
    const root = document.documentElement;
    ["--brand-primary", "--brand-secondary", "--brand-accent", "--brand-font"]
      .forEach(v => root.style.removeProperty(v));
  },

  /**
   * Update tenant branding (owner / manager action from Settings page).
   * Upserts the tenant_branding row and re-injects CSS variables.
   *
   * @param {{ primary_color?, secondary_color?, logo_url?, font_family? }} updates
   * @returns {{ error: string | null }}
   */
  updateBranding: async (updates) => {
    const { tenant } = get();
    if (!tenant) return { error: "No tenant loaded" };

    set({ loading: true, error: null });

    const { error } = await db.tenantBranding().upsert({
      tenant_id: tenant.id,
      ...updates,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      set({ loading: false, error: error.message });
      return { error: error.message };
    }

    // Reload branding from DB to get the full updated row
    const { data } = await db.tenantBranding()
      .select("*")
      .eq("tenant_id", tenant.id)
      .single();

    set({ branding: data, loading: false });
    get().injectBranding();
    return { error: null };
  },

  /**
   * Update tenant settings (manager / owner action).
   *
   * @param {object} updates  Partial tenant_settings fields
   * @returns {{ error: string | null }}
   */
  updateSettings: async (updates) => {
    const { tenant } = get();
    if (!tenant) return { error: "No tenant loaded" };

    set({ loading: true, error: null });

    const { error } = await db.tenantSettings().upsert({
      tenant_id: tenant.id,
      ...updates,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      set({ loading: false, error: error.message });
      return { error: error.message };
    }

    const { data } = await db.tenantSettings()
      .select("*")
      .eq("tenant_id", tenant.id)
      .single();

    set({ settings: data, loading: false });
    return { error: null };
  },

  /**
   * Clear all tenant data from the store.
   * Called on sign-out so a new login starts clean.
   */
  clear: () => {
    get().removeBranding();
    set({ tenant: null, branding: null, settings: null, error: null });
  },

  /** Clear error flag */
  clearError: () => set({ error: null }),
}));

// =============================================================================
// Convenience selector hooks
// These prevent unnecessary re-renders by only subscribing to one slice.
//
// Usage:
//   const tenant   = useTenant();
//   const branding = useTenantBranding();
//   const settings = useTenantSettings();
// =============================================================================

export const useTenant        = () => useTenantStore(s => s.tenant);
export const useTenantBranding= () => useTenantStore(s => s.branding);
export const useTenantSettings= () => useTenantStore(s => s.settings);

export default useTenantStore;
