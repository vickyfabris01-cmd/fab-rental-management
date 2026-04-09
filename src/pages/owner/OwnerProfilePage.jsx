import { useState, useEffect, useRef } from "react";

import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import PageHeader from "../../components/layout/PageHeader.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import PasswordInput from "../../components/ui/PasswordInput.jsx";
import { Alert } from "../../components/ui/Alert.jsx";
import Avatar from "../../components/ui/Avatar.jsx";

import useAuthStore from "../../store/authStore.js";
import { updateProfile } from "../../lib/api/profile.js";
import { useToast } from "../../hooks/useNotifications.js";
import { uploadFile, BUCKETS } from "../../config/supabase.js";
import { useLocation } from "react-router-dom";

// =============================================================================
// OwnerProfilePage  /owner/profile
// Owner profile editor — edit name, phone, avatar, change password
// =============================================================================

export default function OwnerProfilePage() {
  const profile = useAuthStore((s) => s.profile);
  const location = useLocation();
  const loading = useAuthStore((s) => s.loading);
  const toast = useToast();
  const avatarRef = useRef(null);

  const [form, setForm] = useState({ fullName: "", phone: "", email: "" });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (profile) {
      setForm({
        fullName: profile.full_name ?? "",
        phone: profile.phone ?? "",
        email: profile.email ?? "",
      });
      setAvatarPreview(profile.avatar_url ?? null);
    }
  }, [profile]);

  if (loading || !profile) {
    return (
      <DashboardLayout pageTitle="My Profile">
        <PageHeader
          title="My Profile"
          subtitle="Manage your owner account details"
        />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "80px 20px",
          }}
        >
          <Alert type="info" message="Loading your profile..." />
        </div>
      </DashboardLayout>
    );
  }

  const handleAvatarPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required";
    if (form.phone && !/^[\d\s\-\+\(\)]+$/.test(form.phone))
      e.phone = "Invalid phone format";
    return e;
  };

  const handleSaveProfile = async () => {
    const e = validateForm();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setSaving(true);
    try {
      let avatarUrl = profile.avatar_url;
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop();
        const path = `${profile.id}/avatar-${Date.now()}.${ext}`;
        avatarUrl = await uploadFile(BUCKETS.AVATARS, path, avatarFile, {
          upsert: true,
        });
      }

      const { error } = await updateProfile(profile.id, {
        full_name: form.fullName.trim(),
        phone: form.phone?.trim() || null,
        avatar_url: avatarUrl || null,
      });
      if (error) throw new Error(error.message);
      toast.success("Profile updated successfully.");
      setAvatarFile(null);
    } catch (err) {
      toast.error(err.message ?? "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    const e = {};
    if (!password.current) e.current = "Current password is required";
    if (!password.new) e.new = "New password is required";
    if (!password.confirm) e.confirm = "Password confirmation is required";
    if (password.new && password.new.length < 8)
      e.new = "Password must be at least 8 characters";
    if (password.new !== password.confirm) e.confirm = "Passwords do not match";
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setSavingPassword(true);
    try {
      // This would call an API endpoint to change password via Supabase Auth
      // For now, show a placeholder message
      toast.info(
        "Password change feature coming soon — contact support for now.",
      );
    } catch (err) {
      toast.error(err.message ?? "Failed to change password.");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <DashboardLayout pageTitle="My Profile">
      <PageHeader
        title="My Profile"
        subtitle="Manage your owner account details"
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: 24,
          marginBottom: 24,
        }}
      >
        {/* Left: Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Basic info */}
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #EDE4D8",
              padding: "24px",
            }}
          >
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#1A1412",
                margin: "0 0 18px",
              }}
            >
              Basic Information
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Input
                label="Full Name"
                required
                value={form.fullName}
                onChange={(e) => {
                  setForm((f) => ({ ...f, fullName: e.target.value }));
                  setErrors((p) => ({ ...p, fullName: null }));
                }}
                error={errors.fullName}
              />
              <Input
                label="Email"
                type="email"
                value={form.email}
                disabled
                helper="Contact support to change email"
              />
              <Input
                label="Phone Number"
                value={form.phone}
                onChange={(e) => {
                  setForm((f) => ({ ...f, phone: e.target.value }));
                  setErrors((p) => ({ ...p, phone: null }));
                }}
                error={errors.phone}
              />
              <Button
                variant="primary"
                onClick={handleSaveProfile}
                loading={saving}
              >
                Save Changes
              </Button>
            </div>
          </div>

          {/* Change password */}
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #EDE4D8",
              padding: "24px",
            }}
          >
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#1A1412",
                margin: "0 0 18px",
              }}
            >
              Security
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <PasswordInput
                label="Current Password"
                value={password.current}
                onChange={(e) => {
                  setPassword((p) => ({ ...p, current: e.target.value }));
                  setErrors((p) => ({ ...p, current: null }));
                }}
                error={errors.current}
              />
              <PasswordInput
                label="New Password"
                value={password.new}
                onChange={(e) => {
                  setPassword((p) => ({ ...p, new: e.target.value }));
                  setErrors((p) => ({ ...p, new: null }));
                }}
                error={errors.new}
              />
              <PasswordInput
                label="Confirm New Password"
                value={password.confirm}
                onChange={(e) => {
                  setPassword((p) => ({ ...p, confirm: e.target.value }));
                  setErrors((p) => ({ ...p, confirm: null }));
                }}
                error={errors.confirm}
              />
              <Button
                variant="primary"
                onClick={handleChangePassword}
                loading={savingPassword}
              >
                Change Password
              </Button>
            </div>
          </div>
        </div>

        {/* Right: Avatar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #EDE4D8",
              padding: "24px",
            }}
          >
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#1A1412",
                margin: "0 0 14px",
              }}
            >
              Avatar
            </h3>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 14,
              }}
            >
              <Avatar
                name={form.fullName}
                src={avatarPreview || profile.avatar_url}
                size="lg"
              />
              <button
                onClick={() => avatarRef.current?.click()}
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#C5612C",
                  background: "transparent",
                  border: "1.5px solid #C5612C",
                  borderRadius: 8,
                  padding: "8px 16px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "rgba(197,97,44,0.08)")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                Change Avatar
              </button>
              <input
                ref={avatarRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarPick}
                style={{ display: "none" }}
              />
              <p
                style={{
                  fontSize: 11,
                  color: "#8B7355",
                  textAlign: "center",
                  margin: 0,
                }}
              >
                JPEG, PNG, or WebP · Max 5MB
              </p>
            </div>
          </div>

          {/* Account info card */}
          <div
            style={{
              background: "#FAF7F2",
              borderRadius: 16,
              border: "1px solid #EDE4D8",
              padding: "16px",
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#8B7355",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                margin: "0 0 8px",
              }}
            >
              Account
            </p>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#1A1412",
                margin: "0 0 10px",
              }}
            >
              {profile.full_name}
            </p>
            <p
              style={{
                fontSize: 11,
                color: "#8B7355",
                margin: "0 0 8px",
                wordBreak: "break-all",
              }}
            >
              {profile.email}
            </p>
            <p
              style={{
                fontSize: 10,
                color: "#C5612C",
                margin: 0,
                textTransform: "capitalize",
              }}
            >
              {profile.role}
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
