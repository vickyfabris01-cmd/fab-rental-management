import { useState, useEffect } from "react";
import { createTenant, assignUserToTenant } from "../../lib/api/tenants.js";
import { fetchTenantProfiles } from "../../lib/api/profile.js";
import { KE_COUNTIES } from "../../config/constants.js";
import { useToast } from "../../hooks/useNotifications.js";

// =============================================================================
// TenantFormModal
//
// Super-admin modal to create a new tenant (rental business) on the platform.
//
// Steps:
//   1. Basic Info  — name, email, phone, address, county, plan
//   2. Assign Owner (optional) — search existing users, pick one as owner
//
// Props:
//   open       — boolean
//   onClose    — () => void
//   onCreated  — (tenant) => void   called after successful creation
// =============================================================================

const SURFACE = "#1A1612";
const BORDER = "rgba(255,255,255,0.09)";
const MUTED = "rgba(255,255,255,0.35)";
const TEXT = "rgba(255,255,255,0.88)";
const ACCENT = "#C5612C";
const INPUT_BG = "rgba(255,255,255,0.05)";

function Label({ children, required }) {
  return (
    <label
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: MUTED,
        display: "block",
        marginBottom: 6,
      }}
    >
      {children}
      {required && <span style={{ color: ACCENT, marginLeft: 3 }}>*</span>}
    </label>
  );
}

function TInput({
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  disabled,
}) {
  const [focused, setFocused] = useState(false);
  return (
    <>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          padding: "10px 12px",
          background: INPUT_BG,
          border: `1.5px solid ${error ? "#EF4444" : focused ? ACCENT : BORDER}`,
          borderRadius: 9,
          fontSize: 13,
          color: TEXT,
          outline: "none",
          boxSizing: "border-box",
          transition: "border-color 0.18s",
        }}
      />
      {error && (
        <p style={{ fontSize: 11, color: "#EF4444", margin: "4px 0 0" }}>
          {error}
        </p>
      )}
    </>
  );
}

function TSelect({ value, onChange, children, error }) {
  const [focused, setFocused] = useState(false);
  return (
    <>
      <select
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          padding: "10px 12px",
          background: "#1A1612",
          border: `1.5px solid ${focused ? ACCENT : BORDER}`,
          borderRadius: 9,
          fontSize: 13,
          color: TEXT,
          outline: "none",
          cursor: "pointer",
        }}
      >
        {children}
      </select>
      {error && (
        <p style={{ fontSize: 11, color: "#EF4444", margin: "4px 0 0" }}>
          {error}
        </p>
      )}
    </>
  );
}

