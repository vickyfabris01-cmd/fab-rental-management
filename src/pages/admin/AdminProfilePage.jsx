import { useRef, useState } from "react";

import AdminLayout  from "../../layouts/AdminLayout.jsx";
import Input        from "../../components/ui/Input.jsx";
import Button       from "../../components/ui/Button.jsx";
import { Alert }    from "../../components/ui/Alert.jsx";
import { useToast } from "../../hooks/useNotifications.js";
import useAuthStore from "../../store/authStore.js";
import { updateProfile, updateAvatar } from "../../lib/api/profile.js";
import { updatePassword } from "../../lib/api/auth.js";

// =============================================================================
// AdminProfilePage  /admin/profile
// The super admin's own profile: name, phone, avatar and password.
// Email is shown read-only (changing it needs a confirmation email flow).
// =============================================================================

const S2 = "#1A1612"; const B = "rgba(255,255,255,0.07)";
const MU = "rgba(255,255,255,0.35)"; const TX = "rgba(255,255,255,0.88)"; const AC = "#C5612C";

function Section({ title, subtitle, children }) {
  return (
    <div style={{ background:S2,borderRadius:16,border:`1px solid ${B}`,padding:"22px",marginBottom:16 }}>
      <h3 style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:17,color:TX,margin:"0 0 4px" }}>
        {title}
      </h3>
      {subtitle && <p style={{ fontSize:12,color:MU,margin:"0 0 18px",lineHeight:1.6 }}>{subtitle}</p>}
      {children}
    </div>
  );
}

function initialsOf(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join("") || "SA";
}

export default function AdminProfilePage() {
  const toast          = useToast();
  const profile        = useAuthStore((s) => s.profile);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const fileRef        = useRef(null);

  // Profile form
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone,    setPhone]    = useState(profile?.phone ?? "");
  const [saving,   setSaving]   = useState(false);
  const [uploading, setUploading] = useState(false);

  // Password form
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [pwError,  setPwError]  = useState(null);
  const [pwSaving, setPwSaving] = useState(false);

  if (!profile) {
    return (
      <AdminLayout>
        <p style={{ color:MU,fontSize:13 }}>Loading profile…</p>
      </AdminLayout>
    );
  }

  const handleSave = async () => {
    if (!fullName.trim()) {
      toast.error("Full name cannot be empty.");
      return;
    }
    setSaving(true);
    const { error } = await updateProfile(profile.id, {
      full_name: fullName.trim(),
      phone:     phone.trim() || null,
    });
    setSaving(false);

    if (error) {
      toast.error(error.message ?? "Could not save your profile.");
      return;
    }
    await refreshProfile();
    toast.success("Profile updated.");
  };

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be smaller than 2 MB.");
      return;
    }

    setUploading(true);
    const { error } = await updateAvatar(profile.id, file);
    setUploading(false);

    if (error) {
      toast.error(error.message ?? "Could not upload the photo.");
      return;
    }
    await refreshProfile();
    toast.success("Photo updated.");
  };

  const handlePassword = async () => {
    setPwError(null);
    if (password.length < 8) {
      setPwError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setPwError("Passwords do not match.");
      return;
    }

    setPwSaving(true);
    const { error } = await updatePassword(password);
    setPwSaving(false);

    if (error) {
      setPwError(error.message ?? "Could not change the password.");
      return;
    }
    setPassword("");
    setConfirm("");
    toast.success("Password changed.");
  };

  return (
    <AdminLayout>
      <div style={{ marginBottom:20 }}>
        <p style={{ fontSize:10,fontWeight:700,color:AC,textTransform:"uppercase",letterSpacing:"0.1em",margin:"0 0 3px" }}>Account</p>
        <h1 style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:24,color:TX,margin:0 }}>
          My Profile
        </h1>
      </div>

      {/* Identity card */}
      <Section title="Super Admin" subtitle="Platform-wide access. This account manages every tenant.">
        <div style={{ display:"flex",alignItems:"center",gap:18,flexWrap:"wrap" }}>
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Avatar"
              style={{ width:72,height:72,borderRadius:"50%",objectFit:"cover",border:`2px solid ${AC}` }}
            />
          ) : (
            <div style={{
              width:72,height:72,borderRadius:"50%",background:AC,color:"#fff",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:26,
            }}>
              {initialsOf(profile.full_name)}
            </div>
          )}
          <div>
            <p style={{ fontSize:16,fontWeight:700,color:TX,margin:"0 0 2px" }}>{profile.full_name}</p>
            <p style={{ fontSize:12,color:MU,margin:"0 0 10px" }}>{profile.email}</p>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} style={{ display:"none" }} />
            <Button variant="secondary" size="sm" loading={uploading} onClick={() => fileRef.current?.click()}>
              Change photo
            </Button>
          </div>
        </div>
      </Section>

      {/* Details */}
      <Section title="Details" subtitle="Your name and phone number as shown across the platform.">
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
          <Input label="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} />
          <Input label="Phone" type="tel" placeholder="07XX XXX XXX" value={phone} onChange={e => setPhone(e.target.value)} />
          <Input label="Email" value={profile.email ?? ""} disabled helper="Email changes are not available here." />
          <Input label="Role" value="Super Admin" disabled />
        </div>
        <div style={{ display:"flex",justifyContent:"flex-end",marginTop:16 }}>
          <Button variant="primary" loading={saving} onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </Section>

      {/* Password */}
      <Section title="Change Password" subtitle="Use at least 8 characters. You stay signed in on this device.">
        {pwError && <Alert type="error" message={pwError} className="mb-4" />}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
          <Input label="New Password" type="password" autoComplete="new-password"
            value={password} onChange={e => setPassword(e.target.value)} />
          <Input label="Confirm Password" type="password" autoComplete="new-password"
            value={confirm} onChange={e => setConfirm(e.target.value)} />
        </div>
        <div style={{ display:"flex",justifyContent:"flex-end",marginTop:16 }}>
          <Button variant="primary" loading={pwSaving} onClick={handlePassword}>
            Update Password
          </Button>
        </div>
      </Section>
    </AdminLayout>
  );
}