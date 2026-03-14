import { useState } from "react";
import { Modal }      from "./Modal.jsx";
import Button         from "../ui/Button.jsx";
import Input          from "../ui/Input.jsx";
import SelectInput    from "../ui/SelectInput.jsx";
import { createComplaint } from "../../lib/api/complaints.js";
import useAuthStore        from "../../store/authStore.js";
import { useToast }        from "../../hooks/useNotifications.js";

// =============================================================================
// NewComplaintModal
//
// Client submits a new complaint or maintenance request.
//
// Props:
//   isOpen     — boolean
//   onClose    — fn
//   tenancyId  — string | null — pre-link to active tenancy
//   onSuccess  — fn(complaint)
// =============================================================================

const CATEGORY_OPTIONS = [
  { value: "maintenance", label: "Maintenance / Repairs" },
  { value: "noise",       label: "Noise Disturbance"     },
  { value: "billing",     label: "Billing Issue"         },
  { value: "security",    label: "Security Concern"      },
  { value: "cleanliness", label: "Cleanliness"           },
  { value: "other",       label: "Other"                 },
];

const PRIORITY_OPTIONS = [
  { value: "low",    label: "Low — not urgent"        },
  { value: "normal", label: "Normal"                  },
  { value: "high",   label: "High — needs attention"  },
  { value: "urgent", label: "Urgent — safety concern" },
];

const PRIORITY_COLORS = { low: "#8B7355", normal: "#3B82F6", high: "#D97706", urgent: "#DC2626" };

export default function NewComplaintModal({ isOpen, onClose, tenancyId, onSuccess }) {
  const profile  = useAuthStore(s => s.profile);
  const toast    = useToast();

  const [title,    setTitle]    = useState("");
  const [desc,     setDesc]     = useState("");
  const [category, setCategory] = useState("maintenance");
  const [priority, setPriority] = useState("normal");
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState({});

  const validate = () => {
    const e = {};
    if (!title.trim() || title.trim().length < 5)   e.title = "Title must be at least 5 characters";
    if (!desc.trim()  || desc.trim().length  < 20)  e.desc  = "Please provide more detail (at least 20 characters)";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      const { data, error } = await createComplaint({
        tenantId:    profile.tenant_id,
        submittedBy: profile.id,
        tenancyId:   tenancyId ?? null,
        title:       title.trim(),
        description: desc.trim(),
        category,
        priority,
      });
      if (error) throw new Error(error.message);
      toast.success("Your complaint has been submitted. We'll respond shortly.");
      onSuccess?.(data);
      handleClose();
    } catch (err) {
      toast.error(err.message ?? "Failed to submit complaint.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => { setTitle(""); setDesc(""); setCategory("maintenance"); setPriority("normal"); setErrors({}); onClose(); };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Submit a Complaint" size="md"
      footer={<>
        <Button variant="secondary" onClick={handleClose}>Cancel</Button>
        <Button variant="primary" loading={loading} onClick={handleSubmit}>Submit Complaint</Button>
      </>}>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Category + Priority row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <SelectInput label="Category" required options={CATEGORY_OPTIONS} value={category} onChange={setCategory} />
          <SelectInput label="Priority" required options={PRIORITY_OPTIONS} value={priority} onChange={v => setPriority(v)} />
        </div>

        {/* Priority colour hint */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: -8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: PRIORITY_COLORS[priority], flexShrink: 0 }}/>
          <span style={{ fontSize: 12, color: PRIORITY_COLORS[priority], fontWeight: 600 }}>
            {priority === "urgent" ? "This will be flagged as urgent and reviewed immediately." :
             priority === "high"   ? "High priority — manager will be notified." :
             priority === "low"    ? "Will be reviewed at the manager's next availability." :
             "Standard response time: 24–48 hours."}
          </span>
        </div>

        {/* Title */}
        <Input label="Complaint Title" required
          placeholder="e.g. Water not running in Room 3B, broken window latch"
          value={title}
          onChange={e => { setTitle(e.target.value); setErrors(p => ({ ...p, title: null })); }}
          error={errors.title}
        />

        {/* Description */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#1A1412" }}>
            Description <span style={{ color: "#EF4444" }}>*</span>
            <span style={{ fontSize: 11, color: "#8B7355", fontWeight: 400, marginLeft: 8 }}>{desc.length}/500</span>
          </label>
          <textarea
            value={desc}
            onChange={e => { if (e.target.value.length <= 500) setDesc(e.target.value); setErrors(p => ({ ...p, desc: null })); }}
            placeholder="Describe the issue in detail — when it started, how it affects you, any relevant context…"
            rows={5}
            style={{
              width: "100%", padding: "10px 14px",
              border: `1.5px solid ${errors.desc ? "#EF4444" : "#E8DDD4"}`,
              borderRadius: 12, fontSize: 14, fontFamily: "'DM Sans', system-ui",
              outline: "none", resize: "vertical", lineHeight: 1.6,
            }}
            onFocus={e => e.target.style.borderColor = errors.desc ? "#EF4444" : "#C5612C"}
            onBlur={e  => e.target.style.borderColor = errors.desc ? "#EF4444" : "#E8DDD4"}
          />
          {errors.desc && <span style={{ fontSize: 12, color: "#EF4444" }}>{errors.desc}</span>}
        </div>
      </div>
    </Modal>
  );
}
