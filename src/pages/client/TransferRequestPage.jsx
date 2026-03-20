import { useState, useEffect } from "react";

import DashboardLayout       from "../../layouts/DashboardLayout.jsx";
import PageHeader            from "../../components/layout/PageHeader.jsx";
import Badge                 from "../../components/ui/Badge.jsx";
import Button                from "../../components/ui/Button.jsx";
import { Spinner }           from "../../components/ui/Spinner.jsx";
import { EmptyState }        from "../../components/ui/Spinner.jsx";
import { Alert }             from "../../components/ui/Alert.jsx";
import { TransferRequestModal } from "../../components/modals/TransferRequestModal.jsx";

import useAuthStore          from "../../store/authStore.js";
import { getMyTenancy, getTransfers } from "../../lib/api/tenancies.js";
import { formatDate, formatCurrency } from "../../lib/formatters.js";

// =============================================================================
// TransferRequestPage   /dashboard/transfer-request
// =============================================================================

const STATUS_META = {
  pending:   { label:"Pending Review",  color:"#D97706", bg:"#FFFBEB" },
  approved:  { label:"Approved",        color:"#059669", bg:"#ECFDF5" },
  rejected:  { label:"Declined",        color:"#DC2626", bg:"#FEF2F2" },
  completed: { label:"Completed",       color:"#5C4A3A", bg:"#F5EDE0" },
};

function TransferCard({ transfer }) {
  const meta = STATUS_META[transfer.status] ?? STATUS_META.pending;
  return (
    <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", padding:"18px 20px", boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
        <div>
          <p style={{ fontSize:12, color:"#8B7355", margin:"0 0 4px" }}>Transfer Request</p>
          <p style={{ fontSize:14, fontWeight:700, color:"#1A1412", margin:0 }}>
            {formatDate(transfer.created_at)}
          </p>
        </div>
        <span style={{ fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:999, background:meta.bg, color:meta.color }}>
          {meta.label}
        </span>
      </div>

      {/* From → To */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", alignItems:"center", gap:12, marginBottom:14 }}>
        <div style={{ background:"#FAF7F2", border:"1px solid #EDE4D8", borderRadius:12, padding:"12px 14px", textAlign:"center" }}>
          <p style={{ fontSize:11, color:"#8B7355", margin:"0 0 4px" }}>From</p>
          <p style={{ fontSize:16, fontWeight:700, color:"#1A1412", margin:0 }}>
            Room {transfer.from_room?.room_number ?? "—"}
          </p>
          <p style={{ fontSize:11, color:"#8B7355", margin:"2px 0 0" }}>{transfer.from_room?.buildings?.name}</p>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C5612C" strokeWidth="2" strokeLinecap="round">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
        <div style={{ background:"#FFF5EF", border:"1px solid rgba(197,97,44,0.25)", borderRadius:12, padding:"12px 14px", textAlign:"center" }}>
          <p style={{ fontSize:11, color:"#8B7355", margin:"0 0 4px" }}>To</p>
          <p style={{ fontSize:16, fontWeight:700, color:"#C5612C", margin:0 }}>
            Room {transfer.to_room?.room_number ?? "—"}
          </p>
          <p style={{ fontSize:11, color:"#8B7355", margin:"2px 0 0" }}>{transfer.to_room?.buildings?.name}</p>
        </div>
      </div>

      {/* Details */}
      <div style={{ display:"flex", flexDirection:"column", gap:6, paddingTop:12, borderTop:"1px solid #F5EDE0" }}>
        {transfer.transfer_date && (
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontSize:12, color:"#8B7355" }}>Preferred date</span>
            <span style={{ fontSize:12, fontWeight:600, color:"#1A1412" }}>{formatDate(transfer.transfer_date)}</span>
          </div>
        )}
        {transfer.reason && (
          <p style={{ fontSize:13, color:"#5C4A3A", margin:0, lineHeight:1.55, background:"#FAF7F2", borderRadius:8, padding:"8px 12px" }}>
            {transfer.reason}
          </p>
        )}
      </div>
    </div>
  );
}

export default function TransferRequestPage() {
  const profile  = useAuthStore(s => s.profile);

  const [tenancy,      setTenancy]      = useState(null);
  const [transfers,    setTransfers]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [modalOpen,    setModalOpen]    = useState(false);

  const loadData = () => {
    if (!profile?.id) return;
    Promise.all([
      getMyTenancy(profile.id),
      getTransfers(profile.id, { limit: 20 }),
    ]).then(([{ data: t }, { data: tr }]) => {
      setTenancy(t);
      setTransfers(tr ?? []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [profile?.id]);

  const hasPending = transfers.some(t => t.status === "pending");

  if (loading) return (
    <DashboardLayout pageTitle="Room Transfer">
      <div style={{ display:"flex", justifyContent:"center", padding:80 }}><Spinner size="lg"/></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout pageTitle="Room Transfer">
      <PageHeader
        title="Room Transfer"
        subtitle="Request to move to a different room in the same property"
        actions={
          tenancy && !hasPending && (
            <Button variant="primary" onClick={() => setModalOpen(true)}>
              + New Transfer Request
            </Button>
          )
        }
      />

      {!tenancy && (
        <EmptyState icon="transfer" title="No active tenancy"
          description="You need an active room assignment before requesting a transfer."
        />
      )}

      {tenancy && hasPending && (
        <Alert type="info" title="Request under review"
          message="Your transfer request is being reviewed by the property manager. You'll be notified once a decision is made."
          style={{ marginBottom:20 }}
        />
      )}

      {tenancy && !hasPending && transfers.length === 0 && (
        <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", marginBottom:24 }}>
          <EmptyState icon="transfer" title="No transfer requests"
            description="You can request to move to a different available room within the same property."
            action={<Button variant="primary" onClick={() => setModalOpen(true)}>Request Room Transfer</Button>}
          />
        </div>
      )}

      {/* How it works */}
      {transfers.length === 0 && tenancy && (
        <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", padding:"24px 28px", marginBottom:24 }}>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17, color:"#1A1412", marginBottom:16 }}>How Room Transfer Works</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {[
              ["1", "Submit a request", "Choose a new available room and provide a reason for the transfer."],
              ["2", "Manager reviews",  "The property manager will review your request within 24–48 hours."],
              ["3", "Get notified",     "You'll receive an in-app notification and email with the decision."],
              ["4", "Move to new room", "On the approved date, collect keys to your new room from the manager."],
            ].map(([n,title,desc]) => (
              <div key={n} style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
                <div style={{ width:28, height:28, borderRadius:"50%", background:"#C5612C", color:"#fff", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{n}</div>
                <div>
                  <p style={{ fontSize:14, fontWeight:700, color:"#1A1412", margin:"0 0 2px" }}>{title}</p>
                  <p style={{ fontSize:13, color:"#5C4A3A", margin:0, lineHeight:1.55 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transfer history */}
      {transfers.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17, color:"#1A1412", margin:0 }}>Transfer History</h3>
          {transfers.map(t => <TransferCard key={t.id} transfer={t} />)}
        </div>
      )}

      <TransferRequestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        tenancy={tenancy}
        onSuccess={() => { setModalOpen(false); loadData(); }}
      />
    </DashboardLayout>
  );
}
