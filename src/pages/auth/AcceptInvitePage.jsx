import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

// ── Layout ────────────────────────────────────────────────────────────────────
import AuthLayout from "../../layouts/AuthLayout.jsx";

// ── Components ────────────────────────────────────────────────────────────────
import Input from "../../components/ui/Input.jsx";
import PasswordInput from "../../components/ui/PasswordInput.jsx";
import Button from "../../components/ui/Button.jsx";
import { Alert } from "../../components/ui/Alert.jsx";
import { Spinner } from "../../components/ui/Spinner.jsx";

// ── Store / hooks ─────────────────────────────────────────────────────────────
import { useToast } from "../../hooks/useNotifications.js";

// ── API ───────────────────────────────────────────────────────────────────────
import { fetchInviteByToken } from "../../lib/api/profile.js";
import { acceptInvite } from "../../lib/api/auth.js";

// ── Validators ────────────────────────────────────────────────────────────────
import {
  validatePassword,
  validatePasswordMatch,
  validateFullName,
} from "../../lib/validators.js";

// ── Config ────────────────────────────────────────────────────────────────────
import { ROLE_HOME } from "../../config/constants.js";

// =============================================================================
// AcceptInvitePage  /invite/:token
//
// Three-state flow:
//   loading      — validating token against Supabase
//   invalid      — token not found or malformed
//   expired      — token found but past expiry
//   valid step 1 — review invite details + accept/decline
//   valid step 2 — set full name + password
//   success      — account created, redirect prompt
// =============================================================================

const MANAGER_PERMISSIONS = [
  "Manage all rooms, buildings, and floors",
  "Approve or reject rental requests",
  "Record payments and generate invoices",
  "Move residents in and out",
  "Manage workforce and payroll",
  "Handle complaints and announcements",
];

