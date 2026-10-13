// mpesa-stk-push — starts an M-Pesa STK prompt (Daraja, sandbox or live).
// Body: { purpose: "subscription", businessId, planId, phone: "2547…" }
// The AMOUNT is always taken from the database (the plan price), never from the browser.
// Secrets (Supabase > Edge Functions > Secrets): MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET,
// MPESA_PASSKEY, optional MPESA_SHORTCODE (else platform_settings.mpesa.shortcode), and
// MPESA_CALLBACK_SECRET (any long random text; added to the callback URL).
// With no credentials the function answers { code: "NOT_CONFIGURED" } so the app can offer the
// super admin's manual "mark as paid" and testing is never blocked.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  const { data: auth } = await admin.auth.getUser(token);
  const user = auth?.user;
  if (!user) return json({ error: "Please sign in first." }, 401);

  let body: Record<string, string>;
  try { body = await req.json(); } catch { return json({ error: "Invalid request" }, 400); }
  const { purpose = "subscription", businessId, planId } = body;
  const phone = String(body.phone ?? "");
  if (purpose !== "subscription") return json({ error: "Unsupported payment type." }, 400);
  if (!/^254[17]\d{8}$/.test(phone)) return json({ error: "Enter a valid Kenyan phone number." }, 400);

  // Only the business owner can pay for it, and only while it is waiting for payment.
  const { data: member } = await admin.from("business_members").select("role")
    .eq("business_id", businessId).eq("user_id", user.id).eq("status", "active").maybeSingle();
  const { data: biz } = await admin.from("businesses").select("id, name, status, business_type").eq("id", businessId).maybeSingle();
  if (!biz || member?.role !== "owner") return json({ error: "You cannot pay for this business." }, 403);
  if (!["pending_payment", "draft"].includes(biz.status)) return json({ error: "This business is already paid for." }, 400);

  const { data: plan } = await admin.from("subscription_plans").select("id, name, price_kes, business_type, is_active")
    .eq("id", planId).maybeSingle();
  if (!plan || !plan.is_active || plan.business_type !== biz.business_type) return json({ error: "This plan is not available." }, 400);

  const key = Deno.env.get("MPESA_CONSUMER_KEY");
  const secret = Deno.env.get("MPESA_CONSUMER_SECRET");
  const passkey = Deno.env.get("MPESA_PASSKEY");
  const { data: setting } = await admin.from("platform_settings").select("value").eq("key", "mpesa").maybeSingle();
  const env = setting?.value?.env === "live" ? "live" : "sandbox";
  const shortcode = Deno.env.get("MPESA_SHORTCODE") || setting?.value?.shortcode || "174379";
  if (!key || !secret || !passkey) {
    return json({ error: "M-Pesa is not set up on this server yet.", code: "NOT_CONFIGURED" }, 400);
  }

  const { data: intent, error: insErr } = await admin.from("payment_intents").insert({
    user_id: user.id, business_id: biz.id, plan_id: plan.id, purpose, method: "mpesa_stk",
    amount_kes: plan.price_kes, phone, status: "pending",
  }).select("id").single();
  if (insErr) return json({ error: "Could not start the payment." }, 500);

  const base = env === "live" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";
  try {
    const tokenRes = await fetch(`${base}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: "Basic " + btoa(`${key}:${secret}`) },
    });
    if (!tokenRes.ok) throw new Error("Safaricom rejected the credentials.");
    const { access_token } = await tokenRes.json();

    const ts = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
    const callbackSecret = Deno.env.get("MPESA_CALLBACK_SECRET") ?? "";
    const stk = await fetch(`${base}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: btoa(`${shortcode}${passkey}${ts}`),
        Timestamp: ts,
        TransactionType: "CustomerPayBillOnline",
        Amount: plan.price_kes,
        PartyA: phone,
        PartyB: shortcode,
        PhoneNumber: phone,
        CallBackURL: `${url}/functions/v1/mpesa-callback?secret=${encodeURIComponent(callbackSecret)}`,
        AccountReference: biz.name.slice(0, 12),
        TransactionDesc: `Subscription ${plan.name}`.slice(0, 20),
      }),
    });
    const res = await stk.json();
    if (res.ResponseCode !== "0") throw new Error(res.errorMessage || res.ResponseDescription || "M-Pesa could not send the prompt.");
    await admin.from("payment_intents").update({
      checkout_request_id: res.CheckoutRequestID, merchant_request_id: res.MerchantRequestID,
    }).eq("id", intent.id);
    return json({ intentId: intent.id, status: "pending", message: "Check your phone for the M-Pesa prompt." });
  } catch (e) {
    await admin.from("payment_intents").update({ status: "failed", result_desc: String((e as Error).message) }).eq("id", intent.id);
    return json({ error: String((e as Error).message) }, 502);
  }
});