export function TenantFormModal({ open, onClose, onCreated }) {
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Step 1 — tenant info
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    county: "",
    plan: "basic",
  });

  // Step 2 — assign owner
  const [ownerSearch, setOwnerSearch] = useState("");
  const [ownerResults, setOwnerResults] = useState([]);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [createdTenant, setCreatedTenant] = useState(null);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // Reset when modal closes
  useEffect(() => {
    if (!open) {
      setStep(1);
      setErrors({});
      setForm({
        name: "",
        email: "",
        phone: "",
        address: "",
        county: "",
        plan: "basic",
      });
      setOwnerSearch("");
      setOwnerResults([]);
      setSelectedOwner(null);
      setCreatedTenant(null);
    }
  }, [open]);

  // Search users for owner assignment (unassigned users with no tenant)
  useEffect(() => {
    if (!ownerSearch.trim() || ownerSearch.length < 2) {
      setOwnerResults([]);
      return;
    }
    setOwnerLoading(true);
    // Fetch all profiles with no tenant (visitors) or any user
    fetchTenantProfiles(null, { limit: 50 })
      .then(({ data }) => {
        const q = ownerSearch.toLowerCase();
        const filtered = (data ?? []).filter(
          (u) =>
            (u.full_name?.toLowerCase().includes(q) ||
              u.email?.toLowerCase().includes(q)) &&
            u.role !== "super_admin",
        );
        setOwnerResults(filtered.slice(0, 8));
      })
      .finally(() => setOwnerLoading(false));
  }, [ownerSearch]);

  // Validate step 1
  const validateStep1 = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Property name is required.";
    if (form.email && !/\S+@\S+\.\S+/.test(form.email))
      e.email = "Invalid email.";
    return e;
  };

  // Handle step 1 → create tenant
  const handleCreate = async () => {
    const errs = validateStep1();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    const { data, error } = await createTenant({ ...form });
    setLoading(false);
    if (error) {
      toast.error(error.message ?? "Failed to create tenant.");
      return;
    }
    setCreatedTenant(data);
    toast.success(`Tenant "${data.name}" created!`);
    setStep(2);
  };

  // Handle step 2 — assign owner then finish
  const handleAssignAndFinish = async () => {
    if (!selectedOwner || !createdTenant) {
      handleFinish();
      return;
    }
    setLoading(true);
    const { error } = await assignUserToTenant(
      createdTenant.id,
      selectedOwner.id,
      "owner",
    );
    setLoading(false);
    if (error) {
      toast.error("Failed to assign owner.");
      return;
    }
    toast.success(`${selectedOwner.full_name} assigned as owner.`);
    handleFinish();
  };

  const handleFinish = () => {
    onCreated?.(createdTenant);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(4px)",
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: SURFACE,
          borderRadius: 20,
          border: `1px solid ${BORDER}`,
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: `1px solid ${BORDER}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: ACCENT,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                margin: "0 0 3px",
              }}
            >
              {step === 1 ? "New Tenant" : "Assign Owner"}
            </p>
            <h2
              style={{
                fontFamily: "'Playfair Display',serif",
                fontWeight: 900,
                fontSize: 20,
                color: TEXT,
                margin: 0,
              }}
            >
              {step === 1
                ? "Create Rental Business"
                : `${createdTenant?.name ?? "Tenant"} Created ✓`}
            </h2>
            {step === 2 && (
              <p style={{ fontSize: 12, color: MUTED, margin: "4px 0 0" }}>
                Optionally assign an owner account to this tenant.
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: MUTED,
              fontSize: 20,
              lineHeight: 1,
              padding: 4,
              marginTop: -2,
            }}
          >
            ×
          </button>
        </div>

        {/* Step indicators */}
        <div
          style={{
            padding: "12px 24px",
            borderBottom: `1px solid ${BORDER}`,
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          {[
            { n: 1, label: "Basic Info" },
            { n: 2, label: "Assign Owner" },
          ].map((s, i) => (
            <div
              key={s.n}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  fontSize: 11,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: s.n <= step ? ACCENT : "rgba(255,255,255,0.08)",
                  color: s.n <= step ? "#fff" : MUTED,
                  transition: "all 0.2s",
                }}
              >
                {s.n < step ? "✓" : s.n}
              </div>
              <span style={{ fontSize: 11, color: s.n <= step ? TEXT : MUTED }}>
                {s.label}
              </span>
              {i < 1 && (
                <div
                  style={{
                    width: 24,
                    height: 1.5,
                    background: step > 1 ? ACCENT : BORDER,
                    borderRadius: 999,
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: "22px 24px" }}>
          {/* ── STEP 1: Basic Info ── */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <Label required>Property / Business Name</Label>
                <TInput
                  value={form.name}
                  onChange={(e) => {
                    set("name", e.target.value);
                    setErrors((p) => ({ ...p, name: null }));
                  }}
                  placeholder="e.g. Sunrise Hostel"
                  error={errors.name}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div>
                  <Label>Email</Label>
                  <TInput
                    type="email"
                    value={form.email}
                    onChange={(e) => {
                      set("email", e.target.value);
                      setErrors((p) => ({ ...p, email: null }));
                    }}
                    placeholder="contact@business.co.ke"
                    error={errors.email}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <TInput
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="0712 345 678"
                  />
                </div>
              </div>

              <div>
                <Label>Address</Label>
                <TInput
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="Street address"
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div>
                  <Label>County</Label>
                  <TSelect
                    value={form.county}
                    onChange={(e) => set("county", e.target.value)}
                  >
                    <option value="">Select county…</option>
                    {KE_COUNTIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </TSelect>
                </div>
                <div>
                  <Label>Plan</Label>
                  <TSelect
                    value={form.plan}
                    onChange={(e) => set("plan", e.target.value)}
                  >
                    <option value="basic">Basic (Free)</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </TSelect>
                </div>
              </div>

              {/* Info note */}
              <div
                style={{
                  background: "rgba(197,97,44,0.08)",
                  border: `1px solid rgba(197,97,44,0.2)`,
                  borderRadius: 10,
                  padding: "10px 14px",
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    color: "rgba(197,97,44,0.9)",
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  The tenant will be created with <strong>pending</strong>{" "}
                  status. You can approve it from the tenants list, then assign
                  a manager through the tenant detail page.
                </p>
              </div>
            </div>
          )}

          {/* ── STEP 2: Assign Owner ── */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Success badge */}
              <div
                style={{
                  background: "rgba(16,185,129,0.08)",
                  border: "1px solid rgba(16,185,129,0.2)",
                  borderRadius: 10,
                  padding: "12px 14px",
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 20 }}>✅</span>
                <div>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#10B981",
                      margin: 0,
                    }}
                  >
                    {createdTenant?.name} created
                  </p>
                  <p style={{ fontSize: 11, color: MUTED, margin: "2px 0 0" }}>
                    Status: pending · Plan: {createdTenant?.plan}
                  </p>
                </div>
              </div>

              <div>
                <Label>Search for Owner Account</Label>
                <p style={{ fontSize: 11, color: MUTED, margin: "0 0 8px" }}>
                  Search by name or email. The selected user will be linked to
                  this tenant as Owner.
                </p>
                <TInput
                  value={ownerSearch}
                  onChange={(e) => setOwnerSearch(e.target.value)}
                  placeholder="Type name or email to search…"
                />
              </div>

              {/* Search results */}
              {ownerLoading && (
                <p
                  style={{
                    fontSize: 12,
                    color: MUTED,
                    textAlign: "center",
                    margin: 0,
                  }}
                >
                  Searching…
                </p>
              )}
              {!ownerLoading && ownerResults.length > 0 && (
                <div
                  style={{
                    border: `1px solid ${BORDER}`,
                    borderRadius: 10,
                    overflow: "hidden",
                  }}
                >
                  {ownerResults.map((u, i) => {
                    const selected = selectedOwner?.id === u.id;
                    return (
                      <div
                        key={u.id}
                        onClick={() => setSelectedOwner(selected ? null : u)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "10px 14px",
                          background: selected
                            ? "rgba(197,97,44,0.12)"
                            : "transparent",
                          borderBottom:
                            i < ownerResults.length - 1
                              ? `1px solid ${BORDER}`
                              : "none",
                          cursor: "pointer",
                          transition: "background 0.15s",
                        }}
                        onMouseOver={(e) => {
                          if (!selected)
                            e.currentTarget.style.background =
                              "rgba(255,255,255,0.04)";
                        }}
                        onMouseOut={(e) => {
                          if (!selected)
                            e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 9,
                            background: selected
                              ? ACCENT
                              : "rgba(255,255,255,0.08)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 13,
                            fontWeight: 700,
                            color: selected ? "#fff" : MUTED,
                            flexShrink: 0,
                          }}
                        >
                          {u.full_name?.charAt(0) ?? "?"}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: TEXT,
                              margin: 0,
                            }}
                          >
                            {u.full_name ?? "—"}
                          </p>
                          <p
                            style={{
                              fontSize: 11,
                              color: MUTED,
                              margin: "1px 0 0",
                            }}
                          >
                            {u.email} ·{" "}
                            <span style={{ textTransform: "capitalize" }}>
                              {u.role}
                            </span>
                          </p>
                        </div>
                        {selected && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: ACCENT,
                              background: "rgba(197,97,44,0.15)",
                              padding: "2px 8px",
                              borderRadius: 999,
                            }}
                          >
                            Selected
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedOwner && (
                <div
                  style={{
                    background: "rgba(197,97,44,0.08)",
                    border: `1px solid rgba(197,97,44,0.25)`,
                    borderRadius: 10,
                    padding: "10px 14px",
                  }}
                >
                  <p style={{ fontSize: 12, color: TEXT, margin: 0 }}>
                    <strong style={{ color: ACCENT }}>
                      {selectedOwner.full_name}
                    </strong>{" "}
                    will be assigned as
                    <strong> Owner</strong> of {createdTenant?.name}. Their role
                    will change from <em>{selectedOwner.role}</em> to{" "}
                    <strong>owner</strong>.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: `1px solid ${BORDER}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(0,0,0,0.2)",
          }}
        >
          <button
            onClick={step === 1 ? onClose : () => setStep(1)}
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: MUTED,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px 14px",
            }}
          >
            {step === 1 ? "Cancel" : "← Back"}
          </button>

          <div style={{ display: "flex", gap: 10 }}>
            {step === 2 && (
              <button
                onClick={handleFinish}
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: MUTED,
                  background: "rgba(255,255,255,0.06)",
                  border: `1px solid ${BORDER}`,
                  borderRadius: 9,
                  cursor: "pointer",
                  padding: "8px 16px",
                }}
              >
                Skip for now
              </button>
            )}
            <button
              onClick={step === 1 ? handleCreate : handleAssignAndFinish}
              disabled={loading}
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#fff",
                background: loading ? "rgba(197,97,44,0.5)" : ACCENT,
                border: "none",
                borderRadius: 9,
                cursor: loading ? "wait" : "pointer",
                padding: "9px 20px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "background 0.18s",
              }}
            >
              {loading && (
                <div
                  style={{
                    width: 14,
                    height: 14,
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                  }}
                />
              )}
              {step === 1
                ? "Create Tenant →"
                : selectedOwner
                  ? "Assign & Finish"
                  : "Finish"}
            </button>
          </div>
        </div>

        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

export default TenantFormModal;
