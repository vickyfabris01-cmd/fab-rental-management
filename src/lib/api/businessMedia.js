// src/lib/api/businessMedia.js — NEW FILE
//
// AIM
// The business cover photo (businesses.cover_url): upload, replace and remove. Files go to the
// public "business-media" bucket under <businessId>/cover/ (the existing storage rule lets the
// owner and managers write there). The public listing card and the business page already show
// cover_url; this is the missing piece that sets it. Returns { data, error }, never throws.

import { supabase } from "../../config/supabase.js";

const BUCKET = "business-media";
const TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const NOT_CONNECTED = { data: null, error: "The app is not connected to the database yet." };

export const COVER_MAX_MB = 4;

// storage path of a cover we uploaded, or "" for anything else (so we never delete other photos)
function coverPathOf(businessId, url) {
  if (!url) return "";
  const marker = `/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i < 0) return "";
  const path = decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
  return path.startsWith(`${businessId}/cover/`) ? path : "";
}

async function setCoverUrl(businessId, url) {
  const { data, error } = await supabase.from("businesses").update({ cover_url: url }).eq("id", businessId).select("id").maybeSingle();
  if (error) return error.message;
  if (!data) return "Only the business owner can change the cover photo.";
  return "";
}

export async function uploadBusinessCover(businessId, file, oldUrl) {
  if (!supabase) return NOT_CONNECTED;
  if (!TYPES[file.type]) return { data: null, error: "Use a JPG, PNG or WebP photo." };
  if (file.size > COVER_MAX_MB * 1024 * 1024) return { data: null, error: `The photo must be under ${COVER_MAX_MB} MB.` };
  const path = `${businessId}/cover/${crypto.randomUUID()}.${TYPES[file.type]}`;
  const up = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (up.error) return { data: null, error: up.error.message };
  const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  const err = await setCoverUrl(businessId, url);
  if (err) {
    await supabase.storage.from(BUCKET).remove([path]); // do not leave a file nobody points to
    return { data: null, error: err };
  }
  const old = coverPathOf(businessId, oldUrl);
  if (old) await supabase.storage.from(BUCKET).remove([old]); // best effort
  return { data: { url }, error: null };
}

export async function removeBusinessCover(businessId, oldUrl) {
  if (!supabase) return NOT_CONNECTED;
  const err = await setCoverUrl(businessId, null);
  if (err) return { data: null, error: err };
  const old = coverPathOf(businessId, oldUrl);
  if (old) await supabase.storage.from(BUCKET).remove([old]); // best effort
  return { data: null, error: null };
}