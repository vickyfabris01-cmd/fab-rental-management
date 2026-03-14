import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal }     from "./Modal.jsx";
import Button        from "../ui/Button.jsx";
import Input         from "../ui/Input.jsx";
import { Alert }     from "../ui/Alert.jsx";
import { formatCurrency } from "../../lib/formatters.js";
import { createRequest }  from "../../lib/api/rentalRequests.js";
import useAuthStore        from "../../store/authStore.js";
import { useToast }        from "../../hooks/useNotifications.js";

// =============================================================================
// RentalRequestModal
//
// Used on the public property detail page and BrowsePage.
// If the user is not logged in, prompts them to sign up first.
//
// Props:
//   isOpen       — boolean
//   onClose      — fn
//   room         — room row (id, room_number, room_type, monthly_price, tenant_id)
//   tenantName   — string — property/hostel name shown in header
//   onSuccess    — fn(request) — called after successful submission
// =============================================================================

export default function RentalRequestModal({ isOpen, onClose, room, tenantName, onSuccess }) {
  const navigate   = useNavigate();
  const user       = useAuthStore(s => s.user);
  const profile    = useAuthStore(s => s.profile);
  const toast      = useToast();

  const [moveIn,   setMoveIn]   = useState("");
  const [message,  setMessage]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState({});
  const [submitted,setSubmitted]= useState(false);

  if (!room) return null;

  const today    = new Date().toISOString().slice(0, 10);
  const isGuest  = !user;
  const isClient = profile?.role === "client";

  // Guest: redirect to signup
  if (isGuest) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Create an account to request" size="sm"
        footer={<>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => { onClose(); navigate("/signup"); }}>Create Free Account →</Button>
        </>}>
        <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#FFF5EF", border: "1.5px solid rgba(197,97,44,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C5612C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"/>
            </svg>
          </div>
          <p style={{ fontSize: 15, color: "#5C4A3A", lineHeight: 1.65, margin: 0 }}>
            You need a free fabrentals account to submit a rental request for <strong>Room {room.room_number}</strong> at <strong>{tenantName}</strong>.
          </p>
          <p style={{ fontSize: 13, color: "#8B7355", marginTop: 10 }}>
            Already have an account? <button onClick={() => { onClose(); navigate("/login"); }}
              style={{ background: "none", border: "none", color: "#C5612C", cursor: "pointer", fontWeight: 600, fontSize: 13, padding: 0 }}>Sign in →</button>
          </p>
        </div>
      </Modal>
    );
  }

  // Already has active tenancy
  if (isClient) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Already a Resident" size="sm"
        footer={<Button variant="primary" onClick={onClose}>Close</Button>}>
        <Alert type="info" message="You already have an active tenancy. You can only request a room transfer from your dashboard." />
      </Modal>
    );
  }

  // Success state
  if (submitted) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={undefined} size="sm"
        footer={<Button variant="primary" fullWidth onClick={onClose}>Done</Button>}>
        <div style={{ textAlign: "center", padding: "12px 0 20px" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#ECFDF5", border: "2px solid #10B981", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 20, color: "#1A1412", marginBottom: 8 }}>Request Submitted!</p>
          <p style={{ fontSize: 14, color: "#5C4A3A", lineHeight: 1.65 }}>
            Your request for Room {room.room_number} at <strong>{tenantName}</strong> has been sent to the property manager. You'll be notified within 24 hours.
          </p>
        </div>
      </Modal>
    );
  }

  const validate = () => {
    const e = {};
    if (!moveIn) e.moveIn = "Preferred move-in date is required";
    else if (moveIn < today) e.moveIn = "Move-in date must be today or later";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      const { data, error } = await createRequest({
        tenantId:        room.tenant_id,
        roomId:          room.id,
        requesterId:     profile.id,
        preferredMoveIn: moveIn,
        message:         message.trim() || null,
      });
      if (error) throw new Error(error.message);
      setSubmitted(true);
      onSuccess?.(data);
    } catch (err) {
      toast.error(err.message ?? "Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request This Room" size="sm"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" loading={loading} onClick={handleSubmit}>Submit Request</Button>
      </>}>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Room summary */}
        <div style={{ background: "#FAF7F2", border: "1px solid #EDE4D8", borderRadius: 12, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#1A1412", margin: 0 }}>Room {room.room_number}</p>
            <p style={{ fontSize: 12, color: "#8B7355", margin: "2px 0 0", textTransform: "capitalize" }}>
              {room.room_type?.replace(/_/g," ")} · {tenantName}
            </p>
          </div>
          <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 18, color: "#C5612C", margin: 0 }}>
            {formatCurrency(room.monthly_price)}<span style={{ fontSize: 11, fontWeight: 400, color: "#8B7355" }}>/mo</span>
          </p>
        </div>

        {/* Move-in date */}
        <Input label="Preferred Move-In Date" type="date" required
          min={today}
          value={moveIn}
          onChange={e => { setMoveIn(e.target.value); setErrors(p => ({ ...p, moveIn: null })); }}
          error={errors.moveIn}
        />

        {/* Message */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#1A1412" }}>
            Message to Manager <span style={{ color: "#8B7355", fontWeight: 400 }}>(optional)</span>
          </label>
          <textarea
            value={message} onChange={e => setMessage(e.target.value)}
            placeholder="Introduce yourself or ask any questions…"
            rows={3}
            style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #E8DDD4", borderRadius: 12, fontSize: 14, fontFamily: "'DM Sans', system-ui", outline: "none", resize: "vertical", lineHeight: 1.6 }}
            onFocus={e => e.target.style.borderColor = "#C5612C"}
            onBlur={e  => e.target.style.borderColor = "#E8DDD4"}
          />
        </div>
      </div>
    </Modal>
  );
}