function LeftContent({ tenantName }) {
  return (
    <>
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "rgba(255,255,255,0.45)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: 24,
        }}
      >
        fabrentals
      </p>
      <h2
        style={{
          fontFamily: "'Playfair Display',serif",
          fontWeight: 900,
          fontSize: "clamp(28px,3.5vw,44px)",
          color: "#fff",
          lineHeight: 1.15,
          marginBottom: 16,
        }}
      >
        You've been invited to join
      </h2>
      {tenantName && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(197,97,44,0.20)",
            border: "1px solid rgba(197,97,44,0.40)",
            borderRadius: 999,
            padding: "8px 18px",
            marginBottom: 28,
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#C5612C"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z M9 21V12h6v9" />
          </svg>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>
            {tenantName}
          </span>
        </div>
      )}
      <p
        style={{
          fontSize: 14,
          color: "rgba(255,255,255,0.55)",
          fontWeight: 300,
          lineHeight: 1.7,
          marginBottom: 36,
          maxWidth: 340,
        }}
      >
        Accept this invitation to start managing properties on fabrentals as a
        Property Manager.
      </p>
      {/* Orbital graphic */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 16,
        }}
      >
        <div
          style={{
            position: "relative",
            width: 160,
            height: 160,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: i * 52,
                height: i * 52,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            />
          ))}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: "#C5612C",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 32px rgba(197,97,44,0.45)",
              position: "relative",
              zIndex: 1,
            }}
          >
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M9 11a4 4 0 100-8 4 4 0 000 8z" />
            </svg>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AcceptInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [tokenState, setTokenState] = useState("loading"); // loading | invalid | expired | valid
  const [invite, setInvite] = useState(null);
  const [step, setStep] = useState(1); // 1=review, 2=set password, 3=success

  const [form, setForm] = useState({ fullName: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((e) => ({ ...e, [k]: null }));
  };

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setTokenState("invalid");
      return;
    }
    fetchInviteByToken(token)
      .then(({ data, error }) => {
        if (error || !data) {
          setTokenState("invalid");
          return;
        }
        if (data.accepted_at) {
          setTokenState("accepted");
          return;
        }
        if (new Date(data.expires_at) < new Date()) {
          setTokenState("expired");
          return;
        }
        setInvite(data);
        setTokenState("valid");
      })
      .catch(() => setTokenState("invalid"));
  }, [token]);

  const validate = () => {
    const e = {};
    const nameV = validateFullName(form.fullName);
    if (!nameV.valid) e.fullName = nameV.message;
    const pwV = validatePassword(form.password);
    if (!pwV.valid) e.password = "Password must be at least 8 characters";
    if (pwV.strength < 2) e.password = "Please choose a stronger password";
    const matchV = validatePasswordMatch(form.password, form.confirm);
    if (!matchV.valid) e.confirm = matchV.message;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAccept = async () => {
    if (!validate()) return;
    setApiError(null);
    setLoading(true);
    try {
      const { data, error } = await acceptInvite({
        token,
        email: invite.email,
        fullName: form.fullName.trim(),
        password: form.password,
      });
      if (error) throw new Error(error.message);
      setStep(3);
    } catch (e) {
      setApiError(e.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (tokenState === "loading") {
    return (
      <AuthLayout
        heading={"Validating\nyour invite…"}
        subheading="Just a moment."
        showBackLink={false}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 0",
            gap: 16,
          }}
        >
          <Spinner size="lg" />
          <p style={{ fontSize: 14, color: "#8B7355" }}>
            Checking your invitation…
          </p>
        </div>
      </AuthLayout>
    );
  }

  // ── Invalid token ────────────────────────────────────────────────────────
  if (tokenState === "invalid") {
    return (
      <AuthLayout
        heading={"Invalid\nInvite Link"}
        subheading="This link is invalid or has already been used."
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: "#FEF2F2",
              border: "2px solid #FECACA",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#DC2626"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h2
            style={{
              fontFamily: "'Playfair Display',serif",
              fontWeight: 900,
              fontSize: 26,
              color: "#1A1412",
              textAlign: "center",
              margin: 0,
            }}
          >
            Link not found
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "#5C4A3A",
              textAlign: "center",
              lineHeight: 1.65,
              margin: 0,
            }}
          >
            This invite link is invalid or has already been used. Contact the
            person who invited you to request a new one.
          </p>
          <Button
            variant="primary"
            fullWidth
            onClick={() => navigate("/login")}
          >
            Go to Sign In
          </Button>
        </div>
      </AuthLayout>
    );
  }

  // ── Expired token ────────────────────────────────────────────────────────
  if (tokenState === "expired") {
    return (
      <AuthLayout
        heading={"Invite\nExpired"}
        subheading="This invitation link has expired."
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: "#FFFBEB",
              border: "2px solid #FDE68A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#D97706"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2
            style={{
              fontFamily: "'Playfair Display',serif",
              fontWeight: 900,
              fontSize: 26,
              color: "#1A1412",
              textAlign: "center",
              margin: 0,
            }}
          >
            Invite expired
          </h2>
          <Alert
            type="warning"
            message="Invite links are valid for 48 hours. Please ask the property owner to send you a new invitation."
          />
          <Button variant="secondary" fullWidth onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
      </AuthLayout>
    );
  }

  // ── Already accepted ─────────────────────────────────────────────────────
  if (tokenState === "accepted") {
    return (
      <AuthLayout
        heading={"Already\nAccepted"}
        subheading="This invitation has already been used."
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Alert
            type="info"
            message="This invite has already been accepted. Sign in with the account you created."
          />
          <Button
            variant="primary"
            fullWidth
            onClick={() => navigate("/login")}
          >
            Sign In
          </Button>
        </div>
      </AuthLayout>
    );
  }

  // ── Valid token ───────────────────────────────────────────────────────────
  return (
    <AuthLayout
      heading={"You've been\ninvited."}
      subheading={`Join ${invite?.tenants?.name ?? "a property"} as a manager.`}
      leftContent={<LeftContent tenantName={invite?.tenants?.name} />}
      leftBg="linear-gradient(160deg,#1A1412 0%,#2D1E16 50%,#3D2415 100%)"
    >
      <style>{`
        @keyframes slideIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
        .slide-in{animation:slideIn 0.3s ease both}
      `}</style>

      {/* ── Step 1: Review invitation ── */}
      {step === 1 && (
        <div
          className="slide-in"
          style={{ display: "flex", flexDirection: "column", gap: 20 }}
        >
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#C5612C",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 8,
              }}
            >
              Invitation
            </p>
            <h1
              style={{
                fontFamily: "'Playfair Display',serif",
                fontWeight: 900,
                fontSize: 28,
                color: "#1A1412",
                marginBottom: 6,
              }}
            >
              Join {invite?.tenants?.name}
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "#8B7355",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {invite?.invited_by_profile?.full_name ?? "Someone"} has invited
              you to manage{" "}
              <strong style={{ color: "#1A1412" }}>
                {invite?.tenants?.name}
              </strong>{" "}
              as a Property Manager.
            </p>
          </div>

          {/* Invite details */}
          <div
            style={{
              background: "#FAF7F2",
              border: "1px solid #EDE4D8",
              borderRadius: 14,
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {[
              ["Invited email", invite?.email],
              ["Property", invite?.tenants?.name],
              [
                "Invited by",
                invite?.invited_by_profile?.full_name ?? "Property Owner",
              ],
              ["Role", "Property Manager"],
            ].map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 12, color: "#8B7355" }}>{k}</span>
                <span
                  style={{ fontSize: 13, fontWeight: 600, color: "#1A1412" }}
                >
                  {v ?? "—"}
                </span>
              </div>
            ))}
          </div>

          {/* Permissions */}
          <div>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#1A1412",
                marginBottom: 10,
              }}
            >
              As a manager you can:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {MANAGER_PERMISSIONS.map((p, i) => (
                <div
                  key={i}
                  style={{ display: "flex", alignItems: "flex-start", gap: 8 }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    style={{ flexShrink: 0, marginTop: 2 }}
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span style={{ fontSize: 13, color: "#5C4A3A" }}>{p}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="secondary" onClick={() => navigate("/")}>
              Decline
            </Button>
            <Button variant="primary" fullWidth onClick={() => setStep(2)}>
              Accept & Set Up Account →
            </Button>
          </div>

          <p
            style={{
              fontSize: 11,
              color: "#8B7355",
              textAlign: "center",
              margin: 0,
            }}
          >
            By accepting you agree to fabrentals'{" "}
            <a
              href="#"
              style={{
                color: "#C5612C",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Terms of Service
            </a>
          </p>
        </div>
      )}

      {/* ── Step 2: Set password ── */}
      {step === 2 && (
        <div
          className="slide-in"
          style={{ display: "flex", flexDirection: "column", gap: 18 }}
        >
          <button
            onClick={() => setStep(1)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              color: "#8B7355",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              marginBottom: 4,
              transition: "color 0.15s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = "#C5612C")}
            onMouseOut={(e) => (e.currentTarget.style.color = "#8B7355")}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#C5612C",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 6,
              }}
            >
              Almost there
            </p>
            <h1
              style={{
                fontFamily: "'Playfair Display',serif",
                fontWeight: 900,
                fontSize: 28,
                color: "#1A1412",
                marginBottom: 6,
              }}
            >
              Set up your account
            </h1>
            <p style={{ fontSize: 14, color: "#8B7355", margin: 0 }}>
              You'll sign in as{" "}
              <strong style={{ color: "#1A1412" }}>{invite?.email}</strong>
            </p>
          </div>

          {apiError && <Alert type="error" message={apiError} />}

          <Input
            label="Full Name"
            required
            placeholder="e.g. Michael Kamau"
            value={form.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            error={errors.fullName}
          />

          <PasswordInput
            label="Password"
            required
            showStrength
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            error={errors.password}
          />

          <PasswordInput
            label="Confirm Password"
            required
            value={form.confirm}
            onChange={(e) => set("confirm", e.target.value)}
            error={errors.confirm}
          />

          <Button
            variant="primary"
            fullWidth
            loading={loading}
            onClick={handleAccept}
          >
            Create Account & Join →
          </Button>
        </div>
      )}

      {/* ── Step 3: Success ── */}
      {step === 3 && (
        <div
          className="slide-in"
          style={{
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "#ECFDF5",
              border: "2px solid #10B981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#10B981"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>

          <div>
            <h1
              style={{
                fontFamily: "'Playfair Display',serif",
                fontWeight: 900,
                fontSize: 28,
                color: "#1A1412",
                marginBottom: 8,
              }}
            >
              Welcome aboard!
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "#5C4A3A",
                lineHeight: 1.65,
                margin: 0,
              }}
            >
              Your manager account for <strong>{invite?.tenants?.name}</strong>{" "}
              is ready.
            </p>
          </div>

          {/* Summary */}
          <div
            style={{
              background: "#FAF7F2",
              border: "1px solid #EDE4D8",
              borderRadius: 14,
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              textAlign: "left",
            }}
          >
            {[
              ["Name", form.fullName],
              ["Email", invite?.email],
              ["Role", "Property Manager"],
              ["Property", invite?.tenants?.name],
            ].map(([k, v]) => (
              <div
                key={k}
                style={{ display: "flex", justifyContent: "space-between" }}
              >
                <span style={{ fontSize: 12, color: "#8B7355" }}>{k}</span>
                <span
                  style={{ fontSize: 13, fontWeight: 600, color: "#1A1412" }}
                >
                  {v ?? "—"}
                </span>
              </div>
            ))}
          </div>

          <Button
            variant="primary"
            fullWidth
            onClick={() => navigate("/manage", { replace: true })}
          >
            Go to Manager Dashboard →
          </Button>
        </div>
      )}
    </AuthLayout>
  );
}
