import { useState } from "react";
import { Modal }     from "./Modal.jsx";
import Button        from "../ui/Button.jsx";
import Input         from "../ui/Input.jsx";
import SelectInput   from "../ui/SelectInput.jsx";
import { Toggle }    from "../ui/TextArea.jsx";
import { Alert }     from "../ui/Alert.jsx";
import { broadcastNotification } from "../../lib/api/notifications.js";
import { fetchTenantProfiles }   from "../../lib/api/profile.js";
import useAuthStore  from "../../store/authStore.js";
import { useToast }  from "../../hooks/useNotifications.js";

// =============================================================================
// AnnouncementModal
//
// Manager broadcasts a message to residents, workers, or all.
// Sends in-app notifications + optional SMS/email (via FastAPI).
//
// Props:
//   isOpen    — boolean
//   onClose   — fn
//   onSuccess — fn()
// =============================================================================

const AUDIENCE_OPTIONS = [
  { value: "clients",  label: "All Residents"        },
  { value: "workers",  label: "All Workers / Staff"  },
  { value: "all",      label: "Everyone"             },
];

export default function AnnouncementModal({ isOpen, onClose, onSuccess }) {
  const profile  = useAuthStore(s => s.profile);
  const toast    = useToast();

  const [title,      setTitle]      = useState("");
  const [body,       setBody]       = useState("");
  const [audience,   setAudience]   = useState("clients");
  const [sendSMS,    setSendSMS]    = useState(false);
  const [sendEmail,  setSendEmail]  = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [errors,     setErrors]     = useState({});

  const validate = () => {
    const e = {};
    if (!title.trim() || title.trim().length < 4)  e.title = "Title must be at least 4 characters";
    if (!body.trim()  || body.trim().length  < 10)  e.body  = "Message must be at least 10 characters";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      // Fetch recipients
      const roles = audience === "all" ? ["client", "worker"] : audience === "clients" ? ["client"] : ["worker"];
      const profileLists = await Promise.all(
        roles.map(role => fetchTenantProfiles(profile.tenant_id, { role }).then(r => r.data ?? []))
      );
      const recipients = profileLists.flat();

      if (!recipients.length) {
        toast.warning("No recipients found for the selected audience.");
        setLoading(false);
        return;
      }

      const userIds = recipients.map(r => r.id);
      const { error } = await broadcastNotification(
        profile.tenant_id,
        userIds,
        { type: "announcement", title: title.trim(), body: body.trim() }
      );
      if (error) throw new Error(error.message);

      // If SMS/email channels requested, those calls go through FastAPI
      // (not implemented client-side — fire-and-forget notification to backend)
      if (sendSMS || sendEmail) {
        // POST to FastAPI /announcements with channels[] — placeholder
      }

      toast.success(`Announcement sent to ${recipients.length} ${audience === "all" ? "people" : audience}.`);
      onSuccess?.();
      handleClose();
    } catch (err) {
      toast.error(err.message ?? "Failed to send announcement.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => { setTitle(""); setBody(""); setAudience("clients"); setSendSMS(false); setSendEmail(false); setErrors({}); onClose(); };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Send Announcement" size="md"
      footer={<>
        <Button variant="secondary" onClick={handleClose}>Cancel</Button>
        <Button variant="primary" loading={loading} onClick={handleSubmit}>Send Announcement</Button>
      </>}>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Audience */}
        <SelectInput label="Send to" required options={AUDIENCE_OPTIONS} value={audience} onChange={setAudience} />

        {/* Title */}
        <Input label="Announcement Title" required
          placeholder="e.g. Water Interruption Notice, Rent Due Reminder"
          value={title}
          onChange={e => { setTitle(e.target.value); setErrors(p => ({ ...p, title: null })); }}
          error={errors.title}
        />

        {/* Body */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#1A1412" }}>
            Message <span style={{ color: "#EF4444" }}>*</span>
            <span style={{ fontSize: 11, color: "#8B7355", fontWeight: 400, marginLeft: 8 }}>{body.length}/500</span>
          </label>
          <textarea
            value={body}
            onChange={e => { if (e.target.value.length <= 500) setBody(e.target.value); setErrors(p => ({ ...p, body: null })); }}
            placeholder="Write your announcement message here…"
            rows={5}
            style={{
              width: "100%", padding: "10px 14px",
              border: `1.5px solid ${errors.body ? "#EF4444" : "#E8DDD4"}`,
              borderRadius: 12, fontSize: 14, fontFamily: "'DM Sans', system-ui",
              outline: "none", resize: "vertical", lineHeight: 1.6,
            }}
            onFocus={e => e.target.style.borderColor = errors.body ? "#EF4444" : "#C5612C"}
            onBlur={e  => e.target.style.borderColor = errors.body ? "#EF4444" : "#E8DDD4"}
          />
          {errors.body && <span style={{ fontSize: 12, color: "#EF4444" }}>{errors.body}</span>}
        </div>

        {/* Channels */}
        <div style={{ background: "#FAF7F2", border: "1px solid #EDE4D8", borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#1A1412", margin: 0 }}>Additional Channels</p>
          <Toggle label="Send SMS to each recipient" checked={sendSMS}   onChange={setSendSMS}  />
          <Toggle label="Send Email notification"     checked={sendEmail} onChange={setSendEmail}/>
          {(sendSMS || sendEmail) && (
            <p style={{ fontSize: 11, color: "#8B7355", margin: 0 }}>
              SMS and email delivery is subject to your tenant notification settings and available credits.
            </p>
          )}
        </div>

        <Alert type="info" compact
          message="In-app notifications are always sent. SMS and email are optional additional channels." />
      </div>
    </Modal>
  );
}
