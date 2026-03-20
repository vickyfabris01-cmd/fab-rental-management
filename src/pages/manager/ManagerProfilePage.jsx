import { useState, useRef } from "react";

import DashboardLayout  from "../../layouts/DashboardLayout.jsx";
import PageHeader       from "../../components/layout/PageHeader.jsx";
import Input            from "../../components/ui/Input.jsx";
import PhoneInput       from "../../components/ui/PhoneInput.jsx";
import PasswordInput    from "../../components/ui/PasswordInput.jsx";
import Button           from "../../components/ui/Button.jsx";
import Avatar           from "../../components/ui/Avatar.jsx";
import Badge            from "../../components/ui/Badge.jsx";
import { Alert }        from "../../components/ui/Alert.jsx";

import useAuthStore     from "../../store/authStore.js";
import useTenantStore   from "../../store/tenantStore.js";
import { updateProfile, updateAvatar } from "../../lib/api/profile.js";
import { updatePassword }              from "../../lib/api/auth.js";
import { useToast }     from "../../hooks/useNotifications.js";
import { validatePassword, validatePasswordMatch } from "../../lib/validators.js";
import { formatDate }   from "../../lib/formatters.js";

// =============================================================================
// ManagerProfilePage  /manage/profile
// =============================================================================

export default function ManagerProfilePage() {
  const profile       = useAuthStore(s => s.profile);
  const user          = useAuthStore(s => s.user);
  const refreshProfile= useAuthStore(s => s.refreshProfile);
  const tenant        = useTenantStore(s => s.tenant);
  const toast         = useToast();
  const avatarInput   = useRef(null);

  const [fullName,   setFullName]   = useState(profile?.full_name ?? "");
  const [phone,      setPhone]      = useState(profile?.phone ?? "");
  const [profSaving, setProfSaving] = useState(false);
  const [profError,  setProfError]  = useState(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const [newPw,     setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwErrors,  setPwErrors]  = useState({});
  const [pwSaving,  setPwSaving]  = useState(false);

  const handleSave = async () => {
    setProfError(null);
    if (!fullName.trim()) { setProfError("Full name is required."); return; }
    setProfSaving(true);
    try {
      const { error } = await updateProfile(profile.id, { full_name: fullName.trim(), phone: phone || null });
      if (error) throw new Error(error.message);
      await refreshProfile();
      toast.success("Profile updated.");
    } catch (e) { setProfError(e.message ?? "Failed to save."); }
    finally { setProfSaving(false); }
  };

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast.error("Image must be under 3 MB."); return; }
    setAvatarLoading(true);
    try {
      const { error } = await updateAvatar(profile.id, file);
      if (error) throw new Error(error.message);
      await refreshProfile();
      toast.success("Photo updated.");
    } catch (e) { toast.error(e.message ?? "Upload failed."); }
    finally { setAvatarLoading(false); }
  };

  const handleChangePw = async () => {
    const e = {};
    const v = validatePassword(newPw);
    if (!newPw || !v.valid || v.strength < 2) e.newPw = "Choose a stronger password (min 8 chars).";
    const m = validatePasswordMatch(newPw, confirmPw);
    if (!m.valid) e.confirmPw = m.message;
    setPwErrors(e);
    if (Object.keys(e).length) return;
    setPwSaving(true);
    try {
      const { error } = await updatePassword(newPw);
      if (error) throw new Error(error.message);
      toast.success("Password changed. Please sign in again if prompted.");
      setNewPw(""); setConfirmPw("");
    } catch (err) { toast.error(err.message ?? "Failed to change password."); }
    finally { setPwSaving(false); }
  };

  return (
    <DashboardLayout pageTitle="My Profile">
      <PageHeader title="My Profile" subtitle="Manage your manager account details" />

      <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:24, alignItems:"start" }}>

        {/* ── Left ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

          {/* Personal info */}
          <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", padding:"24px" }}>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17, color:"#1A1412", marginBottom:18 }}>Personal Information</h3>
            {profError && <Alert type="error" message={profError} style={{ marginBottom:14 }} />}
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <Input label="Full Name" required value={fullName} onChange={e => setFullName(e.target.value)} />
              <Input label="Email Address" type="email" value={user?.email ?? ""} disabled helper="Contact support to change your email address." />
              <PhoneInput label="Phone Number" value={phone} onChange={setPhone} />
            </div>
            <div style={{ display:"flex", justifyContent:"flex-end", marginTop:18 }}>
              <Button variant="primary" loading={profSaving} onClick={handleSave}>Save Changes</Button>
            </div>
          </div>

          {/* Change password */}
          <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", padding:"24px" }}>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17, color:"#1A1412", marginBottom:18 }}>Change Password</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <PasswordInput label="New Password" showStrength value={newPw}
                onChange={e => { setNewPw(e.target.value); setPwErrors(p=>({...p,newPw:null})); }}
                error={pwErrors.newPw} />
              <PasswordInput label="Confirm Password" value={confirmPw}
                onChange={e => { setConfirmPw(e.target.value); setPwErrors(p=>({...p,confirmPw:null})); }}
                error={pwErrors.confirmPw} />
            </div>
            <div style={{ display:"flex", justifyContent:"flex-end", marginTop:18 }}>
              <Button variant="secondary" loading={pwSaving} onClick={handleChangePw}>Update Password</Button>
            </div>
          </div>

          {/* Account details */}
          <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", padding:"24px" }}>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17, color:"#1A1412", marginBottom:14 }}>Account Details</h3>
            {[
              ["Role",       <Badge key="r" variant={profile?.role} />],
              ["Property",   tenant?.name ?? "—"],
              ["Member Since", formatDate(user?.created_at)],
            ].map(([k,v],i,arr) => (
              <div key={k} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:i<arr.length-1?"1px solid #F5EDE0":"none" }}>
                <span style={{ fontSize:13, color:"#8B7355" }}>{k}</span>
                <span style={{ fontSize:13, fontWeight:600, color:"#1A1412" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", padding:"24px", textAlign:"center" }}>
            <div style={{ position:"relative", display:"inline-block", marginBottom:14 }}>
              <Avatar name={profile?.full_name} src={profile?.avatar_url} size={72} style={{ margin:"0 auto" }} />
              <button onClick={() => avatarInput.current?.click()} disabled={avatarLoading}
                style={{ position:"absolute", bottom:-4, right:-4, width:26, height:26, borderRadius:"50%", background:"#C5612C", border:"2px solid #fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
            </div>
            <input ref={avatarInput} type="file" accept="image/*" onChange={handleAvatar} style={{ display:"none" }} />
            <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17, color:"#1A1412", margin:"0 0 4px" }}>{profile?.full_name}</p>
            <p style={{ fontSize:13, color:"#8B7355", margin:"0 0 12px" }}>{user?.email}</p>
            <Badge variant="manager" size="md" />
            {tenant?.name && (
              <p style={{ fontSize:12, color:"#8B7355", marginTop:10 }}>{tenant.name}</p>
            )}
          </div>
          <Alert type="info" compact message="Keep your phone number current — it's used for urgent property notifications and M-Pesa confirmations." />
        </div>
      </div>
    </DashboardLayout>
  );
}
