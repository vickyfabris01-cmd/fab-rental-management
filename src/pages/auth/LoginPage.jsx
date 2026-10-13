// src/pages/auth/LoginPage.jsx — NEW FILE
//
// AIM
// Sign in with email OR phone number plus password, or with Google. The first box accepts
// either: text with an "@" is an email, digits are a phone number (the resolve-login function
// finds the account). After signing in the person goes to ?next=… or, by default, to
// My businesses (super admins go to the admin dashboard).

import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Alert, Button, Input, PasswordInput } from "../../components/ui";
import GoogleButton from "../../components/auth/GoogleButton.jsx";
import AuthLayout from "../../layouts/AuthLayout.jsx";
import { useSession } from "../../store/sessionStore.js";
import { looksLikePhone } from "../../lib/phone.js";
import { required } from "../../lib/validate.js";
import "../../layouts/AuthLayout.css";

export function safeNext(value, fallback) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

export default function LoginPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const user = useSession((s) => s.user);
  const profile = useSession((s) => s.profile);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const next = params.get("next");

  if (user && profile) {
    return <Navigate to={safeNext(next, profile.role === "super_admin" ? "/admin" : "/businesses")} replace />;
  }

  async function submit(e) {
    e.preventDefault();
    const errs = {
      identifier: required(identifier, "Email or phone number"),
      password: required(password, "Password"),
    };
    Object.keys(errs).forEach((k) => !errs[k] && delete errs[k]);
    setErrors(errs);
    setFormError("");
    if (Object.keys(errs).length) return;
    setBusy(true);
    const { error } = await useSession.getState().signInWithPassword(identifier, password);
    setBusy(false);
    if (error) return setFormError(error);
    const p = await useSession.getState().refreshProfile();
    navigate(safeNext(next, p?.role === "super_admin" ? "/admin" : "/businesses"), { replace: true });
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in with your email or phone number."
      footer={<span>New here? <Link to={`/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`}>Create an account</Link></span>}
    >
      {formError && <Alert type="error" message={formError} />}
      <form className="auth__form" onSubmit={submit} noValidate>
        <Input label="Email or phone number" autoComplete="username" inputMode={looksLikePhone(identifier) ? "tel" : "email"}
          placeholder="Email or 0712 345 678" value={identifier} onChange={(e) => setIdentifier(e.target.value)} error={errors.identifier} />
        <PasswordInput label="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
        <div className="auth__row"><span /><Link className="auth__link" to="/forgot-password">Forgot password?</Link></div>
        <Button type="submit" size="lg" fullWidth loading={busy}>Sign in</Button>
      </form>
      <div className="auth__or">or</div>
      <GoogleButton next={safeNext(next, "/businesses")} />
    </AuthLayout>
  );
}
