// src/store/sessionStore.js — NEW FILE
//
// AIM
// The signed-in person: Supabase session, profile row, and every sign-in method (email,
// phone + password, Google). The old store/authStore.js stays untouched until Phase 3 removes
// the old pages; new code uses THIS store.
//
//   const { user, profile, loading, isSuperAdmin } = useSession();
//   await useSession.getState().signInWithPassword(identifier, password)   // email OR phone
//
// Every method returns { error } instead of throwing, so forms can show the message.

import { create } from "zustand";
import { supabase, isSupabaseConfigured } from "../config/supabase.js";
import { looksLikePhone, toE164 } from "../lib/phone.js";

const PROFILE_FIELDS = "id, role, tenant_id, full_name, avatar_url, phone, email, is_active, created_at";

function friendly(error) {
  if (!error) return null;
  const m = String(error.message || error);
  if (/invalid login credentials/i.test(m)) return "The email, phone number or password is not correct.";
  if (/email not confirmed/i.test(m)) return "Please confirm your email first. Check your inbox.";
  if (/already registered|already been registered/i.test(m)) return "An account with this email already exists. Try signing in.";
  if (/rate limit|too many/i.test(m)) return "Too many attempts. Please wait a moment and try again.";
  if (/network|failed to fetch/i.test(m)) return "Could not reach the server. Check your internet and try again.";
  return m;
}

let started = false;

export const useSession = create((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,
  recovery: false, // true after the person opened a password-reset link

  get isSuperAdmin() {
    return get().profile?.role === "super_admin";
  },

  /** Call once at start-up (done by <SessionBoot/> in the router). */
  async init() {
    if (started) return;
    started = true;
    if (!supabase) return set({ loading: false });

    const { data } = await supabase.auth.getSession();
    await get()._apply(data.session);

    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") set({ recovery: true });
      // Do not await inside this callback (a Supabase rule); schedule the profile load instead.
      setTimeout(() => get()._apply(session), 0);
    });
  },

  async _apply(session) {
    if (!session?.user) return set({ session: null, user: null, profile: null, loading: false });
    set({ session, user: session.user });
    const profile = await get().fetchProfile(session.user.id);
    set({ profile, loading: false });
  },

  async fetchProfile(id) {
    const { data, error } = await supabase.from("profiles").select(PROFILE_FIELDS).eq("id", id).maybeSingle();
    if (error) console.warn("[session] profile:", error.message);
    return data || null;
  },

  async refreshProfile() {
    const id = get().user?.id;
    if (!id) return null;
    const profile = await get().fetchProfile(id);
    set({ profile });
    return profile;
  },

  // ── Sign in ───────────────────────────────────────────────────────────────
  /** identifier is an email address or a Kenyan phone number. */
  async signInWithPassword(identifier, password) {
    if (!isSupabaseConfigured) return { error: "The app is not connected to the database yet." };
    const id = String(identifier || "").trim();
    if (looksLikePhone(id)) {
      if (!toE164(id)) return { error: "Enter a valid Kenyan phone number, like 0712 345 678." };
      const { data, error } = await supabase.functions.invoke("resolve-login", {
        body: { phone: toE164(id), password },
      });
      if (error || !data?.session) {
        let message = "The phone number or password is not correct.";
        try {
          const body = await error?.context?.json?.();
          if (body?.error) message = body.error;
        } catch { /* generic */ }
        return { error: message };
      }
      const { data: set, error: setErr } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
      // Load the profile before returning, so the caller can route by role straight away.
      if (!setErr && set.session) await get()._apply(set.session);
      return { error: friendly(setErr) };
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email: id, password });
    if (!error && data.session) await get()._apply(data.session);
    return { error: friendly(error) };
  },

  async signUp({ fullName, email, phone, password }) {
    if (!isSupabaseConfigured) return { error: "The app is not connected to the database yet." };
    const e164 = toE164(phone);
    if (e164) {
      const { data: free } = await supabase.rpc("phone_available", { p_phone: e164 });
      if (free === false) return { error: "This phone number already has an account. Sign in instead." };
    }
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim(), phone: e164 ? `0${e164.slice(3)}` : "" },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    // With "confirm email" on, there is no session yet; the person must open the email link.
    return { error: friendly(error), needsConfirmation: !error && !data.session, email: email.trim() };
  },

  async signInWithGoogle(nextPath = "") {
    if (!isSupabaseConfigured) return { error: "The app is not connected to the database yet." };
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}` },
    });
    return { error: friendly(error) };
  },

  async resendConfirmation(email) {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    return { error: friendly(error) };
  },

  async sendPasswordReset(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: friendly(error) };
  },

  async updatePassword(password) {
    const { error } = await supabase.auth.updateUser({ password });
    if (!error) set({ recovery: false });
    return { error: friendly(error) };
  },

  async updateProfile(fields) {
    const id = get().user?.id;
    const patch = {};
    if (fields.full_name !== undefined) patch.full_name = fields.full_name.trim();
    if (fields.phone !== undefined) {
      const e164 = toE164(fields.phone);
      if (fields.phone && !e164) return { error: "Enter a valid Kenyan phone number." };
      patch.phone = e164 ? `0${e164.slice(3)}` : null;
    }
    if (fields.avatar_url !== undefined) patch.avatar_url = fields.avatar_url;
    const { error } = await supabase.from("profiles").update(patch).eq("id", id);
    if (error) {
      const taken = /profiles_phone_norm_uq|duplicate key/i.test(error.message);
      return { error: taken ? "This phone number is used by another account." : friendly(error) };
    }
    await get().refreshProfile();
    return { error: null };
  },

  async signOut() {
    if (supabase) await supabase.auth.signOut();
    set({ session: null, user: null, profile: null });
  },
}));

export default useSession;