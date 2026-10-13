// mpesa-callback — Safaricom calls this when the customer answers the STK prompt.
// It is public (Safaricom has no login), so it is protected by a secret in the URL
// (MPESA_CALLBACK_SECRET) and it only ever updates a payment that we created ourselves.
// Safe to receive twice: a payment that is already paid stays paid.
import { createClient } from "npm:@supabase/supabase-js@2";

const ok = () => new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), { headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  const expected = Deno.env.get("MPESA_CALLBACK_SECRET") ?? "";
  const given = new URL(req.url).searchParams.get("secret") ?? "";
  if (expected && given !== expected) return new Response("Forbidden", { status: 403 });

  let payload: any;
  try { payload = await req.json(); } catch { return ok(); }
  const cb = payload?.Body?.stkCallback;
  if (!cb?.CheckoutRequestID) return ok();

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { data: intent } = await admin.from("payment_intents").select("id, status").eq("checkout_request_id", cb.CheckoutRequestID).maybeSingle();
  if (!intent || intent.status === "success") return ok();

  const items: { Name: string; Value?: string | number }[] = cb.CallbackMetadata?.Item ?? [];
  const receipt = items.find((i) => i.Name === "MpesaReceiptNumber")?.Value as string | undefined;

  if (cb.ResultCode === 0) {
    await admin.from("payment_intents").update({ result_code: 0, result_desc: cb.ResultDesc }).eq("id", intent.id);
    await admin.rpc("mark_intent_paid", { p_intent: intent.id, p_receipt: receipt ?? null });
  } else {
    await admin.from("payment_intents").update({
      status: cb.ResultCode === 1032 ? "cancelled" : "failed", result_code: cb.ResultCode, result_desc: cb.ResultDesc,
    }).eq("id", intent.id);
  }
  return ok();
});
