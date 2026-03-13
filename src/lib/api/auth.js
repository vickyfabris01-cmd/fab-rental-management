import { supabase } from "../../config/supabase";

// =============================================================================
// lib/api/auth.js
//
// All Supabase Auth operations. These are the raw async functions called by
// authStore — components never import this file directly; they use the store
// or useAuth() hook.
//
// Every function returns { data, error } so the caller decides how to surface
// errors. Never throws — errors are returned as structured objects.
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// signIn
// Signs in with email + password via Supabase Auth.
//
// @param {string} email
// @param {string} password
// @returns {Promise<{ data: { user, session } | null, error: object | null }>}
// ─────────────────────────────────────────────────────────────────────────────
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email:    email.trim().toLowerCase(),
    password,
  });
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// signUp
// Creates a new Supabase auth.users record. The trg_new_user trigger fires
// and inserts a profiles row with role='visitor'.
//
// @param {object} params
// @param {string} params.email
// @param {string} params.password
// @param {string} [params.fullName]   Stored in auth.users.raw_user_meta_data
// @param {string} [params.phone]      KE phone number
// @returns {Promise<{ data, error }>}
// ─────────────────────────────────────────────────────────────────────────────
export async function signUp({ email, password, fullName, phone }) {
  const { data, error } = await supabase.auth.signUp({
    email:    email.trim().toLowerCase(),
    password,
    options: {
      data: {
        full_name: fullName?.trim() ?? "",
        phone:     phone?.trim()    ?? "",
      },
    },
  });
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// signOut
// Invalidates the current session token.
// @returns {Promise<{ error: object | null }>}
// ─────────────────────────────────────────────────────────────────────────────
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// ─────────────────────────────────────────────────────────────────────────────
// getSession
// Returns the current active session (if any).
// @returns {Promise<{ data: { session } | null, error }>}
// ─────────────────────────────────────────────────────────────────────────────
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// getUser
// Returns the currently authenticated user object from the JWT.
// @returns {Promise<{ data: { user } | null, error }>}
// ─────────────────────────────────────────────────────────────────────────────
export async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// sendPasswordReset
// Sends a password-reset email via Supabase. The link includes a recovery
// token that Supabase converts to a ?type=recovery session on the reset page.
//
// @param {string} email
// @param {string} [redirectTo]   Full URL of your reset-password page
// @returns {Promise<{ data, error }>}
// ─────────────────────────────────────────────────────────────────────────────
export async function sendPasswordReset(email, redirectTo) {
  const opts = {};
  if (redirectTo) opts.redirectTo = redirectTo;

  const { data, error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    opts
  );
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// updatePassword
// Sets a new password for the currently authenticated user.
// Must be called while the user has a valid session (e.g. on the reset page
// after Supabase exchanges the recovery token for a session).
//
// @param {string} newPassword
// @returns {Promise<{ data, error }>}
// ─────────────────────────────────────────────────────────────────────────────
export async function updatePassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// updateEmail
// Changes the authenticated user's email address.
// Supabase sends a confirmation to the new address before the change applies.
//
// @param {string} newEmail
// @returns {Promise<{ data, error }>}
// ─────────────────────────────────────────────────────────────────────────────
export async function updateEmail(newEmail) {
  const { data, error } = await supabase.auth.updateUser({
    email: newEmail.trim().toLowerCase(),
  });
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// acceptInvite
// Called on the /invite/:token page after the invitee sets their password.
// 1. Sign up with the invited email (no-op if already exists)
// 2. Authenticate immediately
//
// The actual profile role elevation happens server-side (FastAPI) when the
// manager_invites token is validated. This function only handles the
// Supabase Auth credential creation step.
//
// @param {object} params
// @param {string} params.email
// @param {string} params.password
// @param {string} params.fullName
// @returns {Promise<{ data, error }>}
// ─────────────────────────────────────────────────────────────────────────────
export async function acceptInvite({ email, password, fullName }) {
  // Try signing up first (new user)
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email:    email.trim().toLowerCase(),
    password,
    options:  { data: { full_name: fullName?.trim() ?? "" } },
  });

  // If user already exists, sign them in instead
  if (signUpError?.message?.includes("already registered")) {
    return signIn(email, password);
  }

  if (signUpError) return { data: null, error: signUpError };
  return { data: signUpData, error: null };
}

// ─────────────────────────────────────────────────────────────────────────────
// onAuthStateChange
// Subscribes to auth state changes (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED).
// Returns the unsubscribe function.
//
// @param {Function} callback  (event: string, session: object | null) => void
// @returns {Function} unsubscribe
// ─────────────────────────────────────────────────────────────────────────────
export function onAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return () => subscription.unsubscribe();
}
