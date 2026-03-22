import { create } from "zustand";
import { supabase, db } from "../config/supabase";
import { ROLE_HOME } from "../config/constants";

// =============================================================================
// authStore
//
// Single source of truth for the current user session and profile.
// Wraps Supabase Auth so the rest of the app never imports supabase directly
// for auth operations — they just call store actions.
//
// Usage:
//   const { user, profile, signIn, signOut } = useAuthStore();
//   const isLoggedIn = useAuthStore(s => s.user !== null);
//   const role = useAuthStore(s => s.profile?.role);
// =============================================================================

// ── Profile select fields ─────────────────────────────────────────────────────
const PROFILE_FIELDS =
  "id, role, tenant_id, full_name, avatar_url, phone, email, created_at, updated_at";

// ── Internal: fetch profile row from DB ──────────────────────────────────────
async function fetchProfile(userId) {
  const { data, error } = await db
    .profiles()
    .select(PROFILE_FIELDS)
    .eq("id", userId)
    .single();

  if (error) {
    console.error("[authStore] fetchProfile error:", error.message);
    return null;
  }
  return data;
}

// =============================================================================
// Store
// =============================================================================
const useAuthStore = create((set, get) => ({
  // ── State ────────────────────────────────────────────────────────────────
  /** Raw Supabase auth.User object */
  user: null,

  /** Row from the `profiles` table — has role, tenant_id, etc. */
  profile: null,

  /** True while the initial session check or any auth action is in flight */
  loading: true,

  /** Non-null after a failed signIn/signUp/etc. — cleared on next action */
  error: null,

  // ── Computed helpers ──────────────────────────────────────────────────────
  /** Convenience getter: current user's role string, or null */
  get role() {
    return get().profile?.role ?? null;
  },

  /** Convenience getter: current user's tenant_id, or null */
  get tenantId() {
    return get().profile?.tenant_id ?? null;
  },

  /** True if the user has a confirmed session */
  get isAuthenticated() {
    return get().user !== null;
  },

  /** The route this user should land on after sign-in */
  get homeRoute() {
    const role = get().profile?.role;
    return role ? (ROLE_HOME[role] ?? "/") : "/";
  },

  // ── Actions ───────────────────────────────────────────────────────────────

  /**
   * Bootstrap: called once on app mount (inside AppLoader).
   * Checks for an existing session, loads the profile, then starts listening
   * for auth-state changes from Supabase.
   *
   * @returns {Function} cleanup — call this on unmount to remove the listener
   */
  init: async () => {
    set({ loading: true, error: null });

    // 1. Get persisted session from localStorage
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      const profile = await fetchProfile(session.user.id);
      set({ user: session.user, profile, loading: false });
    } else {
      set({ user: null, profile: null, loading: false });
    }

    // 2. Subscribe to future auth events (tab sync, token refresh, sign-out)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const profile = await fetchProfile(session.user.id);
        set({ user: session.user, profile, error: null });
      }

      if (event === "SIGNED_OUT") {
        set({ user: null, profile: null, error: null });
      }

      if (event === "TOKEN_REFRESHED" && session?.user) {
        // Token silently refreshed — update user object, keep profile
        set({ user: session.user });
      }

      if (event === "USER_UPDATED" && session?.user) {
        // Email / password changed — re-fetch profile
        const profile = await fetchProfile(session.user.id);
        set({ user: session.user, profile });
      }
    });

    // Return unsubscribe fn so AppLoader can clean up
    return () => subscription.unsubscribe();
  },

  /**
   * Sign in with email + password.
   * On success the onAuthStateChange listener handles setting user + profile.
   *
   * @param {string} email
   * @param {string} password
   * @returns {{ error: string | null }}
   */
  signIn: async (email, password) => {
    set({ loading: true, error: null });

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const msg = _mapAuthError(error.message);
      set({ loading: false, error: msg });
      return { error: msg };
    }

    set({ loading: false });
    return { error: null };
  },

  /**
   * Sign up a new user (visitor by default — role elevated later).
   * Does NOT sign the user in automatically; they confirm via email first.
   *
   * @param {string} email
   * @param {string} password
   * @param {{ fullName: string, phone?: string }} meta
   * @returns {{ error: string | null }}
   */
  signUp: async ({ email, password, fullName, phone } = {}) => {
    set({ loading: true, error: null });

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName ?? "",
          phone:     phone    ?? "",
        },
        emailRedirectTo: `${window.location.origin}/confirm`,
      },
    });

    if (error) {
      const msg = _mapAuthError(error.message);
      set({ loading: false, error: msg });
      return { error: msg };
    }

    set({ loading: false });
    return { error: null };
  },

  /**
   * Accept a manager invite: set password for the user account that was
   * created server-side by the invite flow.
   * Called from AcceptInvitePage after the user submits the form.
   *
   * @param {string} password
   * @param {string} fullName
   * @returns {{ error: string | null }}
   */
  acceptInvite: async (password, fullName) => {
    set({ loading: true, error: null });

    // Supabase delivers the recovery token in the URL; updateUser works once
    // the session is established from that token.
    const { error } = await supabase.auth.updateUser({
      password,
      data: { full_name: fullName },
    });

    if (error) {
      const msg = _mapAuthError(error.message);
      set({ loading: false, error: msg });
      return { error: msg };
    }

    // Re-fetch profile after name update
    const { user } = get();
    if (user) {
      const profile = await fetchProfile(user.id);
      set({ profile });
    }

    set({ loading: false });
    return { error: null };
  },

  /**
   * Send a password-reset email.
   *
   * @param {string} email
   * @returns {{ error: string | null }}
   */
  sendPasswordReset: async (email) => {
    set({ loading: true, error: null });

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password?type=recovery`,
    });

    if (error) {
      const msg = _mapAuthError(error.message);
      set({ loading: false, error: msg });
      return { error: msg };
    }

    set({ loading: false });
    return { error: null };
  },

  /**
   * Set a new password (called from ResetPasswordPage after token exchange).
   *
   * @param {string} newPassword
   * @returns {{ error: string | null }}
   */
  updatePassword: async (newPassword) => {
    set({ loading: true, error: null });

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      const msg = _mapAuthError(error.message);
      set({ loading: false, error: msg });
      return { error: msg };
    }

    set({ loading: false });
    return { error: null };
  },

  /**
   * Sign out and clear all local state.
   */
  signOut: async () => {
    set({ loading: true });
    await supabase.auth.signOut();
    // onAuthStateChange SIGNED_OUT will clear user + profile
    set({ loading: false });
  },

  /**
   * Re-fetch the profile from the database.
   * Call this after a role change or profile update.
   */
  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;

    const profile = await fetchProfile(user.id);
    set({ profile });
  },

  /**
   * Update profile fields (full_name, phone, avatar_url).
   * Writes to both auth.users metadata and the profiles table.
   *
   * @param {{ fullName?: string, phone?: string, avatarUrl?: string }} updates
   * @returns {{ error: string | null }}
   */
  updateProfile: async ({ fullName, phone, avatarUrl } = {}) => {
    const { user } = get();
    if (!user) return { error: "Not authenticated" };

    set({ loading: true, error: null });

    // Update auth metadata
    await supabase.auth.updateUser({
      data: {
        ...(fullName !== undefined && { full_name: fullName }),
        ...(phone    !== undefined && { phone }),
      },
    });

    // Update profiles table
    const updates = {};
    if (fullName  !== undefined) updates.full_name  = fullName;
    if (phone     !== undefined) updates.phone      = phone;
    if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;

    const { error } = await db
      .profiles()
      .update(updates)
      .eq("id", user.id);

    if (error) {
      const msg = error.message;
      set({ loading: false, error: msg });
      return { error: msg };
    }

    await get().refreshProfile();
    set({ loading: false });
    return { error: null };
  },

  /** Clear any stored auth error */
  clearError: () => set({ error: null }),
}));

// =============================================================================
// Private helpers
// =============================================================================

/**
 * Map Supabase auth error messages to user-friendly strings.
 * Supabase returns English error strings — we normalise them here.
 */
function _mapAuthError(msg = "") {
  const m = msg.toLowerCase();

  if (m.includes("invalid login credentials") || m.includes("invalid email or password"))
    return "Incorrect email or password. Please try again.";

  if (m.includes("email not confirmed"))
    return "Please verify your email address before signing in.";

  if (m.includes("user already registered"))
    return "An account with this email already exists. Try signing in.";

  if (m.includes("password should be at least"))
    return "Password must be at least 8 characters long.";

  if (m.includes("rate limit"))
    return "Too many attempts. Please wait a moment and try again.";

  if (m.includes("network") || m.includes("fetch"))
    return "Network error. Check your connection and try again.";

  // Fallback — return the raw message capitalised
  return msg.charAt(0).toUpperCase() + msg.slice(1);
}

export default useAuthStore;
