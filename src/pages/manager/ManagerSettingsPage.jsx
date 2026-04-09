import { useState, useEffect, useRef } from "react";

import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import PageHeader from "../../components/layout/PageHeader.jsx";
import Input from "../../components/ui/Input.jsx";
import SelectInput from "../../components/ui/SelectInput.jsx";
import Button from "../../components/ui/Button.jsx";
import { Toggle } from "../../components/ui/TextArea.jsx";
import { Alert } from "../../components/ui/Alert.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import AssignRoleModal from "../../components/modals/AssignRoleModal.jsx";

import useAuthStore from "../../store/authStore.js";
import useTenantStore from "../../store/tenantStore.js";
import { useToast } from "../../hooks/useNotifications.js";
import { updateTenant } from "../../lib/api/tenants.js";
import { db, uploadFile, BUCKETS, supabase } from "../../config/supabase.js";
import { fetchTenantProfiles } from "../../lib/api/profile.js";
import { useLocation } from "react-router-dom";

// =============================================================================
// ManagerSettingsPage  /manage/settings
//
// Sections:
//   1. Property Branding  — logo upload, property name, tagline
//   2. Property Info      — address, phone, email, county
//   3. Billing Defaults   — billing day, grace period, late fee, currency
//   4. Notifications      — email / SMS toggles
//   5. Team & Access      — view invites, invite new manager
// =============================================================================

// ── Constants ─────────────────────────────────────────────────────────────────
const FONT_OPTIONS = [
  { label: "DM Sans (Default)", value: "DM Sans" },
  { label: "Arial", value: "Arial" },
  { label: "Helvetica", value: "Helvetica" },
  { label: "Georgia", value: "Georgia" },
  { label: "Times New Roman", value: "Times New Roman" },
  { label: "Courier New", value: "Courier New" },
  { label: "Trebuchet MS", value: "Trebuchet MS" },
  { label: "Verdana", value: "Verdana" },
];

const COLOR_OPTIONS = [
  { label: "Brand Orange", value: "#C5612C" },
  { label: "Dark Brown", value: "#8B3A18" },
  { label: "Marine Blue", value: "#1E3A8A" },
  { label: "Forest Green", value: "#15803D" },
  { label: "Deep Purple", value: "#6B21A8" },
  { label: "Slate Gray", value: "#475569" },
  { label: "Charcoal", value: "#1A1412" },
  { label: "Deep Red", value: "#991B1B" },
];

const SECONDARY_COLOR_OPTIONS = [
  { label: "Muted Brown (Default)", value: "#5C4A3A" },
  { label: "Slate", value: "#64748B" },
  { label: "Warm Gray", value: "#78716C" },
  { label: "Cool Gray", value: "#6F7782" },
  { label: "Dark Olive", value: "#4A5568" },
  { label: "Deep Indigo", value: "#312E81" },
  { label: "Deep Forest", value: "#1B4332" },
  { label: "Almost Black", value: "#18181B" },
];

