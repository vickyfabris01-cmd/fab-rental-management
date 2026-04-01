import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import useAuthStore from "../../store/authStore.js";
import { supabase } from "../../config/supabase.js";

// =============================================================================
// SignupPage  /signup
//
// Two-step form:
//   Step 1 — Email + Password (with strength meter) + Confirm Password
//   Step 2 — Full name + Phone + Terms agreement
//
// Auth flow:
//   handleSubmit → authStore.signUp({ email, password, fullName, phone })
//   → supabase.auth.signUp()
//   → trg_new_user trigger creates profiles row with role = 'visitor'
//   → user is redirected to /browse
// =============================================================================

function EyeIcon({ open }) {
  return open ? (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" style={{ flexShrink: 0 }}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, error, helper, required, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <label style={{ fontSize: 13, fontWeight: 600, color: "#1A1412" }}>
          {label}
          {required && (
            <span style={{ color: "#DC2626", marginLeft: 3 }}>*</span>
          )}
        </label>
      )}
      {children}
      {error && (
        <span
          style={{
            fontSize: 12,
            color: "#DC2626",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#DC2626">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          {error}
        </span>
      )}
      {!error && helper && (
        <span style={{ fontSize: 12, color: "#8B7355" }}>{helper}</span>
      )}
    </div>
  );
}

// ── Text input ────────────────────────────────────────────────────────────────
function TInput({
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
  rightSlot,
  id,
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          padding: rightSlot ? "12px 44px 12px 14px" : "12px 14px",
          border: `1.5px solid ${error ? "#DC2626" : focused ? "#C5612C" : "#E8DDD4"}`,
          borderRadius: 10,
          fontSize: 14,
          color: "#1A1412",
          background: "#fff",
          outline: "none",
          boxSizing: "border-box",
          boxShadow: focused
            ? `0 0 0 3px ${error ? "rgba(220,38,38,0.10)" : "rgba(197,97,44,0.12)"}`
            : "none",
          transition: "border-color 0.18s, box-shadow 0.18s",
        }}
      />
      {rightSlot && (
        <div
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
          }}
        >
          {rightSlot}
        </div>
      )}
    </div>
  );
}

// ── Password with strength meter ──────────────────────────────────────────────
function PwField({
  label,
  value,
  onChange,
  error,
  autoComplete,
  showStrength,
  required,
}) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);

  const strength =
    showStrength && value
      ? (() => {
          let s = 0;
          if (value.length >= 8) s++;
          if (/[A-Z]/.test(value)) s++;
          if (/[0-9]/.test(value)) s++;
          if (/[^A-Za-z0-9]/.test(value)) s++;
          return s;
        })()
      : 0;

  const SC = ["#E8DDD4", "#EF4444", "#F59E0B", "#3B82F6", "#10B981"][strength];
  const SL = ["", "Weak", "Fair", "Good", "Strong"][strength];

  return (
    <Field label={label} error={error} required={required}>
      <div style={{ position: "relative" }}>
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder="••••••••"
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            padding: "12px 44px 12px 14px",
            border: `1.5px solid ${error ? "#DC2626" : focused ? "#C5612C" : "#E8DDD4"}`,
            borderRadius: 10,
            fontSize: 14,
            color: "#1A1412",
            background: "#fff",
            outline: "none",
            boxSizing: "border-box",
            boxShadow: focused
              ? `0 0 0 3px ${error ? "rgba(220,38,38,0.10)" : "rgba(197,97,44,0.12)"}`
              : "none",
            transition: "border-color 0.18s, box-shadow 0.18s",
          }}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#8B7355",
            display: "flex",
            alignItems: "center",
            padding: 0,
          }}
        >
          <EyeIcon open={visible} />
        </button>
      </div>
      {showStrength && value && (
        <div>
          <div style={{ display: "flex", gap: 4, marginBottom: 5 }}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 3,
                  borderRadius: 999,
                  background: strength >= i ? SC : "#E8DDD4",
                  transition: "background 0.3s",
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: "#8B7355" }}>
              Password strength
            </span>
            {strength > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, color: SC }}>
                {SL}
              </span>
            )}
          </div>
        </div>
      )}
    </Field>
  );
}

