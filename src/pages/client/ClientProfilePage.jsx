import { useState, useRef } from "react";

import DashboardLayout  from "../../layouts/DashboardLayout.jsx";
import PageHeader       from "../../components/layout/PageHeader.jsx";
import Input            from "../../components/ui/Input.jsx";
import PhoneInput       from "../../components/ui/PhoneInput.jsx";
import PasswordInput    from "../../components/ui/PasswordInput.jsx";
import Button           from "../../components/ui/Button.jsx";
import Avatar           from "../../components/ui/Avatar.jsx";
import { Alert }        from "../../components/ui/Alert.jsx";
import { Divider }      from "../../components/ui/Spinner.jsx";
import Badge            from "../../components/ui/Badge.jsx";

import useAuthStore     from "../../store/authStore.js";
import { updateProfile, updateAvatar } from "../../lib/api/profile.js";
import { updatePassword }              from "../../lib/api/auth.js";
import { useToast }     from "../../hooks/useNotifications.js";
import { validatePassword, validatePasswordMatch } from "../../lib/validators.js";
import { formatDate }   from "../../lib/formatters.js";

// =============================================================================
// ClientProfilePage   /dashboard/profile
// =============================================================================

export default function ClientProfilePage() {
  const profile       = useAuthStore(s => s.profile);
  const user          = useAuthStore(s => s.user);
  const refreshProfile= useAuthStore(s => s.refreshProfile);
  const toast         = useToast();
  const avatarInput   = useRef(null);

  // ── Profile form ──────────────────────────────────────────────────────────
  const [fullName,    setFullName]    = useState(profile?.full_name ?? "");
  const [phone,       setPhone]       = useState(profile?.phone ?? "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError,  setProfileError]  = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // ── Password form ─────────────────────────────────────────────────────────
  const [currentPw,  setCurrentPw]  = useState("");
  const [newPw,      setNewPw]      = useState("");
  const [confirmPw,  setConfirmPw]  = useState("");
  const [pwErrors,   setPwErrors]   = useState({});
  const [pwSaving,   setPwSaving]   = useState(false);

  const handleSaveProfile = async () => {
    setProfileError(null);
    if (!fullName.trim()) { setProfileError("Full name is required."); return; }
    setProfileSaving(true);
    try {
      const { error } = await updateProfile(profile.id, { full_name: fullName.trim(), phone: phone || null });
      if (error) throw new Error(error.message);
      await refreshProfile();
      toast.success("Profile updated successfully.");
    } catch (e) {
      setProfileError(e.message ?? "Failed to save profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file."); return; }
    if (file.size > 3 * 1024 * 1024)    { toast.error("Image must be under 3 MB.");     return; }
    setAvatarUploading(true);
    try {
      const { error } = await updateAvatar(profile.id, file);
      if (error) throw new Error(error.message);
      await refreshProfile();
      toast.success("Profile photo updated.");
    } catch (e) {
      toast.error(e.message ?? "Failed to upload photo.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleChangePassword = async () => {
    const e = {};
    const v = validatePassword(newPw);
    if (!newPw)         e.newPw = "New password is required.";
    else if (!v.valid || v.strength < 2) e.newPw = "Choose a stronger password.";
    const m = validatePasswordMatch(newPw, confirmPw);
    if (!m.valid) e.confirmPw = m.message;
    setPwErrors(e);
    if (Object.keys(e).length) return;

    setPwSaving(true);
    try {
      const { error } = await updatePassword(newPw);
      if (error) throw new Error(error.message);
      toast.success("Password changed successfully. You may need to sign in again.");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (err) {
      toast.error(err.message ?? "Failed to change password.");
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <DashboardLayout pageTitle="My Profile">
      <PageHeader title="My Profile" subtitle="Manage your account details and security" />

      <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:24, alignItems:"start" }}>

        {/* ── Left: Forms ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

          {/* Personal info */}
          <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", padding:"24px" }}>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17, color:"#1A1412", marginBottom:20 }}>
              Personal Information
            </h3>

            {profileError && <Alert type="error" message={profileError} style={{ marginBottom:16 }} />}

            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <Input label="Full Name" required value={fullName}
                onChange={e => setFullName(e.target.value)} />
              <Input label="Email Address" type="email" value={user?.email ?? ""} disabled
                helper="Email cannot be changed here. Contact support if needed." />
              <PhoneInput label="Phone Number" value={phone} onChange={setPhone}
                helper="Used for M-Pesa payment notifications" />
            </div>

            <div style={{ marginTop:20, display:"flex", justifyContent:"flex-end" }}>
              <Button variant="primary" loading={profileSaving} onClick={handleSaveProfile}>
                Save Changes
              </Button>
            </div>
          </div>

          {/* Change password */}
          <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", padding:"24px" }}>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17, color:"#1A1412", marginBottom:20 }}>
              Change Password
            </h3>
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <PasswordInput label="New Password" showStrength value={newPw}
                onChange={e => { setNewPw(e.target.value); setPwErrors(p=>({...p,newPw:null})); }}
                error={pwErrors.newPw}
              />
              <PasswordInput label="Confirm New Password" value={confirmPw}
                onChange={e => { setConfirmPw(e.target.value); setPwErrors(p=>({...p,confirmPw:null})); }}
                error={pwErrors.confirmPw}
              />
            </div>
            <div style={{ marginTop:20, display:"flex", justifyContent:"flex-end" }}>
              <Button variant="secondary" loading={pwSaving} onClick={handleChangePassword}>
                Update Password
              </Button>
            </div>
          </div>

          {/* Account info */}
          <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", padding:"24px" }}>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17, color:"#1A1412", marginBottom:16 }}>
              Account Details
            </h3>
            {[
              ["Account Role",   <Badge key="r" variant={profile?.role} />],
              ["Account Status", <Badge key="s" variant="active" />],
              ["Member Since",   formatDate(user?.created_at)],
              ["User ID",        <span key="id" style={{ fontSize:11, fontFamily:"'DM Mono','Courier New',monospace", color:"#8B7355" }}>{profile?.id?.slice(0,16)}…</span>],
            ].map(([k,v],i,arr) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 0", borderBottom: i < arr.length-1 ? "1px solid #F5EDE0" : "none" }}>
                <span style={{ fontSize:13, color:"#8B7355" }}>{k}</span>
                <span style={{ fontSize:13, fontWeight:600, color:"#1A1412" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Avatar + summary ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* Avatar card */}
          <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", padding:"24px", textAlign:"center" }}>
            <div style={{ position:"relative", display:"inline-block", marginBottom:14 }}>
              <Avatar
                name={profile?.full_name}
                src={profile?.avatar_url}
                size={72}
                style={{ margin:"0 auto" }}
              />
              <button
                onClick={() => avatarInput.current?.click()}
                disabled={avatarUploading}
                style={{ position:"absolute", bottom:-4, right:-4, width:26, height:26, borderRadius:"50%", background:"#C5612C", border:"2px solid #fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
            </div>
            <input ref={avatarInput} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display:"none" }} />
            <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17, color:"#1A1412", margin:"0 0 4px" }}>
              {profile?.full_name ?? "—"}
            </p>
            <p style={{ fontSize:13, color:"#8B7355", margin:"0 0 14px" }}>{user?.email}</p>
            <Badge variant={profile?.role} size="md" />
            <p style={{ fontSize:11, color:"#8B7355", marginTop:14 }}>
              {avatarUploading ? "Uploading…" : "Click the pencil to update your photo"}
            </p>
          </div>

          {/* Tips */}
          <Alert type="info" compact
            message="Keep your phone number up to date — it's used for M-Pesa payment confirmations and SMS alerts."
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
