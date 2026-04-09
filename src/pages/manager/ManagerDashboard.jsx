import { useState, useEffect } from "react";
import {  useNavigate, Link, useLocation } from "react-router-dom";

import DashboardLayout      from "../../layouts/DashboardLayout.jsx";
import PageHeader           from "../../components/layout/PageHeader.jsx";
import StatsCard            from "../../components/data/StatsCard.jsx";
import Badge                from "../../components/ui/Badge.jsx";
import Avatar               from "../../components/ui/Avatar.jsx";
import Button               from "../../components/ui/Button.jsx";
import { Spinner }          from "../../components/ui/Spinner.jsx";
import ManualPaymentModal   from "../../components/modals/ManualPaymentModal.jsx";
import RoomFormModal        from "../../components/modals/RoomFormModal.jsx";

import { WidgetErrorBoundary } from "../../components/feedback/ErrorBoundary.jsx";
import useAuthStore         from "../../store/authStore.js";
import { getBuildings, getRooms, getRoomOccupancySummary } from "../../lib/api/rooms.js";
import { getRequests, getPendingRequestCount } from "../../lib/api/rentalRequests.js";
import { getBillingCycles, getBillingSummary }  from "../../lib/api/billing.js";
import { getPayments }      from "../../lib/api/payments.js";
import { getComplaints, getOpenComplaintsCount } from "../../lib/api/complaints.js";
import { formatCurrency, formatDate, formatRelativeTime } from "../../lib/formatters.js";

// =============================================================================
// ManagerDashboard  /manage
// =============================================================================

const Ic = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

function Card({ children, style: x = {} }) {
  return (
    <div style={{ background:"#fff", borderRadius:20, border:"1px solid #EDE4D8", boxShadow:"0 2px 8px rgba(0,0,0,0.04)", overflow:"hidden", ...x }}>
      {children}
    </div>
  );
}

