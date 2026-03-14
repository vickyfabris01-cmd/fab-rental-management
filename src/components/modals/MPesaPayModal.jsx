import { useState, useEffect, useRef } from "react";
import { Modal }                        from "./Modal.jsx";
import Button                           from "../ui/Button.jsx";
import { Alert }                        from "../ui/Alert.jsx";
import { formatCurrency, formatDate }   from "../../lib/formatters.js";
import { normalizePhone, isValidKEPhone } from "../../lib/mpesa.js";
import { mpesaSTKPush, pollPaymentStatus } from "../../lib/api/payments.js";
import useAuthStore                     from "../../store/authStore.js";

// =============================================================================
// MPesaPayModal
//
// Three-step flow for client rent payment via M-Pesa STK Push:
//   Step 1 — FORM:    confirm amount, enter/confirm phone number
//   Step 2 — WAITING: STK push sent, polling for confirmation (60s timeout)
//   Step 3 — RESULT:  success (receipt) or failure (retry option)
//
// Props:
//   isOpen    — boolean
//   onClose   — fn
//   cycle     — billing_cycle row (with room join)
//   onSuccess — fn(payment) — called after confirmed payment
// =============================================================================

const STEPS = { FORM: "form", WAITING: "waiting", SUCCESS: "success", FAILED: "failed" };