function Section({ title, subtitle, children, action }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #EDE4D8",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "20px 24px 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h3
            style={{
              fontFamily: "'Playfair Display',serif",
              fontWeight: 700,
              fontSize: 17,
              color: "#1A1412",
              margin: "0 0 3px",
            }}
          >
            {title}
          </h3>
          {subtitle && (
            <p
              style={{
                fontSize: 13,
                color: "#8B7355",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
      <div style={{ padding: "0 24px 24px" }}>{children}</div>
    </div>
  );
}

function Row() {
  return <div style={{ height: 1, background: "#F5EDE0", margin: "16px 0" }} />;
}

export default function ManagerSettingsPage() {
  const profile = useAuthStore((s) => s.profile);
  const location = useLocation();
  const tenant = useTenantStore((s) => s.tenant);
  const branding = useTenantStore((s) => s.branding);
  const settings = useTenantStore((s) => s.settings);
  const refresh = useTenantStore((s) => s.fetchTenantData);
  const injectBranding = useTenantStore((s) => s.injectBranding);
  const toast = useToast();
  const logoRef = useRef(null);

  // ── Property info ─────────────────────────────────────────────────────────
  const [propName, setPropName] = useState("");
  const [propPhone, setPropPhone] = useState("");
  const [propEmail, setPropEmail] = useState("");
  const [propAddr, setPropAddr] = useState("");
  const [propCounty, setPropCounty] = useState("");
  const [propTagline, setPropTagline] = useState("");
  const [primColor, setPrimColor] = useState("#C5612C");
  const [secColor, setSecColor] = useState("#5C4A3A");
  const [fontFamily, setFontFamily] = useState("DM Sans");
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [propInfoSaving, setPropInfoSaving] = useState(false);

  // ── Logo ──────────────────────────────────────────────────────────────────
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);

  // ── Billing defaults ──────────────────────────────────────────────────────
  const [billDay, setBillDay] = useState("5");
  const [graceDays, setGraceDays] = useState("3");
  const [lateFee, setLateFee] = useState("500");
  const [billSaving, setBillSaving] = useState(false);

  // ── Notifications ─────────────────────────────────────────────────────────
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSMS, setNotifSMS] = useState(false);
  const [notifSaving, setNotifSaving] = useState(false);

  // ── Team ──────────────────────────────────────────────────────────────────
  const [assignOpen, setAssignOpen] = useState(false);
  const [managers, setManagers] = useState([]);
  const [false, setInvLoading] = useState(false);

  // Hydrate from stores
  useEffect(() => {
    if (!tenant) return;
    setPropName(tenant.name ?? "");
    setPropPhone(tenant.phone ?? "");
    setPropEmail(tenant.email ?? "");
    setPropAddr(tenant.address ?? "");
    setPropCounty(tenant.county ?? "");
    setPropTagline(branding?.tagline ?? "");
    setPrimColor(branding?.primary_color ?? "#C5612C");
    setSecColor(branding?.secondary_color ?? "#5C4A3A");
    setFontFamily(branding?.font_family ?? "DM Sans");
    setLogoPreview(branding?.logo_url ?? tenant.logo_url ?? null);
    setBillDay(String(settings?.billing_due_day ?? 5));
    setGraceDays(String(settings?.grace_period_days ?? 3));
    setLateFee(String(settings?.late_fee_amount ?? 500));
    setNotifEmail(settings?.email_enabled ?? true);
    setNotifSMS(settings?.sms_enabled ?? false);
  }, [
    tenant?.id,
    tenant?.name,
    tenant?.phone,
    tenant?.email,
    tenant?.address,
    tenant?.county,
    branding?.tagline,
    branding?.primary_color,
    branding?.secondary_color,
    branding?.font_family,
    branding?.logo_url,
    settings,
  ]);

  // Load managers for this tenant
  useEffect(() => {
    if (!profile?.tenant_id) return;
    fetchTenantProfiles(profile.tenant_id, { role: "manager" })
      .then(({ data }) => setManagers(data ?? []))
  }, [profile?.tenant_id, location.key]);

  // ── Logo pick ─────────────────────────────────────────────────────────────
  const handleLogoPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2 MB.");
      return;
    }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ── Save branding (logo, name, tagline, colors, font) ──────────────────────────────
  const handleSaveBranding = async () => {
    if (!tenant?.id) return;
    setBrandingSaving(true);
    try {
      let logoUrl = branding?.logo_url ?? tenant.logo_url ?? null;

      // Upload logo if new file selected
      if (logoFile) {
        setLogoUploading(true);
        const ext = logoFile.name.split(".").pop();
        const path = `${profile.tenant_id}/logo/logo.${ext}`;
        try {
          logoUrl = await uploadFile(BUCKETS.PROPERTY_IMGS, path, logoFile, {
            upsert: true,
          });
        } catch (uploadErr) {
          throw new Error(
            "Logo upload failed. Check your internet connection and try again.",
          );
        } finally {
          setLogoUploading(false);
          setLogoFile(null);
        }
      }

      // Update branding and tenant name/logo
      const [tenantResult, brandingResult] = await Promise.all([
        updateTenant(tenant.id, {
          name: propName.trim() || tenant.name,
          logo_url: logoUrl,
        }),
        db
          .tenantBranding()
          .update({
            tagline: propTagline.trim() || null,
            logo_url: logoUrl,
            primary_color: primColor.trim() || "#C5612C",
            secondary_color: secColor.trim() || "#5C4A3A",
            font_family: fontFamily.trim() || "DM Sans",
            updated_at: new Date().toISOString(),
          })
          .eq("tenant_id", tenant.id),
      ]);

      if (tenantResult.error) throw new Error(tenantResult.error.message);
      if (brandingResult.error) throw new Error(brandingResult.error.message);

      toast.success("Branding saved.");
      refresh(tenant.id).catch(() => {});
      // Ensure CSS injection happens immediately for visual feedback
      setTimeout(() => injectBranding(), 100);
    } catch (err) {
      toast.error(err.message ?? "Failed to save branding.");
    } finally {
      setBrandingSaving(false);
    }
  };

  // ── Save property info (phone, email, address, county) ────────────────────
  const handleSavePropertyInfo = async () => {
    if (!tenant?.id) return;

    // Validate: at least one field must have a value
    const validFields = {
      phone: propPhone.trim(),
      email: propEmail.trim(),
      address: propAddr.trim(),
      county: propCounty.trim(),
    };

    const hasAnyValue = Object.values(validFields).some((v) => v.length > 0);
    if (!hasAnyValue) {
      toast.error("Please enter at least one field.");
      return;
    }

    setPropInfoSaving(true);
    try {
      const updates = {};
      if (validFields.phone) updates.phone = validFields.phone;
      if (validFields.email) updates.email = validFields.email;
      if (validFields.address) updates.address = validFields.address;
      if (validFields.county) updates.county = validFields.county;

      const { error } = await updateTenant(tenant.id, updates);

      if (error) throw new Error(error.message);

      toast.success("Property info saved.");
      refresh(tenant.id).catch(() => {});
    } catch (err) {
      toast.error(err.message ?? "Failed to save property info.");
    } finally {
      setPropInfoSaving(false);
    }
  };

  // ── Save billing settings ─────────────────────────────────────────────────
  const handleSaveBilling = async () => {
    if (!tenant?.id) return;
    setBillSaving(true);
    try {
      const { error } = await db
        .tenantSettings()
        .update({
          billing_due_day: Number(billDay) || 5,
          grace_period_days: Number(graceDays) || 3,
          late_fee_amount: Number(lateFee) || 0,
          updated_at: new Date().toISOString(),
        })
        .eq("tenant_id", tenant.id);
      if (error) throw new Error(error.message);
      await refresh(tenant.id);
      toast.success("Billing settings saved.");
    } catch (err) {
      toast.error(err.message ?? "Failed to save billing settings.");
    } finally {
      setBillSaving(false);
    }
  };

  // ── Save notification preferences ─────────────────────────────────────────
  const handleSaveNotifs = async () => {
    if (!tenant?.id) return;
    setNotifSaving(true);
    try {
      const { error } = await db
        .tenantSettings()
        .update({
          email_enabled: notifEmail,
          sms_enabled: notifSMS,
          updated_at: new Date().toISOString(),
        })
        .eq("tenant_id", tenant.id);
      if (error) throw new Error(error.message);
      await refresh(tenant.id);
      toast.success("Notification preferences saved.");
    } catch (err) {
      toast.error(err.message ?? "Failed to save.");
    } finally {
      setNotifSaving(false);
    }
  };

  return (
    <DashboardLayout pageTitle="Settings">
      <PageHeader
        title="Settings"
        subtitle="Manage your property and account preferences"
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* ── 1. Branding & Identity ── */}
        <Section
          title="Property Branding"
          subtitle="Your logo and name appear on the public listing and resident portal."
        >
          <div
            style={{
              display: "flex",
              gap: 20,
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            {/* Logo upload */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                flexShrink: 0,
              }}
            >
              <div style={{ position: "relative" }}>
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo"
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 16,
                      objectFit: "cover",
                      border: "2px solid #EDE4D8",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 16,
                      background: "#FAF7F2",
                      border: "2px dashed #E8DDD4",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                    }}
                  >
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#C5612C"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span style={{ fontSize: 9, color: "#8B7355" }}>
                      No logo
                    </span>
                  </div>
                )}
                <button
                  onClick={() => logoRef.current?.click()}
                  style={{
                    position: "absolute",
                    bottom: -6,
                    right: -6,
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: "#C5612C",
                    border: "2.5px solid #fff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title="Upload logo"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              </div>
              <p
                style={{
                  fontSize: 11,
                  color: "#8B7355",
                  textAlign: "center",
                  maxWidth: 90,
                }}
              >
                PNG, JPG · max 2 MB
              </p>
              <input
                ref={logoRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleLogoPick}
                style={{ display: "none" }}
              />
            </div>

            {/* Name + tagline */}
            <div
              style={{
                flex: 1,
                minWidth: 200,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <Input
                label="Property / Business Name"
                required
                value={propName}
                onChange={(e) => setPropName(e.target.value)}
                placeholder="e.g. Sunrise Hostel"
              />
              <Input
                label="Tagline"
                value={propTagline}
                onChange={(e) => setPropTagline(e.target.value)}
                placeholder="e.g. Modern living in the heart of Nairobi"
                helper="Shown on your public listing page"
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
                }}
              >
                <SelectInput
                  label="Primary Color"
                  options={COLOR_OPTIONS}
                  value={primColor}
                  onChange={(e) => setPrimColor(e.target.value)}
                />
                <SelectInput
                  label="Secondary Color"
                  options={SECONDARY_COLOR_OPTIONS}
                  value={secColor}
                  onChange={(e) => setSecColor(e.target.value)}
                />
              </div>
              <SelectInput
                label="Font Family"
                options={FONT_OPTIONS}
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
              />
            </div>
          </div>

          {/* Save button for branding section */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 16,
              paddingTop: 16,
              borderTop: "1px solid #F5EDE0",
            }}
          >
            <Button
              variant="primary"
              loading={brandingSaving || logoUploading}
              onClick={handleSaveBranding}
            >
              {logoUploading
                ? "Uploading logo…"
                : brandingSaving
                  ? "Saving…"
                  : "Save Branding"}
            </Button>
          </div>
        </Section>

        {/* ── 2. Property Info ── */}
        <Section
          title="Property Information"
          subtitle="Contact and location details shown to prospective residents."
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
              }}
            >
              <Input
                label="Contact Phone"
                type="tel"
                value={propPhone}
                onChange={(e) => setPropPhone(e.target.value)}
                placeholder="+254 7XX XXX XXX"
              />
              <Input
                label="Contact Email"
                type="email"
                value={propEmail}
                onChange={(e) => setPropEmail(e.target.value)}
                placeholder="info@yourproperty.co.ke"
              />
            </div>
            <Input
              label="Physical Address"
              value={propAddr}
              onChange={(e) => setPropAddr(e.target.value)}
              placeholder="e.g. Westlands Road, Westlands"
            />
            <Input
              label="County"
              value={propCounty}
              onChange={(e) => setPropCounty(e.target.value)}
              placeholder="e.g. Nairobi"
            />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="primary"
                loading={propInfoSaving}
                onClick={handleSavePropertyInfo}
              >
                {propInfoSaving ? "Saving…" : "Save Property Info"}
              </Button>
            </div>
          </div>
        </Section>

        {/* ── 3. Billing Defaults ── */}
        <Section
          title="Billing Defaults"
          subtitle="These defaults apply to all new tenancies created from now on."
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 14,
            }}
          >
            <Input
              label="Billing Day of Month"
              type="number"
              min="1"
              max="28"
              value={billDay}
              onChange={(e) => setBillDay(e.target.value)}
              helper="Day rent is due each month"
            />
            <Input
              label="Grace Period (days)"
              type="number"
              min="0"
              max="30"
              value={graceDays}
              onChange={(e) => setGraceDays(e.target.value)}
              helper="Days before late fee applies"
            />
            <Input
              label="Late Fee (KES)"
              type="number"
              min="0"
              value={lateFee}
              onChange={(e) => setLateFee(e.target.value)}
              helper="Added after grace period"
              leftAdornment={
                <span
                  style={{ fontSize: 12, fontWeight: 600, color: "#8B7355" }}
                >
                  KES
                </span>
              }
            />
          </div>
          <Alert
            type="info"
            compact
            message="Existing billing cycles are not affected — only new tenancies use these defaults."
            style={{ marginTop: 14 }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 16,
            }}
          >
            <Button
              variant="primary"
              loading={billSaving}
              onClick={handleSaveBilling}
            >
              Save Billing Settings
            </Button>
          </div>
        </Section>

        {/* ── 4. Notifications ── */}
        <Section
          title="Notification Channels"
          subtitle="Choose how residents and managers receive alerts."
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#1A1412",
                    margin: 0,
                  }}
                >
                  Email Notifications
                </p>
                <p
                  style={{ fontSize: 12, color: "#8B7355", margin: "2px 0 0" }}
                >
                  Billing reminders, receipts, and system alerts via email
                </p>
              </div>
              <Toggle checked={notifEmail} onChange={setNotifEmail} />
            </div>
            <Row />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#1A1412",
                    margin: 0,
                  }}
                >
                  SMS Notifications
                </p>
                <p
                  style={{ fontSize: 12, color: "#8B7355", margin: "2px 0 0" }}
                >
                  Payment reminders via SMS (requires Africa's Talking / Twilio
                  config)
                </p>
              </div>
              <Toggle checked={notifSMS} onChange={setNotifSMS} />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 16,
            }}
          >
            <Button
              variant="secondary"
              loading={notifSaving}
              onClick={handleSaveNotifs}
            >
              Save Preferences
            </Button>
          </div>
        </Section>

        {/* ── 5. Team & Access (owner only) ── */}
        {profile?.role === "owner" && (
          <Section
            title="Team & Access"
            subtitle="Assign visitor accounts as managers for this property."
            action={
              <Button variant="primary" onClick={() => setAssignOpen(true)}>
                + Assign Manager
              </Button>
            }
          >
            {false ? (
              <p style={{ fontSize: 13, color: "#8B7355" }}>Loading invites…</p>
            ) : invites.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <p
                  style={{ fontSize: 14, color: "#5C4A3A", margin: "0 0 12px" }}
                >
                  No managers assigned yet.
                </p>
                <Button variant="secondary" onClick={() => setAssignOpen(true)}>
                  Assign First Manager
                </Button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {managers.map((mgr, i) => (
                  <div
                    key={mgr.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "11px 0",
                      borderBottom:
                        i < managers.length - 1 ? "1px solid #F5EDE0" : "none",
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background:
                          inv.status === "accepted"
                            ? "#ECFDF5"
                            : "rgba(197,97,44,0.10)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                        flexShrink: 0,
                      }}
                    >
                      {inv.status === "accepted" ? "✅" : "📧"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#1A1412",
                          margin: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {inv.email}
                      </p>
                      <p
                        style={{
                          fontSize: 11,
                          color: "#8B7355",
                          margin: "2px 0 0",
                        }}
                      >
                        Invited{" "}
                        {new Date(inv.created_at).toLocaleDateString("en-KE", {
                          dateStyle: "medium",
                        })}
                      </p>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: 999,
                        textTransform: "capitalize",
                        flexShrink: 0,
                        background:
                          inv.status === "accepted"
                            ? "rgba(16,185,129,0.12)"
                            : inv.status === "expired"
                              ? "rgba(239,68,68,0.10)"
                              : "rgba(245,158,11,0.12)",
                        color:
                          inv.status === "accepted"
                            ? "#059669"
                            : inv.status === "expired"
                              ? "#DC2626"
                              : "#D97706",
                      }}
                    >
                      {inv.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}
      </div>

      <AssignRoleModal
        isOpen={assignOpen}
        onClose={() => setAssignOpen(false)}
        targetRole="manager"
        onSuccess={(profile) => {
          setAssignOpen(false);
          if (profile) setManagers((p) => [profile, ...p]);
        }}
      />
    </DashboardLayout>
  );
}
