import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";

// ── Layout ────────────────────────────────────────────────────────────────────
import AuthLayout from "../../layouts/AuthLayout.jsx";

// ── Components ────────────────────────────────────────────────────────────────
import Input from "../../components/ui/Input.jsx";
import PasswordInput from "../../components/ui/PasswordInput.jsx";
import Button from "../../components/ui/Button.jsx";
import { Alert } from "../../components/ui/Alert.jsx";

// ── Store / hooks ─────────────────────────────────────────────────────────────
import useAuthStore from "../../store/authStore.js";
import { useToast } from "../../hooks/useNotifications.js";

// ── Validators ────────────────────────────────────────────────────────────────
import {
  validatePassword,
  validatePasswordMatch,
} from "../../lib/validators.js";

// =============================================================================
// ResetPasswordPage  /reset-password
//
// Four sequential steps — left panel artwork updates per step:
//   request — email input → send reset link
//   sent    — confirmation screen (email dispatched)
//   reset   — new password + confirm (Supabase ?type=recovery in URL)
//   success — password updated, go to sign in
//
// Supabase flow:
//   1. User enters email → sendPasswordReset(email) → Supabase sends email
//   2. User clicks link → lands on /reset-password?type=recovery&access_token=...
//   3. Page detects ?type=recovery → skips to "reset" step
//   4. User enters new password → updatePassword(newPassword)
// =============================================================================