// Animated M-Pesa phone icon
function PhoneAnimation({ active }) {
  return (
    <div style={{
      width: 72, height: 72, borderRadius: "50%",
      background: active ? "rgba(16,185,129,0.10)" : "rgba(197,97,44,0.10)",
      border: `2px solid ${active ? "#10B981" : "#C5612C"}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      margin: "0 auto 20px",
      animation: active ? "mpesa-pulse 1.5s ease-in-out infinite" : "none",
    }}>
      <style>{`
        @keyframes mpesa-pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.08);opacity:0.85} }
        @keyframes mpesa-spin  { to{transform:rotate(360deg)} }
      `}</style>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={active ? "#10B981" : "#C5612C"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
        <line x1="12" y1="18" x2="12.01" y2="18"/>
      </svg>
    </div>
  );
}

export default function MPesaPayModal({ isOpen, onClose, cycle, onSuccess }) {
  const profile    = useAuthStore(s => s.profile);
  const [step,     setStep]     = useState(STEPS.FORM);
  const [phone,    setPhone]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [paymentId,setPaymentId]= useState(null);
  const [receipt,  setReceipt]  = useState(null);
  const [countdown,setCountdown]= useState(60);
  const pollRef    = useRef(null);
  const timerRef   = useRef(null);

  // Pre-fill phone from profile
  useEffect(() => {
    if (isOpen && profile?.phone) setPhone(profile.phone);
  }, [isOpen, profile?.phone]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setStep(STEPS.FORM);
      setError(null);
      setLoading(false);
      setCountdown(60);
      clearInterval(timerRef.current);
    }
  }, [isOpen]);

  // Countdown timer during WAITING step
  useEffect(() => {
    if (step === STEPS.WAITING) {
      setCountdown(60);
      timerRef.current = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) { clearInterval(timerRef.current); setStep(STEPS.FAILED); setError("Payment timed out. Please try again."); return 0; }
          return c - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [step]);

  if (!cycle) return null;

  const total    = Number(cycle.amount_due) + Number(cycle.late_fee ?? 0);
  const period   = formatDate(cycle.period_start, { style: "long" });
  const roomNo   = cycle.rooms?.room_number ?? "—";

  const handleSubmit = async () => {
    setError(null);
    if (!isValidKEPhone(phone)) { setError("Enter a valid Kenya phone number e.g. 0712 345 678"); return; }

    setLoading(true);
    try {
      const { data, error: apiErr } = await mpesaSTKPush({
        cycleId:   cycle.id,
        clientId:  profile.id,
        phone:     normalizePhone(phone),
        amount:    total,
        reference: `Room ${roomNo}`,
      });

      if (apiErr) throw new Error(apiErr.message);

      setPaymentId(data.payment_id);
      setStep(STEPS.WAITING);

      // Poll until status changes
      const status = await pollPaymentStatus(data.payment_id, {
        intervalMs:  3000,
        maxAttempts: 20,
        onUpdate: (s) => {
          if (s === "confirmed") { clearInterval(timerRef.current); setReceipt(data.mpesa_receipt); setStep(STEPS.SUCCESS); onSuccess?.(data); }
          if (s === "failed")    { clearInterval(timerRef.current); setError("Payment was declined by M-Pesa. Please try again."); setStep(STEPS.FAILED); }
        },
      });

      if (status === "pending") { setStep(STEPS.FAILED); setError("Payment timed out. Please try again."); }
    } catch (e) {
      setError(e.message ?? "Something went wrong. Please try again.");
      setStep(STEPS.FAILED);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 1: Form ──────────────────────────────────────────────────────────
  const FormStep = (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Summary card */}
      <div style={{ background: "#FAF7F2", border: "1px solid #EDE4D8", borderRadius: 14, padding: "16px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ fontSize: 12, color: "#8B7355", margin: "0 0 3px" }}>Paying for</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#1A1412", margin: 0 }}>Room {roomNo} — {period}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 12, color: "#8B7355", margin: "0 0 3px" }}>Amount due</p>
            <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 22, color: "#C5612C", margin: 0 }}>
              {formatCurrency(total)}
            </p>
            {Number(cycle.late_fee) > 0 && (
              <p style={{ fontSize: 10, color: "#EF4444", margin: "2px 0 0" }}>incl. {formatCurrency(cycle.late_fee)} late fee</p>
            )}
          </div>
        </div>
      </div>

      {/* Phone input */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "#1A1412" }}>M-Pesa Phone Number</label>
        <div style={{ display: "flex", border: "1.5px solid #E8DDD4", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "11px 14px", background: "#F5EDE0", borderRight: "1.5px solid #E8DDD4", fontSize: 13, fontWeight: 600, color: "#5C4A3A", whiteSpace: "nowrap" }}>
            🇰🇪 +254
          </div>
          <input
            type="tel" inputMode="numeric"
            value={phone.startsWith("254") ? "0" + phone.slice(3) : phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="712 345 678"
            style={{ flex: 1, border: "none", outline: "none", padding: "11px 14px", fontSize: 14, fontFamily: "'DM Sans', system-ui", background: "#fff" }}
          />
        </div>
        <p style={{ fontSize: 12, color: "#8B7355", margin: 0 }}>
          A push notification will appear on this phone. Enter your M-Pesa PIN to confirm.
        </p>
      </div>

      {error && <Alert type="error" message={error} />}
    </div>
  );

  // ── Step 2: Waiting ───────────────────────────────────────────────────────
  const WaitingStep = (
    <div style={{ textAlign: "center", padding: "16px 0" }}>
      <PhoneAnimation active />
      <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 19, color: "#1A1412", marginBottom: 8 }}>
        Check your phone
      </p>
      <p style={{ fontSize: 14, color: "#5C4A3A", lineHeight: 1.6, marginBottom: 20 }}>
        An M-Pesa push notification has been sent to <strong>{phone}</strong>.<br/>
        Enter your PIN to confirm the payment of <strong>{formatCurrency(total)}</strong>.
      </p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#8B7355", fontSize: 13 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: "mpesa-spin 1s linear infinite", flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0110 10"/>
        </svg>
        Waiting for confirmation… {countdown}s
      </div>
    </div>
  );

  // ── Step 3a: Success ──────────────────────────────────────────────────────
  const SuccessStep = (
    <div style={{ textAlign: "center", padding: "16px 0" }}>
      <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#ECFDF5", border: "2px solid #10B981", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>
      <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 19, color: "#1A1412", marginBottom: 8 }}>Payment Confirmed!</p>
      <p style={{ fontSize: 14, color: "#5C4A3A", marginBottom: 16 }}>
        {formatCurrency(total)} received for Room {roomNo} — {period}.
      </p>
      {receipt && (
        <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 10, padding: "10px 16px", display: "inline-block" }}>
          <p style={{ fontSize: 11, color: "#059669", margin: 0 }}>M-Pesa Receipt</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#065F46", margin: "2px 0 0" }}>{receipt}</p>
        </div>
      )}
    </div>
  );

  // ── Step 3b: Failed ───────────────────────────────────────────────────────
  const FailedStep = (
    <div style={{ textAlign: "center", padding: "16px 0" }}>
      <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#FEF2F2", border: "2px solid #EF4444", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </div>
      <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 19, color: "#1A1412", marginBottom: 8 }}>Payment Failed</p>
      <p style={{ fontSize: 14, color: "#5C4A3A", marginBottom: 0 }}>{error ?? "The payment was not completed."}</p>
    </div>
  );

  const CONTENT = { [STEPS.FORM]: FormStep, [STEPS.WAITING]: WaitingStep, [STEPS.SUCCESS]: SuccessStep, [STEPS.FAILED]: FailedStep };

  const footer = step === STEPS.FORM ? (
    <>
      <Button variant="secondary" onClick={onClose}>Cancel</Button>
      <Button variant="primary" loading={loading} onClick={handleSubmit}>Send M-Pesa Request</Button>
    </>
  ) : step === STEPS.FAILED ? (
    <>
      <Button variant="secondary" onClick={onClose}>Close</Button>
      <Button variant="primary" onClick={() => { setStep(STEPS.FORM); setError(null); }}>Try Again</Button>
    </>
  ) : step === STEPS.SUCCESS ? (
    <Button variant="primary" fullWidth onClick={onClose}>Done</Button>
  ) : null;

  return (
    <Modal isOpen={isOpen} onClose={step !== STEPS.WAITING ? onClose : undefined}
      closable={step !== STEPS.WAITING} title={step === STEPS.FORM ? "Pay Rent via M-Pesa" : undefined}
      size="sm" footer={footer}>
      {CONTENT[step]}
    </Modal>
  );
}
