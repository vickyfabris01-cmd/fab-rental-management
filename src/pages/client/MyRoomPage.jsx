import { useState, useEffect } from "react";
import { useNavigate }         from "react-router-dom";

import DashboardLayout         from "../../layouts/DashboardLayout.jsx";
import PageHeader              from "../../components/layout/PageHeader.jsx";
import Badge                   from "../../components/ui/Badge.jsx";
import Button                  from "../../components/ui/Button.jsx";
import { Spinner }             from "../../components/ui/Spinner.jsx";
import { EmptyState }          from "../../components/ui/Spinner.jsx";
import { Alert }               from "../../components/ui/Alert.jsx";
import { TransferRequestModal } from "../../components/modals/TransferRequestModal.jsx";

import useAuthStore            from "../../store/authStore.js";
import { getMyTenancy }        from "../../lib/api/tenancies.js";
import { formatCurrency, formatDate } from "../../lib/formatters.js";

// =============================================================================
// MyRoomPage   /dashboard/room
// Shows the client's active room details, building, amenities, and tenancy info.
// =============================================================================

const AMENITY_ICONS = {
  WiFi:"📶", Water:"💧", Electricity:"⚡", Security:"🔒", Parking:"🚗",
  Gym:"🏋️", Laundry:"🧺", CCTV:"📷", "Study Room":"📚", Meals:"🍽️",
  Canteen:"☕", Rooftop:"🌇", Concierge:"🛎️", "Common Room":"🛋️", Furnished:"🛏️",
};

function InfoRow({ label, value, mono = false }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 0", borderBottom:"1px solid #F5EDE0" }}>
      <span style={{ fontSize:13, color:"#8B7355" }}>{label}</span>
      <span style={{ fontSize:13, fontWeight:600, color:"#1A1412", fontFamily: mono ? "'DM Mono','Courier New',monospace" : "inherit" }}>
        {value ?? "—"}
      </span>
    </div>
  );
}

