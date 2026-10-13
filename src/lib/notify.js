// src/lib/notify.js — NEW FILE
//
// AIM
// The one way the browser creates an in-app notification for someone (the database creates its
// own for approvals and payments). Allowed for: yourself, a member of the same business, or a
// super admin; the notify() SQL function checks this.
//
//   await notify({ userId, businessId, type: "announcement", title: "Water cut", body: "…", link: "/app/x" });

import { supabase } from "../config/supabase.js";

export async function notify({ userId, businessId = null, type = "system", title, body = null, link = null }) {
  if (!supabase) return { error: "not connected" };
  const { error } = await supabase.rpc("notify", {
    p_user: userId, p_business: businessId, p_type: type, p_title: title, p_body: body, p_link: link,
  });
  return { error: error?.message || null };
}
