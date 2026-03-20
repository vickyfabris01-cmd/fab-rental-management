import { useState, useEffect } from "react";

import DashboardLayout   from "../../layouts/DashboardLayout.jsx";
import PageHeader        from "../../components/layout/PageHeader.jsx";
import Input             from "../../components/ui/Input.jsx";
import Button            from "../../components/ui/Button.jsx";
import { Toggle }        from "../../components/ui/TextArea.jsx";
import { Alert }         from "../../components/ui/Alert.jsx";
import { Spinner }       from "../../components/ui/Spinner.jsx";
import InviteManagerModal from "../../components/modals/InviteManagerModal.jsx";

import useAuthStore      from "../../store/authStore.js";
import useTenantStore    from "../../store/tenantStore.js";
import { useToast }      from "../../hooks/useNotifications.js";

// =============================================================================
// ManagerSettingsPage  /manage/settings
//
// Sections: Property Info · Billing Defaults · Notifications · Team
// =============================================================================

function Section({ title, subtitle, children }) {
  return (
    <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", overflow:"hidden" }}>
      <div style={{ padding:"20px 24px 0" }}>
        <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17, color:"#1A1412", margin:"0 0 4px" }}>{title}</h3>
        {subtitle && <p style={{ fontSize:13, color:"#8B7355", margin:"0 0 18px" }}>{subtitle}</p>}
      </div>
      <div style={{ padding:"0 24px 24px" }}>{children}</div>
    </div>
  );
}

function Divider() {
  return <div style={{ height:1, background:"#F5EDE0", margin:"16px 0" }}/>;
}

export default function ManagerSettingsPage() {
  const profile    = useAuthStore(s => s.profile);
  const tenant     = useTenantStore(s => s.tenant);
  const toast      = useToast();

  const [propName,   setPropName]   = useState(tenant?.name ?? "");
  const [propPhone,  setPropPhone]  = useState(tenant?.phone ?? "");
  const [propEmail,  setPropEmail]  = useState(tenant?.email ?? "");
  const [propAddr,   setPropAddr]   = useState(tenant?.address ?? "");
  const [propSaving, setPropSaving] = useState(false);

  const [lateFee,    setLateFee]    = useState(String(tenant?.late_fee_amount ?? "500"));
  const [graceDays,  setGraceDays]  = useState(String(tenant?.grace_period_days ?? "5"));
  const [billDay,    setBillDay]    = useState(String(tenant?.billing_day ?? "1"));
  const [billSaving, setBillSaving] = useState(false);

  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSMS,   setNotifSMS]   = useState(false);
  const [notifSaving,setNotifSaving]= useState(false);

  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    if (tenant) {
      setPropName(tenant.name ?? "");
      setPropPhone(tenant.phone ?? "");
      setPropEmail(tenant.email ?? "");
      setPropAddr(tenant.address ?? "");
      setLateFee(String(tenant.late_fee_amount ?? "500"));
      setGraceDays(String(tenant.grace_period_days ?? "5"));
      setBillDay(String(tenant.billing_day ?? "1"));
    }
  }, [tenant?.id]);

  const handleSaveProperty = async () => {
    setPropSaving(true);
    // In a real implementation this calls updateTenant(tenant.id, {...})
    await new Promise(r => setTimeout(r, 600));
    setPropSaving(false);
    toast.success("Property info saved.");
  };

  const handleSaveBilling = async () => {
    setBillSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setBillSaving(false);
    toast.success("Billing settings saved.");
  };

  const handleSaveNotifs = async () => {
    setNotifSaving(true);
    await new Promise(r => setTimeout(r, 400));
    setNotifSaving(false);
    toast.success("Notification preferences saved.");
  };

  return (
    <DashboardLayout pageTitle="Settings">
      <PageHeader title="Settings" subtitle="Manage your property and account preferences" />

      <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

        {/* Property info */}
        <Section title="Property Information" subtitle="Update the public details about your property.">
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <Input label="Property Name" value={propName} onChange={e=>setPropName(e.target.value)} />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <Input label="Contact Phone" type="tel" value={propPhone} onChange={e=>setPropPhone(e.target.value)} />
              <Input label="Contact Email" type="email" value={propEmail} onChange={e=>setPropEmail(e.target.value)} />
            </div>
            <Input label="Address" value={propAddr} onChange={e=>setPropAddr(e.target.value)} />
            <div style={{ display:"flex", justifyContent:"flex-end" }}>
              <Button variant="primary" loading={propSaving} onClick={handleSaveProperty}>Save Property Info</Button>
            </div>
          </div>
        </Section>

        {/* Billing defaults */}
        <Section title="Billing Defaults" subtitle="Configure how billing cycles are generated for all new tenancies.">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
            <Input label="Billing Day of Month" type="number" min="1" max="28"
              value={billDay} onChange={e=>setBillDay(e.target.value)}
              helper="Day rent is due each month" />
            <Input label="Grace Period (days)" type="number" min="0" max="30"
              value={graceDays} onChange={e=>setGraceDays(e.target.value)}
              helper="Days before late fee applies" />
            <Input label="Late Fee Amount (KES)" type="number" min="0"
              value={lateFee} onChange={e=>setLateFee(e.target.value)}
              helper="Added after grace period" />
          </div>
          <Alert type="info" compact message="These defaults apply to new tenancies only. Existing cycles are not affected." style={{ marginTop:14 }} />
          <div style={{ display:"flex", justifyContent:"flex-end", marginTop:16 }}>
            <Button variant="primary" loading={billSaving} onClick={handleSaveBilling}>Save Billing Settings</Button>
          </div>
        </Section>

        {/* Notifications */}
        <Section title="Notification Channels" subtitle="Choose how residents receive notifications.">
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <p style={{ fontSize:14, fontWeight:600, color:"#1A1412", margin:0 }}>Email Notifications</p>
                <p style={{ fontSize:12, color:"#8B7355", margin:"2px 0 0" }}>Send billing reminders and updates by email</p>
              </div>
              <Toggle checked={notifEmail} onChange={setNotifEmail} />
            </div>
            <Divider />
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <p style={{ fontSize:14, fontWeight:600, color:"#1A1412", margin:0 }}>SMS Notifications</p>
                <p style={{ fontSize:12, color:"#8B7355", margin:"2px 0 0" }}>Send SMS to resident phone numbers</p>
              </div>
              <Toggle checked={notifSMS} onChange={setNotifSMS} />
            </div>
          </div>
          <div style={{ display:"flex", justifyContent:"flex-end", marginTop:16 }}>
            <Button variant="secondary" loading={notifSaving} onClick={handleSaveNotifs}>Save Preferences</Button>
          </div>
        </Section>

        {/* Team */}
        <Section title="Team & Access" subtitle="Invite additional managers to help manage this property.">
          <p style={{ fontSize:13, color:"#5C4A3A", lineHeight:1.65, margin:"0 0 16px" }}>
            Managers have full access to residents, billing, workforce, and complaints. They do not have access to owner financials or property ownership settings.
          </p>
          <Button variant="primary" onClick={() => setInviteOpen(true)}>+ Invite a Manager</Button>
        </Section>

      </div>

      <InviteManagerModal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} onSuccess={() => setInviteOpen(false)} />
    </DashboardLayout>
  );
}