function SectionHead({ label, title, linkTo, linkLabel = "View all", onAction, actionLabel }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", padding:"18px 20px 0" }}>
      <div>
        <p style={{ fontSize:10, fontWeight:700, color:"#C5612C", textTransform:"uppercase", letterSpacing:"0.1em", margin:"0 0 3px" }}>{label}</p>
        <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17, color:"#1A1412", margin:0 }}>{title}</h3>
      </div>
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        {onAction && (
          <button onClick={onAction} style={{ width:28, height:28, borderRadius:"50%", background:"#C5612C", border:"none", cursor:"pointer", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          </button>
        )}
        {linkTo && (
          <Link to={linkTo} style={{ fontSize:12, color:"#C5612C", fontWeight:600, textDecoration:"none", display:"flex", alignItems:"center", gap:3 }}>
            {linkLabel}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
          </Link>
        )}
      </div>
    </div>
  );
}

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const profile  = useAuthStore(s => s.profile);
  const tenantId = profile?.tenant_id;

  const [buildings,      setBuildings]      = useState([]);
  const [rooms,          setRooms]          = useState([]);
  const [requests,       setRequests]       = useState([]);
  const [overdueCycles,  setOverdueCycles]  = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [openComplaints, setOpenComplaints] = useState([]);
  const [summary,        setSummary]        = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [payModalCycle,  setPayModalCycle]  = useState(null);
  const [addRoomOpen,    setAddRoomOpen]    = useState(false);

  const load = () => {
    if (!tenantId) return;
    Promise.all([
      getBuildings(tenantId),
      getRooms(tenantId, { limit: 8 }),
      getRequests(tenantId, { status: "pending", limit: 5 }),
      getBillingCycles(tenantId, { status: "overdue", limit: 4 }),
      getPayments(tenantId, { limit: 5 }),
      getComplaints(tenantId, { status: "open", limit: 5 }),
      getBillingSummary(tenantId),
    ]).then(([
      { data: b }, { data: r }, { data: req },
      { data: od }, { data: pay }, { data: comp },
      { data: sum },
    ]) => {
      setBuildings(b ?? []);
      setRooms(r ?? []);
      setRequests(req ?? []);
      setOverdueCycles(od ?? []);
      setRecentPayments(pay ?? []);
      setOpenComplaints(comp ?? []);
      setSummary(sum);
    }).finally(() => setLoading(false));
  };

  // Initial load
  useEffect(() => { load(); }, [tenantId]);

  // Refresh when user returns to this tab — catches stale requests after
  // approving a move-in from the Requests page
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [tenantId]);

  // Derived stats
  const totalRooms   = rooms.length;
  const occupied     = rooms.filter(r => r.status === "occupied").length;
  const available    = rooms.filter(r => r.status === "available").length;
  const occupancyPct = totalRooms ? Math.round((occupied / totalRooms) * 100) : 0;

  const firstName = profile?.full_name?.split(" ")[0] ?? "Manager";

  if (loading) return (
    <DashboardLayout pageTitle="Dashboard">
      <div style={{ display:"flex", justifyContent:"center", padding:80 }}><Spinner size="lg"/></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout pageTitle="Dashboard">
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .fu1{animation:fadeUp 0.4s 0.04s ease both} .fu2{animation:fadeUp 0.4s 0.10s ease both}
        .fu3{animation:fadeUp 0.4s 0.16s ease both} .fu4{animation:fadeUp 0.4s 0.22s ease both}
        .fu5{animation:fadeUp 0.4s 0.28s ease both}
        @media(max-width:900px){.mgr-grid{grid-template-columns:1fr!important}}
      `}</style>

      {/* ── Greeting ── */}
      <div className="fu1" style={{ background:"linear-gradient(120deg,#1A1412 0%,#2D1E16 60%,#3D2318 100%)", borderRadius:20, padding:"24px 28px", marginBottom:24, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:14 }}>
        <div>
          <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.4)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>
            {new Date().toLocaleDateString("en-KE",{ weekday:"long", day:"numeric", month:"long" })}
          </p>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"clamp(20px,2.8vw,28px)", color:"#fff", margin:"0 0 4px" }}>
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {firstName}
          </h1>
          <p style={{ fontSize:13, color:"rgba(255,255,255,0.5)", margin:0 }}>
            {occupancyPct}% occupancy · {requests.length} pending request{requests.length !== 1 ? "s" : ""} · {overdueCycles.length} overdue payment{overdueCycles.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <Button variant="outline" style={{ borderColor:"rgba(255,255,255,0.3)", color:"#fff" }}
            onClick={() => setAddRoomOpen(true)}>
            + Add Room
          </Button>
          <Button variant="primary" onClick={() => navigate("/manage/residents/requests")}>
            View Requests {requests.length > 0 && <span style={{ marginLeft:4, background:"rgba(255,255,255,0.25)", borderRadius:999, padding:"1px 6px", fontSize:11 }}>{requests.length}</span>}
          </Button>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="fu2" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))", gap:16, marginBottom:24 }}>
        <StatsCard label="Occupancy" value={`${occupancyPct}%`} sublabel={`${occupied} / ${totalRooms} rooms`} color={occupancyPct >= 80 ? "success" : occupancyPct >= 60 ? "warning" : "error"}
          icon={<Ic d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>}
          onClick={() => navigate("/manage/properties")} />
        <StatsCard label="Pending Requests" value={requests.length} sublabel="Awaiting approval" color={requests.length > 0 ? "warning" : "neutral"}
          icon={<Ic d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5h6"/>}
          onClick={() => navigate("/manage/residents/requests")} />
        <StatsCard label="Overdue Payments" value={overdueCycles.length} sublabel={overdueCycles.length > 0 ? formatCurrency(overdueCycles.reduce((s,c)=>s+Number(c.amount_due)+Number(c.late_fee??0),0)) : "All clear"} color={overdueCycles.length > 0 ? "error" : "success"}
          icon={<Ic d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6"/>}
          onClick={() => navigate("/manage/billing")} />
        <StatsCard label="Open Complaints" value={openComplaints.length} sublabel="Needs attention" color={openComplaints.length > 0 ? "warning" : "success"}
          icon={<Ic d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>}
          onClick={() => navigate("/manage/complaints")} />
        {summary && (
          <StatsCard label="Collected (Month)" value={formatCurrency(summary.totalPaid ?? 0)} sublabel={`vs ${formatCurrency(summary.totalBilled ?? 0)} billed`} color="success"
            icon={<Ic d="M2 7h20v13a1 1 0 01-1 1H3a1 1 0 01-1-1V7zm0 0l2-4h16l2 4"/>}
            onClick={() => navigate("/manage/billing")} />
        )}
      </div>

      {/* ── Row 2: Buildings + Pending Requests ── */}
      <div className="fu3 mgr-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>

        {/* Buildings occupancy */}
        <Card>
          <SectionHead label="Properties" title="Building Overview" linkTo="/manage/properties" />
          <div style={{ padding:"14px 20px" }}>
            {buildings.length === 0 ? (
              <p style={{ fontSize:13, color:"#8B7355", padding:"12px 0" }}>No buildings yet.</p>
            ) : buildings.map(b => {
              const bRooms    = rooms.filter(r => r.buildings?.id === b.id || r.buildings?.name === b.name);
              const bOccupied = bRooms.filter(r => r.status === "occupied").length;
              const bTotal    = bRooms.length || 1;
              const pct       = Math.round((bOccupied / bTotal) * 100);
              return (
                <div key={b.id} style={{ marginBottom:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                    <span style={{ fontSize:13, fontWeight:600, color:"#1A1412" }}>{b.name}</span>
                    <span style={{ fontSize:12, color:"#8B7355" }}>{bOccupied}/{bTotal} · {pct}%</span>
                  </div>
                  <div style={{ height:7, borderRadius:999, background:"#F5EDE0", overflow:"hidden" }}>
                    <div style={{ height:"100%", borderRadius:999, width:`${pct}%`, background: pct >= 80 ? "#10B981" : pct >= 60 ? "#F59E0B" : "#EF4444", transition:"width 0.6s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Pending requests */}
        <Card>
          <SectionHead label="Residents" title="Pending Requests" linkTo="/manage/residents/requests" />
          <div style={{ paddingTop:12 }}>
            {requests.length === 0 ? (
              <p style={{ fontSize:13, color:"#8B7355", textAlign:"center", padding:"24px 20px" }}>No pending requests.</p>
            ) : requests.map(req => (
              <div key={req.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 20px", borderBottom:"1px solid #F5EDE0", cursor:"pointer" }}
                onClick={() => navigate("/manage/residents/requests")}
                onMouseOver={e => e.currentTarget.style.background = "#FFFAF6"}
                onMouseOut={e  => e.currentTarget.style.background = "transparent"}
              >
                <Avatar name={req.profiles?.full_name} src={req.profiles?.avatar_url} size="sm" />
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:13, fontWeight:600, color:"#1A1412", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {req.profiles?.full_name ?? "Unknown"}
                  </p>
                  <p style={{ fontSize:11, color:"#8B7355", margin:"2px 0 0" }}>
                    Room {req.rooms?.room_number} · {formatRelativeTime(req.created_at)}
                  </p>
                </div>
                <Badge variant="pending" size="sm" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Row 3: Overdue + Recent Payments + Complaints ── */}
      <div className="fu4 mgr-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:20, marginBottom:20 }}>

        {/* Overdue payments */}
        <Card>
          <SectionHead label="Billing" title="Overdue Payments" linkTo="/manage/billing" />
          <div style={{ paddingTop:12 }}>
            {overdueCycles.length === 0 ? (
              <p style={{ fontSize:13, color:"#8B7355", textAlign:"center", padding:"24px 20px" }}>No overdue payments 🎉</p>
            ) : overdueCycles.map(c => (
              <div key={c.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 20px", borderBottom:"1px solid #F5EDE0", background:"#FFFCFC" }}>
                <Avatar name={c.submitter?.full_name} src={c.submitter?.avatar_url} size="sm" />
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:12, fontWeight:600, color:"#1A1412", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {c.submitter?.full_name ?? "—"}
                  </p>
                  <p style={{ fontSize:11, color:"#8B7355", margin:"1px 0 0" }}>Rm {c.rooms?.room_number}</p>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <p style={{ fontSize:12, fontWeight:700, color:"#DC2626", margin:0 }}>
                    {formatCurrency(Number(c.amount_due) + Number(c.late_fee ?? 0))}
                  </p>
                  <button onClick={() => setPayModalCycle(c)}
                    style={{ fontSize:10, color:"#C5612C", fontWeight:700, background:"none", border:"none", cursor:"pointer", padding:0, marginTop:2 }}>
                    Record →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent payments */}
        <Card>
          <SectionHead label="Incoming" title="Recent Payments" linkTo="/manage/billing/payments" onAction={() => setPayModalCycle({})} />
          <div style={{ paddingTop:12 }}>
            {recentPayments.length === 0 ? (
              <p style={{ fontSize:13, color:"#8B7355", textAlign:"center", padding:"24px 20px" }}>No payments yet today.</p>
            ) : recentPayments.map(p => (
              <div key={p.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 20px", borderBottom:"1px solid #F5EDE0" }}>
                <Avatar name={p.client?.full_name} src={p.client?.avatar_url} size="sm" />
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:12, fontWeight:600, color:"#1A1412", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {p.client?.full_name ?? "—"}
                  </p>
                  <p style={{ fontSize:11, color:"#8B7355", margin:"1px 0 0" }}>
                    {p.payment_method === "mpesa" ? "M-Pesa" : p.payment_method === "cash" ? "Cash" : "Bank"} · {formatRelativeTime(p.created_at)}
                  </p>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <p style={{ fontSize:12, fontWeight:700, color:"#10B981", margin:0, fontFamily:"'Playfair Display',serif" }}>
                    +{formatCurrency(p.amount)}
                  </p>
                  {p.mpesa_receipt && (
                    <p style={{ fontSize:10, color:"#8B7355", fontFamily:"'DM Mono','Courier New',monospace", margin:0 }}>{p.mpesa_receipt}</p>
                  )}
                </div>
              </div>
            ))}
            {recentPayments.length > 0 && (
              <div style={{ padding:"10px 20px", background:"#FAF7F2", borderTop:"1px solid #EDE4D8", display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:12, color:"#8B7355" }}>Today's collections</span>
                <span style={{ fontSize:13, fontWeight:700, color:"#1A1412", fontFamily:"'Playfair Display',serif" }}>
                  {formatCurrency(recentPayments.filter(p=>p.payment_status==="confirmed").reduce((s,p)=>s+Number(p.amount),0))}
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Open complaints */}
        <Card>
          <SectionHead label="Support" title="Open Complaints" linkTo="/manage/complaints" />
          <div style={{ paddingTop:12 }}>
            {openComplaints.length === 0 ? (
              <p style={{ fontSize:13, color:"#8B7355", textAlign:"center", padding:"24px 20px" }}>No open complaints 👍</p>
            ) : openComplaints.map(c => (
              <div key={c.id} style={{ padding:"10px 20px", borderBottom:"1px solid #F5EDE0", cursor:"pointer" }}
                onClick={() => navigate("/manage/complaints")}
                onMouseOver={e => e.currentTarget.style.background = "#FFFAF6"}
                onMouseOut={e  => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8, marginBottom:4 }}>
                  <p style={{ fontSize:12, fontWeight:600, color:"#1A1412", margin:0, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {c.title}
                  </p>
                  <Badge variant={c.priority} size="sm" style={{ flexShrink:0 }} />
                </div>
                <p style={{ fontSize:11, color:"#8B7355", margin:0 }}>
                  {c.submitter?.full_name} · {formatRelativeTime(c.created_at)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Room Quick View ── */}
      <div className="fu5">
        <Card>
          <SectionHead label="Properties" title="Room Status" linkTo="/manage/properties" onAction={() => setAddRoomOpen(true)} />
          <div style={{ overflowX:"auto", paddingTop:14 }}>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:560 }}>
              <thead>
                <tr style={{ borderBottom:"1.5px solid #EDE4D8" }}>
                  {["Room","Type","Status","Building","Price/mo",""].map(h => (
                    <th key={h} style={{ padding:"8px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:"#8B7355", textTransform:"uppercase", letterSpacing:"0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rooms.slice(0,8).map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: i < Math.min(rooms.length,8)-1 ? "1px solid #F5EDE0" : "none" }}
                    onMouseOver={e => e.currentTarget.style.background = "#FFFAF6"}
                    onMouseOut={e  => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding:"11px 16px", fontSize:14, fontWeight:700, color:"#1A1412" }}>Room {r.room_number}</td>
                    <td style={{ padding:"11px 16px", fontSize:13, color:"#5C4A3A", textTransform:"capitalize" }}>{r.room_type?.replace(/_/g," ")}</td>
                    <td style={{ padding:"11px 16px" }}><Badge variant={r.status} size="sm" /></td>
                    <td style={{ padding:"11px 16px", fontSize:13, color:"#8B7355" }}>{r.buildings?.name ?? "—"}</td>
                    <td style={{ padding:"11px 16px", fontSize:13, fontWeight:600, color:"#1A1412" }}>{formatCurrency(r.monthly_price)}</td>
                    <td style={{ padding:"11px 16px" }}>
                      <Link to="/manage/properties" style={{ fontSize:12, color:"#C5612C", fontWeight:600, textDecoration:"none" }}>Edit</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* ── Modals ── */}
      <ManualPaymentModal
        isOpen={!!payModalCycle && !!payModalCycle.id}
        onClose={() => setPayModalCycle(null)}
        cycle={payModalCycle?.id ? payModalCycle : null}
        onSuccess={() => {
          setPayModalCycle(null);
          getBillingCycles(tenantId, { status:"overdue", limit:4 }).then(({data}) => setOverdueCycles(data ?? []));
          getPayments(tenantId, { limit:5 }).then(({data}) => setRecentPayments(data ?? []));
        }}
      />

      <RoomFormModal
        isOpen={addRoomOpen}
        onClose={() => setAddRoomOpen(false)}
        buildings={buildings}
        onSuccess={(room) => {
          setAddRoomOpen(false);
          setRooms(prev => [room, ...prev]);
        }}
      />
    </DashboardLayout>
  );
}
