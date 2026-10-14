// mpesa-stk-push — starts an M-Pesa STK prompt (Daraja, sandbox or live).
// Body: { purpose: "subscription", businessId, planId, phone: "2547…" }
//    or { purpose: "rent", cycleId, amount, phone: "2547…" }   (Phase 2: a resident or the business staff)
// Subscription amounts always come from the database (the plan price). A rent amount is checked
// against the invoice balance. Rent is paid into the BUSINESS's own paybill/till
// (tenant_settings.mpesa_shortcode + tenant_secrets.mpesa_passkey, saved by the owner).
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
  const { purpose = "subscription", businessId, planId, cycleId } = body;
  const phone = String(body.phone ?? "");
  if (!["subscription", "rent"].includes(purpose)) return json({ error: "Unsupported payment type." }, 400);
  if (!/^254[17]\d{8}$/.test(phone)) return json({ error: "Enter a valid Kenyan phone number." }, 400);

  const key = Deno.env.get("MPESA_CONSUMER_KEY");
  const secret = Deno.env.get("MPESA_CONSUMER_SECRET");
  let passkey = Deno.env.get("MPESA_PASSKEY");
  const { data: setting } = await admin.from("platform_settings").select("value").eq("key", "mpesa").maybeSingle();
  const env = setting?.value?.env === "live" ? "live" : "sandbox";
  let shortcode = Deno.env.get("MPESA_SHORTCODE") || setting?.value?.shortcode || "174379";

  let bizId: string; let bizName: string; let amount: number; let desc: string;
  let planRef: string | null = null; let cycleRef: string | null = null; let tenancyRef: string | null = null;

  if (purpose === "subscription") {
    // Only the business owner can pay for it, and only while it is waiting for payment.
    const { data: member } = await admin.from("business_members").select("role")
      .eq("business_id", businessId).eq("user_id", user.id).eq("status", "active").maybeSingle();
    const { data: biz } = await admin.from("businesses").select("id, name, status, business_type").eq("id", businessId).maybeSingle();
    if (!biz || member?.role !== "owner") return json({ error: "You cannot pay for this business." }, 403);
    if (!["pending_payment", "draft"].includes(biz.status)) return json({ error: "This business is already paid for." }, 400);
    const { data: plan } = await admin.from("subscription_plans").select("id, name, price_kes, business_type, is_active")
      .eq("id", planId).maybeSingle();
    if (!plan || !plan.is_active || plan.business_type !== biz.business_type) return json({ error: "This plan is not available." }, 400);
    bizId = biz.id; bizName = biz.name; amount = plan.price_kes; planRef = plan.id; desc = `Subscription ${plan.name}`;
  } else {
    const { data: cycle } = await admin.from("billing_cycles")
      .select("id, tenant_id, tenancy_id, client_id, status, amount_due, late_fee, amount_paid, invoice_number").eq("id", cycleId ?? "").maybeSingle();
    if (!cycle) return json({ error: "Invoice not found." }, 404);
    const { data: member } = await admin.from("business_members").select("role")
      .eq("business_id", cycle.tenant_id).eq("user_id", user.id).eq("status", "active").maybeSingle();
    const isStaff = member?.role === "owner" || member?.role === "manager";
    if (cycle.client_id !== user.id && !isStaff) return json({ error: "Invoice not found." }, 404);
    if (["paid", "waived", "cancelled"].includes(cycle.status)) return json({ error: "This invoice needs no payment." }, 400);
    const balance = Number(cycle.amount_due) + Number(cycle.late_fee ?? 0) - Number(cycle.amount_paid ?? 0);
    amount = Math.ceil(Number(body.amount));
    if (!(amount >= 1) || amount > balance) return json({ error: `Enter an amount up to KSh ${balance}.` }, 400);
    const { data: biz } = await admin.from("businesses").select("id, name, status").eq("id", cycle.tenant_id).maybeSingle();
    if (!biz || biz.status !== "active") return json({ error: "This business is not active." }, 400);
    const { data: ts } = await admin.from("tenant_settings").select("mpesa_shortcode").eq("tenant_id", cycle.tenant_id).maybeSingle();
    const { data: sec } = await admin.from("tenant_secrets").select("mpesa_passkey").eq("tenant_id", cycle.tenant_id).maybeSingle();
    if (!ts?.mpesa_shortcode || !sec?.mpesa_passkey) {
      return json({ error: "This business has not set up M-Pesa prompts. Pay to its paybill or till and send the code to the manager.", code: "BUSINESS_NOT_CONFIGURED" }, 400);
    }
    shortcode = ts.mpesa_shortcode; passkey = sec.mpesa_passkey;
    bizId = biz.id; bizName = biz.name; cycleRef = cycle.id; tenancyRef = cycle.tenancy_id; desc = `Rent ${cycle.invoice_number ?? ""}`;
  }

  if (!key || !secret || !passkey) {
    return json({ error: "M-Pesa is not set up on this server yet.", code: "NOT_CONFIGURED" }, 400);
  }

  const { data: intent, error: insErr } = await admin.from("payment_intents").insert({
    user_id: user.id, business_id: bizId, plan_id: planRef, purpose, method: "mpesa_stk",
    amount_kes: amount, phone, status: "pending", billing_cycle_id: cycleRef, tenancy_id: tenancyRef,
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
        Amount: amount,
        PartyA: phone,
        PartyB: shortcode,
        PhoneNumber: phone,
        CallBackURL: `${url}/functions/v1/mpesa-callback?secret=${encodeURIComponent(callbackSecret)}`,
        AccountReference: bizName.slice(0, 12),
        TransactionDesc: desc.slice(0, 20),
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
