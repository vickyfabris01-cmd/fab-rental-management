import { createClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────────────────────
// Environment variables
// Set these in your .env file:
//
//   VITE_SUPABASE_URL=https://xyzxyzxyz.supabase.co
//   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
//
// Never commit real keys. The anon key is safe to expose in the browser
// because Row Level Security (RLS) is enabled on every table.
// ─────────────────────────────────────────────────────────────────────────────
const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY= import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "[supabase.js] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.\n" +
    "Copy .env.example to .env and fill in your project credentials."
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Client singleton
// auth.persistSession: true  — stores the JWT in localStorage so the user
//   stays logged in across page refreshes (Supabase default behaviour).
// auth.autoRefreshToken: true — silently refreshes the JWT before expiry.
// realtime.params.eventsPerSecond — throttle realtime broadcast rate.
// ─────────────────────────────────────────────────────────────────────────────
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession:   true,
    autoRefreshToken: true,
    detectSessionInUrl: true,   // Required for magic links & OAuth
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      "x-application-name": "fabrentals",
    },
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Storage bucket names
// These must match the bucket names you create in the Supabase dashboard.
// ─────────────────────────────────────────────────────────────────────────────
export const BUCKETS = {
  AVATARS:       "avatars",        // User profile photos
  PROPERTY_IMGS: "property-images",// Building / room photos
  DOCUMENTS:     "documents",      // Lease agreements, ID uploads
  INVOICES:      "invoices",       // Generated PDF invoices
};

// ─────────────────────────────────────────────────────────────────────────────
// Typed table helpers
// These are thin wrappers that give you autocomplete on table names
// and avoid typos scattered across lib/api files.
//
// Usage:
//   const { data, error } = await db.profiles()
//     .select("id, role, tenant_id")
//     .eq("id", userId)
//     .single();
// ─────────────────────────────────────────────────────────────────────────────
export const db = {
  // Platform
  tenants:          () => supabase.from("tenants"),
  profiles:         () => supabase.from("profiles"),
  tenantBranding:   () => supabase.from("tenant_branding"),
  tenantSettings:   () => supabase.from("tenant_settings"),

  // Properties
  buildings:        () => supabase.from("buildings"),
  floors:           () => supabase.from("floors"),
  rooms:            () => supabase.from("rooms"),
  beds:             () => supabase.from("beds"),

  // Users & roles
  managers:         () => supabase.from("managers"),
  managerInvites:   () => supabase.from("manager_invites"),

  // Tenancy lifecycle
  rentalRequests:   () => supabase.from("rental_requests"),
  tenancies:        () => supabase.from("tenancies"),
  roomTransfers:    () => supabase.from("room_transfers"),

  // Billing & payments
  billingCycles:    () => supabase.from("billing_cycles"),
  payments:         () => supabase.from("payments"),
  invoices:         () => supabase.from("invoices"),

  // Workforce
  workers:          () => supabase.from("workers"),
  workerPayments:   () => supabase.from("worker_payments"),
  attendance:       () => supabase.from("attendance"),

  // Comms
  complaints:       () => supabase.from("complaints"),
  complaintMessages:() => supabase.from("complaint_messages"),
  notifications:    () => supabase.from("notifications"),
  notificationLog:  () => supabase.from("notification_log"),
};

// ─────────────────────────────────────────────────────────────────────────────
// Realtime channel factory
// Creates a named channel so components can subscribe to specific tables.
//
// Usage:
//   const channel = realtimeChannel("payments-feed")
//     .on("postgres_changes", {
//       event: "INSERT",
//       schema: "public",
//       table: "payments",
//       filter: `tenant_id=eq.${tenantId}`,
//     }, (payload) => console.log(payload))
//     .subscribe();
//
//   // Cleanup on unmount:
//   return () => supabase.removeChannel(channel);
// ─────────────────────────────────────────────────────────────────────────────
export const realtimeChannel = (name) => supabase.channel(name);

// ─────────────────────────────────────────────────────────────────────────────
// Storage helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the public URL for a file stored in a Supabase Storage bucket.
 * @param {string} bucket - One of the BUCKETS values
 * @param {string} path   - File path inside the bucket e.g. "user-id/avatar.jpg"
 */
export function storageUrl(bucket, path) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Uploads a file to a bucket and returns the public URL.
 * Throws on upload error.
 *
 * @param {string} bucket
 * @param {string} path   - Destination path in the bucket
 * @param {File}   file   - Browser File object
 * @param {{ upsert?: boolean }} [options]
 * @returns {Promise<string>} Public URL of the uploaded file
 */
export async function uploadFile(bucket, path, file, options = {}) {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: options.upsert ?? false });

  if (error) throw error;
  return storageUrl(bucket, path);
}

export default supabase;