// ── Left panel content varies per step ───────────────────────────────────────
const PANEL_META = {
  request: {
    heading: "Forgot your\npassword?",
    subheading:
      "No worries — enter your email and we'll send a secure reset link.",
    icon: (
      <svg
        width="36"
        height="36"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
  sent: {
    heading: "Check your\ninbox",
    subheading: "We've sent a secure reset link. It's valid for 60 minutes.",
    icon: (
      <svg
        width="36"
        height="36"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.09 8.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z" />
      </svg>
    ),
  },
  reset: {
    heading: "Create a new\npassword",
    subheading:
      "Make it strong. You won't need to change it again for a while.",
    icon: (
      <svg
        width="36"
        height="36"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    ),
  },
  success: {
    heading: "All done!\nYou're in.",
    subheading: "Your password has been updated. Head back and sign in.",
    icon: (
      <svg
        width="36"
        height="36"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
};

// Step progress dots shown on left panel
const STEPS_ORDER = ["request", "sent", "reset", "success"];

function LeftContent({ step }) {
  const meta = PANEL_META[step] ?? PANEL_META.request;
  return (
    <>
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "rgba(255,255,255,0.5)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: 24,
        }}
      >
        fabrentals
      </p>

      {/* Icon with pulse rings */}
      <div
        style={{
          position: "relative",
          width: 120,
          height: 120,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 28,
        }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: i * 40,
              height: i * 40,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.15)",
              animation: `pulseRing ${1.5 + i * 0.4}s ${i * 0.2}s ease-out infinite`,
            }}
          />
        ))}
        <div
          style={{
            position: "relative",
            width: 80,
            height: 80,
            borderRadius: 20,
            background: "rgba(255,255,255,0.18)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {meta.icon}
        </div>
      </div>

      <h2
        style={{
          fontFamily: "'Playfair Display',serif",
          fontWeight: 900,
          fontSize: "clamp(28px,3.5vw,44px)",
          color: "#fff",
          lineHeight: 1.1,
          marginBottom: 16,
          whiteSpace: "pre-line",
        }}
      >
        {meta.heading}
      </h2>
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
        {meta.subheading}
      </p>

      {/* Step progress dots */}
      <div style={{ display: "flex", gap: 8 }}>
        {STEPS_ORDER.map((s) => (
          <div
            key={s}
            style={{
              height: 6,
              borderRadius: 999,
              width: s === step ? 24 : 8,
              background: s === step ? "#fff" : "rgba(255,255,255,0.25)",
              transition: "all 0.3s ease",
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes pulseRing{0%{transform:scale(0.88);opacity:0.6}70%{transform:scale(1.18);opacity:0}100%{transform:scale(1.18);opacity:0}}
      `}</style>
    </>
  );
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sendReset = useAuthStore((s) => s.sendPasswordReset);
  const updatePassword = useAuthStore((s) => s.updatePassword);
  const toast = useToast();

  // If Supabase redirects with ?type=recovery, skip to the reset step
  const hasRecoveryToken = searchParams.get("type") === "recovery";

  const [step, setStep] = useState(hasRecoveryToken ? "reset" : "request");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwError, setPwError] = useState(null);
  const [confirmError, setConfirmError] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);

  // ── Send reset link ──────────────────────────────────────────────────────
  const handleSendReset = async () => {
    setEmailError(null);
    setApiError(null);
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await sendReset(email.trim().toLowerCase());
      if (error) throw new Error(error.message);
      setStep("sent");
    } catch (e) {
      // Always show success to prevent email enumeration
      setStep("sent");
    } finally {
      setLoading(false);
    }
  };

  // ── Set new password ─────────────────────────────────────────────────────
  const handleSetPassword = async () => {
    setPwError(null);
    setConfirmError(null);
    setApiError(null);

    const pwV = validatePassword(password);
    if (!pwV.valid || pwV.strength < 2) {
      setPwError(
        "Choose a stronger password — at least 8 characters with a number or symbol.",
      );
      return;
    }
    const matchV = validatePasswordMatch(password, confirm);
    if (!matchV.valid) {
      setConfirmError(matchV.message);
      return;
    }

    setLoading(true);
    try {
      const { error } = await updatePassword(password);
      if (error) throw new Error(error.message);
      setStep("success");
      toast.success("Password updated successfully!");
    } catch (e) {
      setApiError(
        e.message ?? "Failed to update password. The link may have expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Password requirement pills
  const requirements = [
    { label: "8+ characters", met: password.length >= 8 },
    { label: "Uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Number", met: /[0-9]/.test(password) },
    { label: "Symbol", met: /[^A-Za-z0-9]/.test(password) },
  ];

  const meta = PANEL_META[step] ?? PANEL_META.request;

  return (
    <AuthLayout
      heading={meta.heading}
      subheading={meta.subheading}
      leftContent={<LeftContent step={step} />}
      leftBg="linear-gradient(160deg,#C5612C 0%,#8B3A18 55%,#5C2410 100%)"
    >
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fadeUp 0.35s ease both}
      `}</style>

      {/* ── Step: request ── */}
      {step === "request" && (
        <div className="fu">
          <h1
            style={{
              fontFamily: "'Playfair Display',serif",
              fontWeight: 900,
              fontSize: 28,
              color: "#1A1412",
              marginBottom: 8,
            }}
          >
            Reset your password
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#8B7355",
              marginBottom: 28,
              lineHeight: 1.6,
            }}
          >
            Enter the email address linked to your account. We'll send you a
            link.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Input
              label="Email Address"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError(null);
              }}
              error={emailError}
              onKeyDown={(e) => e.key === "Enter" && handleSendReset()}
            />

            {apiError && <Alert type="error" message={apiError} />}

            <Button
              variant="primary"
              fullWidth
              loading={loading}
              onClick={handleSendReset}
            >
              Send Reset Link
            </Button>

            <Button
              variant="ghost"
              fullWidth
              onClick={() => navigate("/login")}
              style={{ marginTop: -4 }}
            >
              ← Back to sign in
            </Button>
          </div>

          {/* Dev shortcut */}
          {import.meta.env.DEV && (
            <div
              style={{
                marginTop: 24,
                paddingTop: 20,
                borderTop: "1.5px dashed #EDE4D8",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: 11, color: "#8B7355", marginBottom: 8 }}>
                Dev shortcut
              </p>
              <button
                onClick={() => setStep("reset")}
                style={{
                  fontSize: 12,
                  color: "#C5612C",
                  fontWeight: 600,
                  background: "none",
                  border: "1px dashed rgba(197,97,44,0.4)",
                  borderRadius: 8,
                  padding: "8px 16px",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "#FFF5EF")
                }
                onMouseOut={(e) => (e.currentTarget.style.background = "none")}
              >
                Simulate clicking reset link →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Step: sent ── */}
      {step === "sent" && (
        <div
          className="fu"
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
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>

          <div>
            <h2
              style={{
                fontFamily: "'Playfair Display',serif",
                fontWeight: 900,
                fontSize: 26,
                color: "#1A1412",
                marginBottom: 10,
              }}
            >
              Check your inbox
            </h2>
            <p
              style={{
                fontSize: 14,
                color: "#5C4A3A",
                lineHeight: 1.65,
                margin: 0,
              }}
            >
              We've sent a reset link to{" "}
              <strong>{email || "your email"}</strong>.<br />
              It expires in 60 minutes.
            </p>
          </div>

          <Alert
            type="info"
            compact
            message="Check your spam folder if you don't see it within a few minutes."
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                setStep("request");
                setEmail("");
              }}
            >
              Try a different email
            </Button>
            <Button
              variant="ghost"
              fullWidth
              onClick={() => navigate("/login")}
            >
              Back to sign in
            </Button>
          </div>
        </div>
      )}

      {/* ── Step: reset ── */}
      {step === "reset" && (
        <div className="fu">
          <div style={{ marginBottom: 24 }}>
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
              New Password
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
              Create a new password
            </h1>
            <p style={{ fontSize: 14, color: "#8B7355", margin: 0 }}>
              Choose something strong that you'll remember.
            </p>
          </div>

          {apiError && (
            <Alert
              type="error"
              message={apiError}
              style={{ marginBottom: 18 }}
            />
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <PasswordInput
              label="New Password"
              required
              showStrength
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPwError(null);
              }}
              error={pwError}
            />

            {/* Requirement pills */}
            {password && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                {requirements.map((r) => (
                  <div
                    key={r.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      padding: "7px 10px",
                      borderRadius: 10,
                      fontSize: 12,
                      background: r.met ? "#ECFDF5" : "#F5EDE0",
                      color: r.met ? "#059669" : "#8B7355",
                      transition: "all 0.2s",
                    }}
                  >
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: r.met ? "#10B981" : "#E8DDD4",
                      }}
                    >
                      {r.met && (
                        <svg
                          width="8"
                          height="8"
                          viewBox="0 0 12 12"
                          fill="none"
                        >
                          <path
                            d="M2 6l3 3 5-5"
                            stroke="#fff"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    {r.label}
                  </div>
                ))}
              </div>
            )}

            <PasswordInput
              label="Confirm Password"
              required
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setConfirmError(null);
              }}
              error={confirmError}
              onKeyDown={(e) =>
                e.key === "Enter" && !loading && handleSetPassword()
              }
            />

            <Button
              variant="primary"
              fullWidth
              loading={loading}
              onClick={handleSetPassword}
            >
              Update Password →
            </Button>
          </div>
        </div>
      )}

      {/* ── Step: success ── */}
      {step === "success" && (
        <div
          className="fu"
          style={{ display: "flex", flexDirection: "column", gap: 20 }}
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
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>

          <div style={{ textAlign: "center" }}>
            <h1
              style={{
                fontFamily: "'Playfair Display',serif",
                fontWeight: 900,
                fontSize: 28,
                color: "#1A1412",
                marginBottom: 10,
              }}
            >
              Password updated!
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "#5C4A3A",
                lineHeight: 1.65,
                margin: 0,
              }}
            >
              Your password has been successfully reset. You can now sign in
              with your new password.
            </p>
          </div>

          {/* Security tip */}
          <Alert
            type="success"
            title="Security tip"
            message="All active sessions have been signed out. Use your new password to sign back in."
          />

          <Button
            variant="primary"
            fullWidth
            onClick={() => navigate("/login", { replace: true })}
          >
            Sign In Now →
          </Button>

          <p
            style={{
              fontSize: 12,
              color: "#8B7355",
              textAlign: "center",
              margin: 0,
            }}
          >
            Having trouble?{" "}
            <a
              href="mailto:support@fabrentals.co.ke"
              style={{
                color: "#C5612C",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Contact support
            </a>
          </p>
        </div>
      )}
    </AuthLayout>
  );
}