export default function MyRoomPage() {
  const navigate   = useNavigate();
  const profile    = useAuthStore(s => s.profile);

  const [tenancy,       setTenancy]       = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [transferOpen,  setTransferOpen]  = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    getMyTenancy(profile.id)
      .then(({ data }) => setTenancy(data))
      .finally(() => setLoading(false));
  }, [profile?.id]);

  if (loading) return (
    <DashboardLayout pageTitle="My Room">
      <div style={{ display:"flex", justifyContent:"center", padding:80 }}><Spinner size="lg" /></div>
    </DashboardLayout>
  );

  if (!tenancy) return (
    <DashboardLayout pageTitle="My Room">
      <PageHeader title="My Room" subtitle="Your current room and tenancy details" />
      <EmptyState icon="home" title="No active tenancy"
        description="You don't have an active room assignment yet. Browse available properties and submit a request."
        action={<Button variant="primary" onClick={() => navigate("/browse")}>Browse Properties</Button>}
      />
    </DashboardLayout>
  );

  const room     = tenancy.rooms;
  const building = room?.buildings;
  const amenities = room?.amenities ?? [];

  return (
    <DashboardLayout pageTitle="My Room">
      <PageHeader
        title="My Room"
        subtitle="Your current room and tenancy details"
        actions={
          <Button variant="outline" onClick={() => setTransferOpen(true)}>
            Request Room Transfer
          </Button>
        }
      />

      <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:24, alignItems:"start" }}>

        {/* ── Left column ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

          {/* Room hero card */}
          <div style={{ background:"#fff", borderRadius:20, border:"1px solid #EDE4D8", overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>
            {/* Header band */}
            <div style={{ background:"linear-gradient(120deg,#1A1412 0%,#2D1E16 100%)", padding:"28px 28px 24px", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.45)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>
                  {building?.name ?? "Your Building"}
                </p>
                <h2 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:36, color:"#fff", margin:0 }}>
                  Room {room?.room_number ?? "—"}
                </h2>
                <p style={{ fontSize:14, color:"rgba(255,255,255,0.55)", margin:"6px 0 0", textTransform:"capitalize" }}>
                  {room?.room_type?.replace(/_/g," ")} · Capacity {room?.capacity ?? 1}
                </p>
              </div>
              <Badge variant="active" size="md">Active Tenancy</Badge>
            </div>

            <div style={{ padding:"24px 28px" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                <div>
                  <p style={{ fontSize:11, fontWeight:700, color:"#8B7355", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>Monthly Rent</p>
                  <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:26, color:"#C5612C", margin:0 }}>
                    {formatCurrency(tenancy.agreed_price)}<span style={{ fontSize:13, fontWeight:400, color:"#8B7355" }}>/mo</span>
                  </p>
                </div>
                <div>
                  <p style={{ fontSize:11, fontWeight:700, color:"#8B7355", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>Billing Type</p>
                  <p style={{ fontSize:16, fontWeight:700, color:"#1A1412", margin:0, textTransform:"capitalize" }}>
                    {tenancy.billing_type ?? "Monthly"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tenancy details */}
          <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", padding:"20px 24px" }}>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17, color:"#1A1412", marginBottom:4 }}>Tenancy Details</h3>
            <InfoRow label="Move-in Date"    value={formatDate(tenancy.move_in_date)} />
            <InfoRow label="Tenancy ID"      value={tenancy.id?.slice(0,8).toUpperCase()} mono />
            <InfoRow label="Status"          value={<Badge variant={tenancy.status} size="sm" />} />
            <InfoRow label="Room Number"     value={room?.room_number} />
            <InfoRow label="Building"        value={building?.name} />
            <InfoRow label="Agreed Rent"     value={formatCurrency(tenancy.agreed_price)} />
            <InfoRow label="Billing Type"    value={tenancy.billing_type} />
          </div>

          {/* Amenities */}
          {amenities.length > 0 && (
            <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", padding:"20px 24px" }}>
              <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17, color:"#1A1412", marginBottom:16 }}>Room Amenities</h3>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:10 }}>
                {amenities.map(a => (
                  <div key={a} style={{ display:"flex", alignItems:"center", gap:10, background:"#FAF7F2", border:"1px solid #EDE4D8", borderRadius:12, padding:"10px 14px" }}>
                    <span style={{ fontSize:18 }}>{AMENITY_ICONS[a] ?? "✓"}</span>
                    <span style={{ fontSize:13, fontWeight:500, color:"#1A1412" }}>{a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* Quick actions */}
          <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", padding:"20px" }}>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15, color:"#1A1412", marginBottom:14 }}>Quick Actions</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <Button variant="primary" fullWidth onClick={() => navigate("/dashboard/billing")}>
                Pay Rent
              </Button>
              <Button variant="secondary" fullWidth onClick={() => navigate("/dashboard/complaints")}>
                Submit Complaint
              </Button>
              <Button variant="ghost" fullWidth onClick={() => setTransferOpen(true)}>
                Request Transfer
              </Button>
            </div>
          </div>

          {/* Building info */}
          {building && (
            <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", padding:"20px" }}>
              <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15, color:"#1A1412", marginBottom:14 }}>Building Info</h3>
              <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
                <InfoRow label="Name"    value={building.name} />
                <InfoRow label="Address" value={building.address} />
              </div>
            </div>
          )}

          {/* Help */}
          <Alert type="info" compact
            message="For urgent maintenance issues, submit a complaint and mark it as High priority. The manager will be notified immediately."
          />
        </div>
      </div>

      <TransferRequestModal
        isOpen={transferOpen}
        onClose={() => setTransferOpen(false)}
        tenancy={tenancy}
        onSuccess={() => { setTransferOpen(false); navigate("/dashboard"); }}
      />

      <style>{`@media(max-width:900px){.room-grid{grid-template-columns:1fr!important}}`}</style>
    </DashboardLayout>
  );
}