// ── Phone input ───────────────────────────────────────────────────────────────
function PhoneField({ value, onChange, error }) {
  const [focused, setFocused] = useState(false);
  return (
    <Field
      label="Phone Number"
      error={error}
      helper="Used for M-Pesa payment notifications"
    >
      <div
        style={{
          display: "flex",
          border: `1.5px solid ${error ? "#DC2626" : focused ? "#C5612C" : "#E8DDD4"}`,
          borderRadius: 10,
          overflow: "hidden",
          background: "#fff",
          transition: "border-color 0.18s",
          boxShadow: focused
            ? `0 0 0 3px ${error ? "rgba(220,38,38,0.10)" : "rgba(197,97,44,0.12)"}`
            : "none",
        }}
      >
        <div
          style={{
            padding: "12px 12px",
            background: "#FAF7F2",
            borderRight: "1px solid #E8DDD4",
            fontSize: 13,
            fontWeight: 600,
            color: "#5C4A3A",
            whiteSpace: "nowrap",
            userSelect: "none",
          }}
        >
          🇰🇪 +254
        </div>
        <input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="7XX XXX XXX"
          autoComplete="tel"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            padding: "12px 14px",
            border: "none",
            outline: "none",
            fontSize: 14,
            color: "#1A1412",
            background: "transparent",
          }}
        />
      </div>
    </Field>
  );
}

