import { useState } from "react";
import { Modal }    from "./Modal.jsx";
import Button       from "../ui/Button.jsx";
import Input        from "../ui/Input.jsx";
import Avatar       from "../ui/Avatar.jsx";
import { Alert }    from "../ui/Alert.jsx";
import { Spinner }  from "../ui/Spinner.jsx";
import { lookupVisitorByEmail, assignRole } from "../../lib/api/profile.js";
import useAuthStore from "../../store/authStore.js";
import { useToast } from "../../hooks/useNotifications.js";
import { formatDate } from "../../lib/formatters.js";

// =============================================================================
// AssignRoleModal
//
// Universal role assignment flow — no email invites. The target user must
// already have a fabRentals account (visitor role).
//
// Flow:
//   1. Inviter types the email address of the person
//   2. System searches profiles for a visitor with that email
//   3. If found: show profile card + "Assign as [role]" button
//   4. On confirm: call assign_role RPC to elevate the visitor
//
// Permission matrix (enforced client + server):
//   super_admin → assigns 'owner'   (must supply tenantId)
//   owner       → assigns 'manager'
//   manager     → assigns 'worker'
//
// Props:
//   isOpen     — boolean
//   onClose    — fn
//   targetRole — 'owner' | 'manager' | 'worker'
//   tenantId   — UUID (required when assigning owner; falls back to caller's)
//   onSuccess  — fn(assignedProfile)
// =============================================================================

const ROLE_META = {
  owner:   { label: "Owner",   color: "#8B5CF6", bg: "#F5F3FF", icon: "👑" },
  manager: { label: "Manager", color: "#3B82F6", bg: "#EFF6FF", icon: "🏢" },
  worker:  { label: "Worker",  color: "#F59E0B", bg: "#FFFBEB", icon: "🔧" },
};

const ROLE_PERMISSIONS = {
  owner: [
    "View full financial reports and analytics",
    "Assign and remove managers",
    "Configure tenant branding and settings",
    "View all payments, billing, and workforce costs",
  ],
  manager: [
    "Manage buildings and rooms",
    "Approve rental requests and move-ins",
    "Record payments and generate invoices",
    "Manage workers and record attendance",
    "Handle complaints and send announcements",
  ],
  worker: [
    "View their own dashboard and salary history",
    "Record their own attendance",
    "View assigned tasks and schedules",
  ],
};

