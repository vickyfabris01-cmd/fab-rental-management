// src/pages/account/AccountPage.jsx — NEW FILE
//
// AIM
// My account: name and phone number (the phone is what allows phone + password sign-in),
// read-only email, change password, theme, sign out.

import "./Account.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Card, CardBody, CardHeader, Input, PasswordInput, PhoneInput, ThemeToggle } from "../../components/ui";
import { useToast } from "../../hooks/useNotifications.js";
import { useSession } from "../../store/sessionStore.js";
import { useBusinessStore } from "../../store/businessStore.js";
import { cleanKenyanPhone } from "../../components/ui/PhoneInput.jsx";
import { collect, password as vPassword, phone as vPhone, required } from "../../lib/validate.js";

export default function AccountPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const profile = useSession((s) => s.profile);
  const user = useSession((s) => s.user);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwErrors, setPwErrors] = useState({});
  const [pwBusy, setPwBusy] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (profile) { setName(profile.full_name || ""); setPhone(cleanKenyanPhone(profile.phone || "")); }
  }, [profile]);

  const google = user?.app_metadata?.provider === "google";

  async function saveProfile(e) {
    e.preventDefault();
    const errs = collect({ name: required(name, "Your name"), phone: phone ? vPhone(phone) : "" });
    setErrors(errs); setFormError("");
    if (Object.keys(errs).length) return;
    setSaving(true);
    const { error } = await useSession.getState().updateProfile({ full_name: name, phone: phone || "" });
    setSaving(false);
    if (error) return setFormError(error);
    toast.success("Your details were saved.");
  }

  async function changePassword(e) {
    e.preventDefault();
    const errs = collect({ pw: vPassword(pw), pw2: pw === pw2 ? "" : "The two passwords do not match." });
    setPwErrors(errs);
    if (Object.keys(errs).length) return;
    setPwBusy(true);
    const { error } = await useSession.getState().updatePassword(pw);
    setPwBusy(false);
    if (error) return setPwErrors({ pw: error });
    setPw(""); setPw2("");
    toast.success("Password changed.");
  }

  async function signOut() {
    await useSession.getState().signOut();
    useBusinessStore.getState().reset();
    navigate("/", { replace: true });
  }

  return (
    <div className="pg pg--narrow">
      <h1 className="pg__title">My account</h1>
      <div className="acct__stack">
        <Card>
          <CardHeader title="Your details" />
          <CardBody>
            <form className="acct__form" onSubmit={saveProfile} noValidate>
              {formError && <Alert type="error" message={formError} />}
              <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} autoComplete="name" />
              <Input label="Email" value={profile?.email || user?.email || ""} disabled helper="Your email is used to sign in and cannot be changed here." />
              <PhoneInput label="Phone number" value={phone} onChange={setPhone} error={errors.phone}
                helper="Sign in with this number and your password." />
              <div><Button type="submit" loading={saving}>Save changes</Button></div>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={google ? "Password (optional)" : "Change password"} />
          <CardBody>
            <form className="acct__form" onSubmit={changePassword} noValidate>
              {google && <Alert type="info" message="You signed in with Google. Set a password if you also want to sign in with your email or phone number." />}
              <PasswordInput label="New password" autoComplete="new-password" showStrength value={pw} onChange={(e) => setPw(e.target.value)} error={pwErrors.pw} />
              <PasswordInput label="Confirm new password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} error={pwErrors.pw2} />
              <div><Button type="submit" variant="outline" loading={pwBusy}>Change password</Button></div>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Appearance" subtitle="Choose light, dark or follow your device." action={<ThemeToggle />} />
        </Card>

        <div><Button variant="outline" onClick={signOut}>Sign out</Button></div>
      </div>
    </div>
  );
}