// ── Step indicator ────────────────────────────────────────────────────────────
function Steps({ step }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 0,
        marginBottom: 28,
      }}
    >
      {[
        { n: 1, label: "Credentials" },
        { n: 2, label: "Your Info" },
      ].map((s, i) => (
        <div key={s.n} style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: s.n <= step ? "#C5612C" : "#E8DDD4",
                color: s.n <= step ? "#fff" : "#8B7355",
                fontSize: 12,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.25s",
                boxShadow:
                  s.n === step ? "0 2px 10px rgba(197,97,44,0.35)" : "none",
              }}
            >
              {s.n < step ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 6l3 3 5-5"
                    stroke="#fff"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                s.n
              )}
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: s.n === step ? 700 : 400,
                color: s.n <= step ? "#C5612C" : "#8B7355",
                transition: "color 0.25s",
              }}
            >
              {s.label}
            </span>
          </div>
          {i < 1 && (
            <div
              style={{
                width: 32,
                height: 2,
                background: step > 1 ? "#C5612C" : "#E8DDD4",
                margin: "0 8px",
                borderRadius: 999,
                transition: "background 0.3s",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Primary button ────────────────────────────────────────────────────────────
function PBtn({
  children,
  onClick,
  type = "button",
  loading,
  fullWidth,
  variant = "primary",
}) {
  const [hov, setHov] = useState(false);
  const isPrimary = variant === "primary";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      onMouseOver={() => setHov(true)}
      onMouseOut={() => setHov(false)}
      style={{
        width: fullWidth ? "100%" : "auto",
        padding: "13px 20px",
        borderRadius: 10,
        border: isPrimary ? "none" : "1.5px solid #E8DDD4",
        cursor: loading ? "wait" : "pointer",
        background: isPrimary
          ? hov
            ? "#A84E22"
            : "#C5612C"
          : hov
            ? "#F5EDE0"
            : "#fff",
        color: isPrimary ? "#fff" : "#5C4A3A",
        fontSize: 14,
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        transition: "background 0.18s",
        opacity: loading ? 0.75 : 1,
      }}
    >
      {loading && (
        <div
          style={{
            width: 16,
            height: 16,
            border: "2px solid rgba(255,255,255,0.35)",
            borderTopColor: "#fff",
            borderRadius: "50%",
            animation: "sspin 0.7s linear infinite",
          }}
        />
      )}
      {children}
    </button>
  );
}

// =============================================================================
export default function SignupPage() {
  const navigate = useNavigate();
  const signUp = useAuthStore((s) => s.signUp);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirm: "",
    full_name: "",
    phone: "",
    agree: false,
  });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // ── Step 1 validation ─────────────────────────────────────────────────────
  const validateStep1 = () => {
    const e = {};
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email.";
    if (!form.password) e.password = "Password is required.";
    else if (form.password.length < 8)
      e.password = "Password must be at least 8 characters.";
    if (!form.confirm) e.confirm = "Please confirm your password.";
    else if (form.confirm !== form.password)
      e.confirm = "Passwords do not match.";
    return e;
  };

  // ── Step 2 validation ─────────────────────────────────────────────────────
  const validateStep2 = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = "Full name is required.";
    if (!form.agree) e.agree = "You must agree to the terms to continue.";
    return e;
  };

  const handleNext = () => {
    setApiError(null);
    const e = validateStep1();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setErrors({});
    setStep(2);
  };

  const handleSubmit = async () => {
    setApiError(null);
    const e = validateStep2();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setErrors({});
    setLoading(true);
    const { error } = await signUp({
      email: form.email.trim().toLowerCase(),
      password: form.password,
      fullName: form.full_name.trim(),
      phone: form.phone
        ? `+254${form.phone.replace(/\D/g, "").replace(/^0/, "")}`
        : undefined,
    });
    setLoading(false);
    if (error) {
      if (
        error.toLowerCase().includes("already registered") ||
        error.toLowerCase().includes("already exists")
      ) {
        setApiError("An account with this email already exists.");
      } else {
        setApiError(error);
      }
      return;
    }
    navigate("/browse", { replace: true });
  };

  const handleGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });

  const FEATURES = [
    "Browse & apply for rooms online",
    "Pay rent via M-Pesa instantly",
    "Track invoices & payment history",
    "Submit complaints & get fast responses",
    "Multi-property management for owners",
  ];

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        fontFamily: "'DM Sans',system-ui,sans-serif",
        background: "#FAF7F2",
      }}
    >
      <style>{`
        @keyframes sspin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .sp-left{display:none}
        @media(min-width:900px){.sp-left{display:flex!important}}
        .sp-mob-logo{display:flex}
        @media(min-width:900px){.sp-mob-logo{display:none}}
      `}</style>

      {/* ── Left panel ── */}
      <div
        className="sp-left"
        style={{
          flex: "0 0 44%",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px 52px",
          position: "relative",
          overflow: "hidden",
          background:
            "linear-gradient(160deg,#1A1412 0%,#2D1E16 55%,#3D2415 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 280,
            height: 280,
            borderRadius: "50%",
            background: "rgba(197,97,44,0.08)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            left: -40,
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: "rgba(197,97,44,0.05)",
            pointerEvents: "none",
          }}
        />

        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 56,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "rgba(197,97,44,0.25)",
                border: "1px solid rgba(197,97,44,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg viewBox="0 0 24 24" fill="#C5612C" width="20" height="20">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
              </svg>
            </div>
            <span
              style={{
                fontFamily: "'Playfair Display',serif",
                fontWeight: 900,
                fontSize: 18,
                color: "#fff",
                letterSpacing: "-0.02em",
              }}
            >
              fabRentals
            </span>
          </div>

          <h1
            style={{
              fontFamily: "'Playfair Display',serif",
              fontWeight: 900,
              fontSize: "clamp(34px,3.5vw,52px)",
              color: "#fff",
              lineHeight: 1.08,
              marginBottom: 16,
              letterSpacing: "-0.02em",
            }}
          >
            Your Next
            <br />
            Home Starts
            <br />
            <span style={{ color: "#C5612C" }}>Here.</span>
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.52)",
              lineHeight: 1.75,
              marginBottom: 36,
              maxWidth: 320,
            }}
          >
            Join thousands of Kenyans managing their rentals, paying bills, and
            staying connected — all in one place.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            {FEATURES.map((f, i) => (
              <div
                key={i}
                style={{ display: "flex", alignItems: "center", gap: 12 }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "rgba(197,97,44,0.2)",
                    border: "1px solid rgba(197,97,44,0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="#C5612C"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.68)",
                    lineHeight: 1.4,
                  }}
                >
                  {f}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
          © {new Date().getFullYear()} fabRentals · Kenya
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            animation: "fadeUp 0.4s ease both",
          }}
        >
          {/* Back link */}
          <Link
            to="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              color: "#8B7355",
              textDecoration: "none",
              marginBottom: 24,
              fontWeight: 500,
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to home
          </Link>

          {/* Mobile logo */}
          <div
            className="sp-mob-logo"
            style={{ alignItems: "center", gap: 8, marginBottom: 28 }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "linear-gradient(135deg,#C5612C,#8B3A18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg viewBox="0 0 24 24" fill="white" width="16" height="16">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
              </svg>
            </div>
            <span
              style={{
                fontFamily: "'Playfair Display',serif",
                fontWeight: 700,
                fontSize: 15,
                color: "#1A1412",
              }}
            >
              fabRentals
            </span>
          </div>

          <h1
            style={{
              fontFamily: "'Playfair Display',serif",
              fontWeight: 900,
              fontSize: 30,
              color: "#1A1412",
              marginBottom: 6,
              letterSpacing: "-0.02em",
            }}
          >
            Create Account
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#8B7355",
              marginBottom: 24,
              lineHeight: 1.5,
            }}
          >
            {step === 1
              ? "Set up your login credentials."
              : "Tell us a little about yourself."}
          </p>

          <Steps step={step} />

          {/* Error banner */}
          {apiError && (
            <div
              style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: 10,
                padding: "12px 14px",
                marginBottom: 20,
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="#DC2626"
                style={{ flexShrink: 0, marginTop: 1 }}
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, color: "#991B1B", margin: 0 }}>
                  {apiError}
                </p>
                {apiError.includes("already exists") && (
                  <Link
                    to="/login"
                    style={{
                      fontSize: 13,
                      color: "#C5612C",
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    Sign in instead →
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 1: Credentials ── */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <Field label="Email Address" error={errors.email} required>
                <TInput
                  id="su-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => {
                    set("email", e.target.value);
                    setErrors((p) => ({ ...p, email: null }));
                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  error={errors.email}
                />
              </Field>

              <PwField
                label="Password"
                value={form.password}
                onChange={(e) => {
                  set("password", e.target.value);
                  setErrors((p) => ({ ...p, password: null }));
                }}
                error={errors.password}
                autoComplete="new-password"
                showStrength
                required
              />

              <PwField
                label="Confirm Password"
                value={form.confirm}
                onChange={(e) => {
                  set("confirm", e.target.value);
                  setErrors((p) => ({ ...p, confirm: null }));
                }}
                error={errors.confirm}
                autoComplete="new-password"
                required
              />

              <PBtn fullWidth onClick={handleNext}>
                Continue →
              </PBtn>

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, height: 1, background: "#E8DDD4" }} />
                <span
                  style={{
                    fontSize: 12,
                    color: "#8B7355",
                    whiteSpace: "nowrap",
                  }}
                >
                  or sign up with
                </span>
                <div style={{ flex: 1, height: 1, background: "#E8DDD4" }} />
              </div>

              {/* Google */}
              <button
                onClick={handleGoogle}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  width: "100%",
                  padding: "12px 20px",
                  borderRadius: 10,
                  border: "1.5px solid #E8DDD4",
                  background: "#fff",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#1A1412",
                  cursor: "pointer",
                  transition: "border-color 0.18s,box-shadow 0.18s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = "#C5612C";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(197,97,44,0.10)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = "#E8DDD4";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <GoogleIcon />
                Continue with Google
              </button>
            </div>
          )}

          {/* ── STEP 2: Personal Info ── */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <Field label="Full Name" error={errors.full_name} required>
                <TInput
                  id="su-name"
                  value={form.full_name}
                  onChange={(e) => {
                    set("full_name", e.target.value);
                    setErrors((p) => ({ ...p, full_name: null }));
                  }}
                  placeholder="e.g. Jane Wanjiku"
                  autoComplete="name"
                  error={errors.full_name}
                />
              </Field>

              <PhoneField
                value={form.phone}
                onChange={(v) => {
                  set("phone", v);
                  setErrors((p) => ({ ...p, phone: null }));
                }}
                error={errors.phone}
              />

              {/* Info box */}
              <div
                style={{
                  background: "#FFF5EF",
                  border: "1px solid rgba(197,97,44,0.22)",
                  borderRadius: 12,
                  padding: "14px 16px",
                  display: "flex",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "rgba(197,97,44,0.12)",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="#C5612C"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#C5612C",
                      margin: "0 0 3px",
                    }}
                  >
                    Visitor Account
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: "#5C4A3A",
                      margin: 0,
                      lineHeight: 1.6,
                    }}
                  >
                    You'll start as a visitor and can browse freely. Once a
                    manager approves your rental request, your account upgrades
                    to a resident automatically.
                  </p>
                </div>
              </div>

              {/* Terms */}
              <div
                style={{ display: "flex", alignItems: "flex-start", gap: 10 }}
              >
                <input
                  type="checkbox"
                  id="su-agree"
                  checked={form.agree}
                  onChange={(e) => {
                    set("agree", e.target.checked);
                    setErrors((p) => ({ ...p, agree: null }));
                  }}
                  style={{
                    marginTop: 2,
                    width: 16,
                    height: 16,
                    accentColor: "#C5612C",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                />
                <label
                  htmlFor="su-agree"
                  style={{
                    fontSize: 13,
                    color: "#5C4A3A",
                    lineHeight: 1.6,
                    cursor: "pointer",
                  }}
                >
                  I agree to the{" "}
                  <a
                    href="#"
                    style={{
                      color: "#C5612C",
                      fontWeight: 600,
                      textDecoration: "underline",
                    }}
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="#"
                    style={{
                      color: "#C5612C",
                      fontWeight: 600,
                      textDecoration: "underline",
                    }}
                  >
                    Privacy Policy
                  </a>
                </label>
              </div>
              {errors.agree && (
                <span
                  style={{ fontSize: 12, color: "#DC2626", marginTop: -10 }}
                >
                  {errors.agree}
                </span>
              )}

              {/* Buttons */}
              <div style={{ display: "flex", gap: 10 }}>
                <PBtn
                  variant="secondary"
                  onClick={() => {
                    setStep(1);
                    setApiError(null);
                  }}
                >
                  ← Back
                </PBtn>
                <PBtn fullWidth loading={loading} onClick={handleSubmit}>
                  {loading ? "Creating account…" : "Create Account"}
                </PBtn>
              </div>
            </div>
          )}

          <p
            style={{
              textAlign: "center",
              fontSize: 13,
              color: "#8B7355",
              marginTop: 28,
            }}
          >
            Already have an account?{" "}
            <Link
              to="/login"
              style={{
                color: "#C5612C",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
