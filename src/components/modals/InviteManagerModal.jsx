import { useState } from "react";
import { Modal }     from "./Modal.jsx";
import Button        from "../ui/Button.jsx";
import Input         from "../ui/Input.jsx";
import { Alert }     from "../ui/Alert.jsx";
import { validateEmail } from "../../lib/validators.js";
import { sendManagerInvite } from "../../lib/api/profile.js";
import useAuthStore  from "../../store/authStore.js";
import { useToast }  from "../../hooks/useNotifications.js";

// =============================================================================
// InviteManagerModal
//
// Owner sends a manager invite link to an email address.
// Creates a manager_invites row — the email is dispatched by FastAPI.
//
// Props:
//   isOpen    — boolean
//   onClose   — fn
//   onSuccess — fn(invite)
// =============================================================================

const MANAGER_PERMISSIONS = [
  "View and manage all rooms and buildings",
  "Approve / reject rental requests",
  "Record payments and generate invoices",
  "Manage residents (move-in, move-out, transfer)",
  "Manage workforce and record attendance",
  "Handle complaints and send announcements",
];

export default function InviteManagerModal({ isOpen, onClose, onSuccess }) {
  const profile  = useAuthStore(s => s.profile);
  const toast    = useToast();

  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [sent,    setSent]    = useState(false);

  const handleSubmit = async () => {
    setError(null);
    const v = validateEmail(email);
    if (!v.valid) { setError(v.message); return; }

    setLoading(true);
    try {
      const { data, err } = await sendManagerInvite(profile.tenant_id, email.trim().toLowerCase(), profile.id);
      if (err) throw new Error(err.message);
      setSent(true);
      onSuccess?.(data);
    } catch (e) {
      setError(e.message ?? "Failed to send invite. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => { setEmail(""); setError(null); setSent(false); onClose(); };

  // Success state
  if (sent) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title={undefined} size="sm"
        footer={<Button variant="primary" fullWidth onClick={handleClose}>Done</Button>}>
        <div style={{ textAlign: "center", padding: "12px 0 20px" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#ECFDF5", border: "2px solid #10B981", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 20, color: "#1A1412", marginBottom: 8 }}>Invite Sent!</p>
          <p style={{ fontSize: 14, color: "#5C4A3A", lineHeight: 1.65 }}>
            An invite link has been sent to <strong>{email}</strong>. It expires in 48 hours.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite a Manager" size="sm"
      footer={<>
        <Button variant="secondary" onClick={handleClose}>Cancel</Button>
        <Button variant="primary" loading={loading} onClick={handleSubmit}>Send Invite →</Button>
      </>}>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <p style={{ fontSize: 14, color: "#5C4A3A", lineHeight: 1.65, margin: 0 }}>
          Enter the email address of the person you want to invite as a property manager. They'll receive a link to create their account.
        </p>

        <Input label="Email Address" type="email" required
          placeholder="manager@example.com"
          value={email}
          onChange={e => { setEmail(e.target.value); setError(null); }}
          error={error}
        />

        {/* Permissions preview */}
        <div style={{ background: "#FAF7F2", border: "1px solid #EDE4D8", borderRadius: 12, padding: "14px 16px" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#C5612C", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
            Manager Permissions
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {MANAGER_PERMISSIONS.map((perm, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span style={{ fontSize: 13, color: "#5C4A3A" }}>{perm}</span>
              </div>
            ))}
          </div>
        </div>

        <Alert type="info" compact message="The invite link expires after 48 hours. You can resend it from the Managers settings page." />
      </div>
    </Modal>
  );
}
