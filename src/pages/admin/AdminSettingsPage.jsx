import { useState } from "react";

import AdminLayout  from "../../layouts/AdminLayout.jsx";
import Input        from "../../components/ui/Input.jsx";
import Button       from "../../components/ui/Button.jsx";
import { Toggle }   from "../../components/ui/TextArea.jsx";
import { Alert }    from "../../components/ui/Alert.jsx";
import { useToast } from "../../hooks/useNotifications.js";

// =============================================================================
// AdminSettingsPage  /admin/settings
// Platform-level configuration: status flags, email, billing defaults.
// Settings are stored on the FastAPI backend as environment config + DB rows.
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

function SettingRow({ label, sub, control }) {
  return (
    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",
      padding:"13px 0",borderBottom:`1px solid ${B}` }}>
      <div>
        <p style={{ fontSize:13,fontWeight:600,color:TX,margin:0 }}>{label}</p>
        {sub && <p style={{ fontSize:11,color:MU,margin:"2px 0 0",lineHeight:1.5 }}>{sub}</p>}
      </div>
      <div style={{ flexShrink:0,marginLeft:24 }}>{control}</div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const toast = useToast();

  // Platform status
  const [maintenanceMode,    setMaintenanceMode]    = useState(false);
  const [registrationsOpen,  setRegistrationsOpen]  = useState(true);
  const [autoApprove,        setAutoApprove]        = useState(false);
  const [requireEmailVerify, setRequireEmailVerify] = useState(true);

  // Email config
  const [smtpHost,  setSmtpHost]  = useState("");
  const [smtpPort,  setSmtpPort]  = useState("587");
  const [fromEmail, setFromEmail] = useState("noreply@fabrentals.co.ke");
  const [fromName,  setFromName]  = useState("fabrentals");

  // Billing defaults
  const [billingDay,    setBillingDay]    = useState("1");
  const [gracePeriod,   setGracePeriod]   = useState("5");
  const [lateFee,       setLateFee]       = useState("500");
  const [currency,      setCurrency]      = useState("KES");

  // Security
  const [sessionTimeout,   setSessionTimeout]   = useState("8");
  const [maxLoginAttempts, setMaxLoginAttempts] = useState("5");

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // In production this would call PATCH /admin/settings on FastAPI
    await new Promise(r => setTimeout(r, 700));
    setSaving(false);
    toast.success("Platform settings saved.");
  };

  return (
    <AdminLayout>
      <div style={{ marginBottom:20 }}>
        <p style={{ fontSize:10,fontWeight:700,color:AC,textTransform:"uppercase",letterSpacing:"0.1em",margin:"0 0 3px" }}>System</p>
        <h1 style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:24,color:TX,margin:0 }}>
          Platform Settings
        </h1>
      </div>

      {/* Platform status */}
      <Section title="Platform Status" subtitle="Control global platform behaviour and access.">
        <SettingRow
          label="Maintenance Mode"
          sub="Blocks all logins and shows a maintenance page to users."
          control={<Toggle checked={maintenanceMode} onChange={setMaintenanceMode} />}
        />
        <SettingRow
          label="Open Registrations"
          sub="Allow new property owners to register on the platform."
          control={<Toggle checked={registrationsOpen} onChange={setRegistrationsOpen} />}
        />
        <SettingRow
          label="Auto-approve Tenants"
          sub="Automatically activate new tenant accounts without manual review."
          control={<Toggle checked={autoApprove} onChange={setAutoApprove} />}
        />
        <SettingRow
          label="Require Email Verification"
          sub="Users must verify their email before logging in."
          control={<Toggle checked={requireEmailVerify} onChange={setRequireEmailVerify} />}
        />
      </Section>

      {/* Email config */}
      <Section
        title="Email Configuration"
        subtitle="Transactional email settings. Credentials are stored server-side — entering them here updates the FastAPI environment.">
        <Alert type="info" compact
          message="SMTP credentials are stored as environment variables on the FastAPI backend, not in Supabase."
          style={{ marginBottom:16 }}
        />
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
          <Input label="SMTP Host"   placeholder="smtp.sendgrid.net"   value={smtpHost}  onChange={e=>setSmtpHost(e.target.value)} />
          <Input label="SMTP Port"   type="number" placeholder="587"    value={smtpPort}  onChange={e=>setSmtpPort(e.target.value)} />
          <Input label="From Email"  type="email"  placeholder="noreply@fabrentals.co.ke" value={fromEmail} onChange={e=>setFromEmail(e.target.value)} />
          <Input label="From Name"   placeholder="fabrentals"           value={fromName}  onChange={e=>setFromName(e.target.value)} />
        </div>
      </Section>

      {/* Billing defaults */}
      <Section
        title="Billing Defaults"
        subtitle="These defaults are applied to newly created tenant accounts. Existing tenants keep their own settings.">
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
          <Input label="Default Billing Day"       type="number" min="1" max="28" placeholder="1"
            value={billingDay}  onChange={e=>setBillingDay(e.target.value)}
            helper="Day of month rent is due (1–28)" />
          <Input label="Default Grace Period (days)" type="number" min="0" placeholder="5"
            value={gracePeriod} onChange={e=>setGracePeriod(e.target.value)}
            helper="Days before late fee applies" />
          <Input label="Default Late Fee (KES)"    type="number" min="0" placeholder="500"
            value={lateFee}     onChange={e=>setLateFee(e.target.value)}
            helper="Added to cycle after grace period" />
          <Input label="Platform Currency"         placeholder="KES"
            value={currency}    onChange={e=>setCurrency(e.target.value)}
            helper="ISO 4217 currency code" />
        </div>
      </Section>

      {/* Security */}
      <Section title="Security" subtitle="Session and authentication security settings.">
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
          <Input label="Session Timeout (hours)" type="number" min="1" max="720"
            value={sessionTimeout}   onChange={e=>setSessionTimeout(e.target.value)}
            helper="Inactive sessions expire after this duration" />
          <Input label="Max Login Attempts" type="number" min="3" max="20"
            value={maxLoginAttempts} onChange={e=>setMaxLoginAttempts(e.target.value)}
            helper="Account locked after this many failures" />
        </div>
      </Section>

      {/* Save */}
      <div style={{ display:"flex",justifyContent:"flex-end",marginTop:4 }}>
        <Button variant="primary" loading={saving} onClick={handleSave}>
          Save All Settings
        </Button>
      </div>
    </AdminLayout>
  );
}