export default function AssignRoleModal({
  isOpen,
  onClose,
  targetRole,
  tenantId,
  onSuccess,
}) {
  const profile = useAuthStore((s) => s.profile);
  const toast   = useToast();
  const meta    = ROLE_META[targetRole] ?? ROLE_META.manager;

  const [email,       setEmail]       = useState("");
  const [searching,   setSearching]   = useState(false);
  const [found,       setFound]       = useState(null);  // profile row
  const [searchErr,   setSearchErr]   = useState(null);
  const [assigning,   setAssigning]   = useState(false);
  const [done,        setDone]        = useState(false);

  // ── Step 1: look up visitor by email ─────────────────────────────────────
  const handleSearch = async () => {
    setSearchErr(null);
    setFound(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setSearchErr("Enter a valid email address.");
      return;
    }
    setSearching(true);
    try {
      const { data, error } = await lookupVisitorByEmail(trimmed);
      if (error) throw new Error(error);
      if (!data) {
        setSearchErr(
          "No visitor account found with that email. The person must first create a fabRentals account.",
        );
      } else {
        setFound(data);
      }
    } catch (e) {
      setSearchErr(e.message ?? "Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  // ── Step 2: assign the role ───────────────────────────────────────────────
  const handleAssign = async () => {
    if (!found) return;
    setAssigning(true);
    try {
      const effectiveTenantId =
        tenantId ?? profile?.tenant_id ?? null;
      const { error } = await assignRole(
        found.id,
        targetRole,
        effectiveTenantId,
      );
      if (error) throw new Error(error);
      toast.success(
        `${found.full_name ?? found.email} has been assigned as ${meta.label}.`,
      );
      setDone(true);
      onSuccess?.(found);
    } catch (e) {
      toast.error(e.message ?? "Assignment failed. Please try again.");
    } finally {
      setAssigning(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setFound(null);
    setSearchErr(null);
    setDone(false);
    onClose();
  };

  // ── Success state ─────────────────────────────────────────────────────────
  if (done) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={undefined}
        size="sm"
        footer={
          <Button variant="primary" onClick={handleClose} style={{ width: "100%" }}>
            Done
          </Button>
        }
      >
        <div style={{ textAlign: "center", padding: "12px 0 20px" }}>
          <div
            style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "#ECFDF5", border: "2px solid #10B981",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 18px", fontSize: 28,
            }}
          >
            ✅
          </div>
          <p
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 900, fontSize: 20, color: "#1A1412", marginBottom: 8,
            }}
          >
            Role Assigned!
          </p>
          <p style={{ fontSize: 14, color: "#5C4A3A", lineHeight: 1.65 }}>
            <strong>{found?.full_name ?? found?.email}</strong> is now a{" "}
            <span style={{ color: meta.color, fontWeight: 700 }}>
              {meta.label}
            </span>
            . They can sign in to access their dashboard immediately.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Assign ${meta.label}`}
      size="sm"
      footer={
        found ? (
          <>
            <Button variant="secondary" onClick={() => { setFound(null); setEmail(""); }}>
              Search again
            </Button>
            <Button
              variant="primary"
              loading={assigning}
              onClick={handleAssign}
            >
              {meta.icon} Assign as {meta.label}
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={handleClose}>Cancel</Button>
            <Button
              variant="primary"
              loading={searching}
              onClick={handleSearch}
            >
              Find Account
            </Button>
          </>
        )
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

        {/* Instructions */}
        {!found && (
          <p style={{ fontSize: 14, color: "#5C4A3A", lineHeight: 1.65, margin: 0 }}>
            The person must already have a <strong>fabRentals visitor account</strong>.
            Enter their email to look them up — no invite link needed.
          </p>
        )}

        {/* Email search */}
        {!found && (
          <>
            <Input
              label="Email Address"
              type="email"
              required
              placeholder="e.g. samuel@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setSearchErr(null);
              }}
              error={searchErr}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            {searching && (
              <div style={{ display: "flex", justifyContent: "center", padding: 8 }}>
                <Spinner size="sm" />
              </div>
            )}
          </>
        )}

        {/* Found profile card */}
        {found && (
          <div
            style={{
              display: "flex", alignItems: "center", gap: 14,
              background: "#FAF7F2", border: "1.5px solid #EDE4D8",
              borderRadius: 14, padding: "14px 16px",
            }}
          >
            <Avatar
              name={found.full_name}
              src={found.avatar_url}
              size={48}
              style={{ flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 700, fontSize: 15, color: "#1A1412", margin: "0 0 2px",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}
              >
                {found.full_name ?? "—"}
              </p>
              <p style={{ fontSize: 12, color: "#8B7355", margin: "0 0 4px" }}>
                {found.email}
              </p>
              <span
                style={{
                  fontSize: 10, fontWeight: 700, padding: "2px 8px",
                  borderRadius: 999, background: "rgba(139,115,85,0.10)",
                  color: "#8B7355", textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Visitor · joined {formatDate(found.created_at)}
              </span>
            </div>
            <div
              style={{
                width: 36, height: 36, borderRadius: "50%",
                background: meta.bg, display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: 18, flexShrink: 0,
              }}
            >
              {meta.icon}
            </div>
          </div>
        )}

        {/* Permissions preview */}
        <div
          style={{
            background: "#FAF7F2", border: "1px solid #EDE4D8",
            borderRadius: 12, padding: "14px 16px",
          }}
        >
          <p
            style={{
              fontSize: 11, fontWeight: 700, color: meta.color,
              textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10,
            }}
          >
            {meta.label} Permissions
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {(ROLE_PERMISSIONS[targetRole] ?? []).map((perm, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <svg
                  width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"
                  style={{ flexShrink: 0, marginTop: 2 }}
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span style={{ fontSize: 13, color: "#5C4A3A" }}>{perm}</span>
              </div>
            ))}
          </div>
        </div>

        {found && (
          <Alert
            type="warning"
            compact
            message={`This will immediately grant ${found.full_name ?? "this user"} ${meta.label} access. They can sign in straight away.`}
          />
        )}
      </div>
    </Modal>
  );
}
