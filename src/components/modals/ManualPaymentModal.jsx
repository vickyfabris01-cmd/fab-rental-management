import { useState } from "react";
import { Modal }       from "./Modal.jsx";
import Button          from "../ui/Button.jsx";
import Input           from "../ui/Input.jsx";
import SelectInput     from "../ui/SelectInput.jsx";
import { Alert }       from "../ui/Alert.jsx";
import { formatCurrency, formatDate } from "../../lib/formatters.js";
import { recordManualPayment }        from "../../lib/api/payments.js";
import useAuthStore                   from "../../store/authStore.js";
import { useToast }                   from "../../hooks/useNotifications.js";

// =============================================================================
// ManualPaymentModal
//
// Manager records a cash / bank transfer / other payment on behalf of a client.
// Inserts a confirmed payment row directly — the DB reconciliation trigger fires.
//
// Props:
//   isOpen     — boolean
//   onClose    — fn
//   cycle      — billing_cycle row (with profiles join for client name)
//   onSuccess  — fn(payment) — called after successful record
// =============================================================================

const METHOD_OPTIONS = [
  { value: "cash",          label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "other",         label: "Other" },
];

export default function ManualPaymentModal({ isOpen, onClose, cycle, onSuccess }) {
  const profile  = useAuthStore(s => s.profile);
  const toast    = useToast();

  const [amount,  setAmount]  = useState("");
  const [method,  setMethod]  = useState("cash");
  const [notes,   setNotes]   = useState("");
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  if (!cycle) return null;

  const total      = Number(cycle.amount_due) + Number(cycle.late_fee ?? 0);
  const clientName = cycle.profiles?.full_name ?? "Resident";
  const period     = formatDate(cycle.period_start, { style: "long" });

  const validate = () => {
    const e = {};
    const n = Number(amount);
    if (!amount || isNaN(n) || n <= 0)  e.amount = "Enter a valid amount greater than 0";
    if (n > total * 1.1)                e.amount = `Amount exceeds balance due (${formatCurrency(total)})`;
    if (!method)                        e.method = "Select a payment method";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    try {
      const { data, error } = await recordManualPayment({
        tenantId:   profile.tenant_id,
        cycleId:    cycle.id,
        clientId:   cycle.client_id,
        amount:     Number(amount),
        method,
        recordedBy: profile.id,
        notes:      notes.trim() || null,
      });
      if (error) throw new Error(error.message);
      toast.success(`Payment of ${formatCurrency(Number(amount))} recorded for ${clientName}.`);
      onSuccess?.(data);
      onClose();
    } catch (err) {
      toast.error(err.message ?? "Failed to record payment.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => { setAmount(""); setMethod("cash"); setNotes(""); setErrors({}); onClose(); };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Record Manual Payment" size="sm"
      footer={<>
        <Button variant="secondary" onClick={handleClose}>Cancel</Button>
        <Button variant="primary" loading={loading} onClick={handleSubmit}>Record Payment</Button>
      </>}>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Cycle summary */}
        <div style={{ background: "#FAF7F2", border: "1px solid #EDE4D8", borderRadius: 12, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 12, color: "#8B7355", margin: "0 0 3px" }}>Recording for</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#1A1412", margin: 0 }}>{clientName}</p>
            <p style={{ fontSize: 12, color: "#8B7355", margin: "2px 0 0" }}>
              {cycle.rooms?.room_number && `Room ${cycle.rooms.room_number} · `}{period}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 11, color: "#8B7355", margin: "0 0 2px" }}>Balance due</p>
            <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 20, color: "#C5612C", margin: 0 }}>
              {formatCurrency(total)}
            </p>
          </div>
        </div>

        {/* Amount */}
        <Input
          label="Amount Paid (KES)"
          type="number"
          min="1"
          placeholder={String(Math.ceil(total))}
          value={amount}
          onChange={e => { setAmount(e.target.value); setErrors(p => ({ ...p, amount: null })); }}
          error={errors.amount}
          required
          leftAdornment={<span style={{ fontSize: 12, fontWeight: 600, color: "#8B7355" }}>KES</span>}
        />

        {/* Method */}
        <SelectInput
          label="Payment Method"
          options={METHOD_OPTIONS}
          value={method}
          onChange={setMethod}
          error={errors.method}
          required
        />

        {/* Notes */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#1A1412" }}>Notes <span style={{ color: "#8B7355", fontWeight: 400 }}>(optional)</span></label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Cash received at office on 15 Mar 2025"
            rows={3}
            style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #E8DDD4", borderRadius: 12, fontSize: 14, fontFamily: "'DM Sans', system-ui", outline: "none", resize: "vertical", lineHeight: 1.6 }}
            onFocus={e => e.target.style.borderColor = "#C5612C"}
            onBlur={e  => e.target.style.borderColor = "#E8DDD4"}
          />
        </div>

        <Alert type="info" compact
          message="This records a confirmed payment immediately. The billing cycle status will update automatically." />
      </div>
    </Modal>
  );
}
