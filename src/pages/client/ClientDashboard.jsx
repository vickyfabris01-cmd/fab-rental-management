import { useState, useEffect } from "react";
import { useNavigate, Link }   from "react-router-dom";

// ── Layout ────────────────────────────────────────────────────────────────────
import DashboardLayout         from "../../layouts/DashboardLayout.jsx";

// ── Components ────────────────────────────────────────────────────────────────
import PageHeader              from "../../components/layout/PageHeader.jsx";
import StatsCard               from "../../components/data/StatsCard.jsx";
import Badge                   from "../../components/ui/Badge.jsx";
import Avatar                  from "../../components/ui/Avatar.jsx";
import Button                  from "../../components/ui/Button.jsx";
import { Spinner }             from "../../components/ui/Spinner.jsx";
import { NotificationItem }    from "../../components/data/domain-cards.jsx";
import MPesaPayModal           from "../../components/modals/MPesaPayModal.jsx";
import NewComplaintModal       from "../../components/modals/NewComplaintModal.jsx";

// ── Store / hooks ─────────────────────────────────────────────────────────────
import useAuthStore            from "../../store/authStore.js";
import useNotificationStore    from "../../store/notificationStore.js";

// ── API ───────────────────────────────────────────────────────────────────────
import { getMyTenancy }                    from "../../lib/api/tenancies.js";
import { getMyBillingCycles, getCurrentCycle } from "../../lib/api/billing.js";
import { getMyPayments }                   from "../../lib/api/payments.js";
import { getMyComplaints }                 from "../../lib/api/complaints.js";

// ── Utils ─────────────────────────────────────────────────────────────────────
import { formatCurrency, formatDate, formatRelativeTime, formatBillingPeriod } from "../../lib/formatters.js";

// =============================================================================
// ClientDashboard   /dashboard
//
// Sections:
//   1. Greeting + room summary hero
//   2. Four KPI stat cards
//   3. Current billing cycle card  +  Recent payments
//   4. My complaints                +  Recent notifications
// =============================================================================

// ── Shared inline icon helper ─────────────────────────────────────────────────
const Ic = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

// ── Section card shell ────────────────────────────────────────────────────────
function Card({ children, style: extra = {} }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 20,
      border: "1px solid #EDE4D8",
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      overflow: "hidden",
      ...extra,
    }}>
      {children}
    </div>
  );
}

function CardHeader({ title, linkTo, linkLabel = "View all" }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 20px 0" }}>
      <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17, color:"#1A1412", margin:0 }}>
        {title}
      </h3>
      {linkTo && (
        <Link to={linkTo} style={{ fontSize:12, color:"#C5612C", fontWeight:600, textDecoration:"none", display:"flex", alignItems:"center", gap:3 }}>
          {linkLabel}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </Link>
      )}
    </div>
  );
}

// ── Billing cycle row ─────────────────────────────────────────────────────────
function CycleRow({ cycle, onPay }) {
  const total   = Number(cycle.amount_due) + Number(cycle.late_fee ?? 0);
  const isPaid  = ["paid","waived","cancelled"].includes(cycle.status);
  const isOverdue = !isPaid && cycle.due_date < new Date().toISOString().slice(0,10);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 20px", borderBottom:"1px solid #F5EDE0" }}
      onMouseOver={e => e.currentTarget.style.background = "#FFFAF6"}
      onMouseOut={e  => e.currentTarget.style.background = "transparent"}
    >
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:13, fontWeight:600, color:"#1A1412", margin:0 }}>
          {formatBillingPeriod(cycle.period_start, cycle.period_end, cycle.billing_type)}
        </p>
        <p style={{ fontSize:11, color: isOverdue ? "#DC2626" : "#8B7355", margin:"2px 0 0" }}>
          Due {formatDate(cycle.due_date)}{isOverdue ? " — OVERDUE" : ""}
        </p>
      </div>
      <span style={{ fontSize:13, fontWeight:700, color:"#1A1412", flexShrink:0 }}>
        {formatCurrency(total)}
      </span>
      <Badge variant={cycle.status} size="sm" style={{ flexShrink:0 }} />
      {!isPaid && (
        <button onClick={() => onPay(cycle)}
          style={{ background:"#C5612C", color:"#fff", border:"none", borderRadius:999, padding:"5px 12px", fontSize:11, fontWeight:700, cursor:"pointer", flexShrink:0, transition:"background 0.15s" }}
          onMouseOver={e => e.currentTarget.style.background = "#A84E22"}
          onMouseOut={e  => e.currentTarget.style.background = "#C5612C"}
        >
          Pay
        </button>
      )}
    </div>
  );
}

// ── Recent payment row ────────────────────────────────────────────────────────
function PaymentRow({ payment }) {
  const ok = payment.payment_status === "confirmed";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 20px", borderBottom:"1px solid #F5EDE0" }}>
      <div style={{ width:36, height:36, borderRadius:10, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", background: ok ? "#ECFDF5" : "#FEF2F2" }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={ok ? "#059669" : "#DC2626"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {ok
            ? <><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>
            : <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>
          }
        </svg>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:13, fontWeight:600, color:"#1A1412", margin:0 }}>
          {payment.payment_method === "mpesa" ? "M-Pesa" : payment.payment_method}
          {payment.mpesa_receipt && (
            <span style={{ fontSize:10, color:"#8B7355", fontWeight:400, marginLeft:8, fontFamily:"'DM Mono','Courier New',monospace" }}>
              {payment.mpesa_receipt}
            </span>
          )}
        </p>
        <p style={{ fontSize:11, color:"#8B7355", margin:"2px 0 0" }}>
          {formatRelativeTime(payment.created_at)}
        </p>
      </div>
      <p style={{ fontSize:14, fontWeight:700, color:"#1A1412", margin:0, flexShrink:0, fontFamily:"'Playfair Display',serif" }}>
        {formatCurrency(payment.amount)}
      </p>
      <Badge variant={payment.payment_status} size="sm" style={{ flexShrink:0 }} />
    </div>
  );
}

// ── Complaint row ─────────────────────────────────────────────────────────────
function ComplaintRow({ complaint, onClick }) {
  const isUrgent = ["high","urgent"].includes(complaint.priority);
  return (
    <div onClick={onClick} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"12px 20px", borderBottom:"1px solid #F5EDE0", cursor:"pointer", transition:"background 0.12s" }}
      onMouseOver={e => e.currentTarget.style.background = "#FFFAF6"}
      onMouseOut={e  => e.currentTarget.style.background = "transparent"}
    >
      <div style={{ width:8, height:8, borderRadius:"50%", flexShrink:0, marginTop:5,
        background: complaint.status === "resolved" ? "#10B981" : complaint.status === "in_progress" ? "#3B82F6" : "#F59E0B" }} />
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:13, fontWeight:600, color:"#1A1412", margin:"0 0 3px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {complaint.title}
        </p>
        <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
          <span style={{ fontSize:11, color:"#8B7355", background:"#F5EDE0", borderRadius:999, padding:"2px 8px" }}>
            {complaint.category}
          </span>
          {isUrgent && (
            <span style={{ fontSize:11, fontWeight:700, color:"#DC2626", background:"#FEF2F2", borderRadius:999, padding:"2px 8px" }}>
              {complaint.priority}
            </span>
          )}
          <span style={{ fontSize:11, color:"#8B7355", marginLeft:"auto" }}>
            {formatRelativeTime(complaint.created_at)}
          </span>
        </div>
      </div>
      <Badge variant={complaint.status} size="sm" style={{ flexShrink:0 }} />
    </div>
  );
}

// =============================================================================
// Main dashboard
// =============================================================================
export default function ClientDashboard() {
  const navigate      = useNavigate();
  const profile       = useAuthStore(s => s.profile);
  const notifications = useNotificationStore(s => s.notifications);
  const unreadCount   = useNotificationStore(s => s.unreadCount);
  const markAllRead   = useNotificationStore(s => s.markAllRead);

  const [tenancy,      setTenancy]      = useState(null);
  const [currentCycle, setCurrentCycle] = useState(null);
  const [cycles,       setCycles]       = useState([]);
  const [payments,     setPayments]     = useState([]);
  const [complaints,   setComplaints]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [payingCycle,  setPayingCycle]  = useState(null);
  const [newComplaint, setNewComplaint] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    Promise.all([
      getMyTenancy(profile.id),
      getCurrentCycle(profile.id),
      getMyBillingCycles(profile.id, { limit: 3 }),
      getMyPayments(profile.id, { limit: 3 }),
      getMyComplaints(profile.id, { limit: 3 }),
    ]).then(([{ data: t }, { data: cc }, { data: cy }, { data: py }, { data: co }]) => {
      setTenancy(t);
      setCurrentCycle(cc);
      setCycles(cy ?? []);
      setPayments(py ?? []);
      setComplaints(co ?? []);
    }).finally(() => setLoading(false));
  }, [profile?.id]);

  const firstName    = profile?.full_name?.split(" ")[0] ?? "there";
  const room         = tenancy?.rooms;
  const building     = room?.buildings;
  const isPaid       = ["paid","waived","cancelled"].includes(currentCycle?.status);
  const totalOwed    = cycles
    .filter(c => !["paid","waived","cancelled"].includes(c.status))
    .reduce((s,c) => s + Number(c.amount_due) + Number(c.late_fee ?? 0), 0);
  const paidPct = currentCycle
    ? Math.round(((Number(currentCycle.amount_due) - Math.max(0, Number(currentCycle.amount_due) - (Number(currentCycle.amount_paid ?? 0)))) / Number(currentCycle.amount_due)) * 100)
    : 0;

  if (loading) return (
    <DashboardLayout pageTitle="Dashboard">
      <div style={{ display:"flex", justifyContent:"center", padding:80 }}><Spinner size="lg" /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout pageTitle="Dashboard">
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .fu1{animation:fadeUp 0.4s 0.05s ease both}
        .fu2{animation:fadeUp 0.4s 0.12s ease both}
        .fu3{animation:fadeUp 0.4s 0.20s ease both}
        .fu4{animation:fadeUp 0.4s 0.28s ease both}
        .fu5{animation:fadeUp 0.4s 0.36s ease both}
        @media(max-width:900px){.dash-two-col{grid-template-columns:1fr!important}}
      `}</style>

      {/* ── 1. Greeting hero ── */}
      <div className="fu1" style={{ background:"linear-gradient(120deg,#1A1412 0%,#2D1E16 60%,#3D2318 100%)", borderRadius:20, padding:"28px 32px", marginBottom:24, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
        <div>
          <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.45)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>
            {new Date().toLocaleDateString("en-KE", { weekday:"long", day:"numeric", month:"long" })}
          </p>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"clamp(22px,3vw,30px)", color:"#fff", margin:"0 0 6px" }}>
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {firstName}! 👋
          </h1>
          <p style={{ fontSize:14, color:"rgba(255,255,255,0.55)", margin:0 }}>
            {tenancy
              ? `Room ${room?.room_number} · ${building?.name ?? ""}`
              : "You don't have an active room yet. Browse available properties."}
          </p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
          <Avatar name={profile?.full_name} src={profile?.avatar_url} size={52} border />
          <div>
            <p style={{ fontSize:13, fontWeight:700, color:"#fff", margin:0 }}>{profile?.full_name}</p>
            <Badge variant={profile?.role} size="sm" style={{ marginTop:4 }} />
          </div>
        </div>
      </div>

      {/* ── 2. KPI stats row ── */}
      <div className="fu2" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:16, marginBottom:24 }}>
        <StatsCard
          label="Current Rent"
          value={currentCycle ? formatCurrency(Number(currentCycle.amount_due) + Number(currentCycle.late_fee ?? 0)) : "—"}
          sublabel={currentCycle ? `Due ${formatDate(currentCycle.due_date)}` : "No active cycle"}
          color={!currentCycle ? "neutral" : isPaid ? "success" : currentCycle.status === "overdue" ? "error" : "warning"}
          icon={<Ic d="M2 7h20v13a1 1 0 01-1 1H3a1 1 0 01-1-1V7zm0 0l2-4h16l2 4" />}
          onClick={() => navigate("/dashboard/billing")}
        />
        <StatsCard
          label="Outstanding Balance"
          value={totalOwed > 0 ? formatCurrency(totalOwed) : "Nil"}
          sublabel={totalOwed > 0 ? `${cycles.filter(c=>!["paid","waived","cancelled"].includes(c.status)).length} unpaid cycle(s)` : "All clear!"}
          color={totalOwed > 0 ? "error" : "success"}
          icon={<Ic d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6" />}
          onClick={() => navigate("/dashboard/billing")}
        />
        <StatsCard
          label="Active Complaints"
          value={complaints.filter(c => !["resolved","closed"].includes(c.status)).length}
          sublabel={complaints.length > 0 ? `${complaints.length} total submitted` : "No complaints"}
          color={complaints.filter(c=>!["resolved","closed"].includes(c.status)).length > 0 ? "warning" : "neutral"}
          icon={<Ic d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />}
          onClick={() => navigate("/dashboard/complaints")}
        />
        <StatsCard
          label="Notifications"
          value={unreadCount > 0 ? `${unreadCount} unread` : "All read"}
          sublabel="Tap to view all"
          color={unreadCount > 0 ? "brand" : "neutral"}
          icon={<Ic d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />}
          onClick={() => navigate("/dashboard/notifications")}
        />
      </div>

      {/* ── 3. Billing + Payments row ── */}
      <div className="fu3 dash-two-col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>

        {/* Billing */}
        <Card>
          <CardHeader title="Billing Cycles" linkTo="/dashboard/billing" />

          {/* Current cycle progress bar */}
          {currentCycle && (
            <div style={{ padding:"16px 20px 12px", borderBottom:"1px solid #F5EDE0" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <p style={{ fontSize:13, fontWeight:600, color:"#1A1412", margin:0 }}>
                  {formatBillingPeriod(currentCycle.period_start, currentCycle.period_end, currentCycle.billing_type)}
                </p>
                <Badge variant={currentCycle.status} size="sm" />
              </div>
              {/* Progress track */}
              <div style={{ height:8, borderRadius:999, background:"#F5EDE0", overflow:"hidden", marginBottom:6 }}>
                <div style={{ height:"100%", borderRadius:999, width:`${isPaid ? 100 : paidPct}%`, background: isPaid ? "#10B981" : paidPct > 0 ? "#3B82F6" : "#E8DDD4", transition:"width 0.8s ease" }} />
              </div>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <p style={{ fontSize:11, color:"#8B7355", margin:0 }}>
                  {isPaid ? "Fully paid" : `${formatCurrency(Number(currentCycle.amount_due) - paidPct * Number(currentCycle.amount_due) / 100)} remaining`}
                </p>
                <p style={{ fontSize:11, fontWeight:700, color:"#C5612C", margin:0 }}>
                  {formatCurrency(Number(currentCycle.amount_due) + Number(currentCycle.late_fee ?? 0))}
                </p>
              </div>
            </div>
          )}

          {/* Recent 3 cycles */}
          <div>
            {cycles.length === 0 ? (
              <p style={{ fontSize:13, color:"#8B7355", textAlign:"center", padding:"24px 20px" }}>No billing history yet.</p>
            ) : (
              cycles.map(c => <CycleRow key={c.id} cycle={c} onPay={setPayingCycle} />)
            )}
          </div>

          {/* Pay CTA */}
          {currentCycle && !isPaid && (
            <div style={{ padding:"14px 20px" }}>
              <Button variant="primary" fullWidth onClick={() => setPayingCycle(currentCycle)}>
                Pay via M-Pesa
              </Button>
            </div>
          )}
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader title="Recent Payments" linkTo="/dashboard/payments" />
          <div style={{ paddingTop:12 }}>
            {payments.length === 0 ? (
              <p style={{ fontSize:13, color:"#8B7355", textAlign:"center", padding:"24px 20px" }}>No payments yet.</p>
            ) : (
              payments.map(p => <PaymentRow key={p.id} payment={p} />)
            )}
          </div>
          {/* Year total */}
          {payments.length > 0 && (
            <div style={{ padding:"12px 20px", background:"#FAF7F2", borderTop:"1px solid #EDE4D8", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:13, color:"#8B7355" }}>Total paid this year</span>
              <span style={{ fontSize:14, fontWeight:700, color:"#10B981", fontFamily:"'Playfair Display',serif" }}>
                {formatCurrency(payments.filter(p=>p.payment_status==="confirmed").reduce((s,p)=>s+Number(p.amount),0))}
              </span>
            </div>
          )}
        </Card>
      </div>

      {/* ── 4. Complaints + Notifications row ── */}
      <div className="fu4 dash-two-col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>

        {/* Complaints */}
        <Card>
          <CardHeader title="My Complaints" linkTo="/dashboard/complaints" />
          <div style={{ paddingTop:12 }}>
            {complaints.length === 0 ? (
              <p style={{ fontSize:13, color:"#8B7355", textAlign:"center", padding:"20px 20px 0" }}>
                No complaints submitted yet.
              </p>
            ) : (
              complaints.map(c => (
                <ComplaintRow key={c.id} complaint={c}
                  onClick={() => navigate(`/dashboard/complaints/${c.id}`)}
                />
              ))
            )}
          </div>
          <div style={{ padding:"14px 20px", borderTop:"1px solid #EDE4D8" }}>
            <button onClick={() => setNewComplaint(true)}
              style={{ width:"100%", border:"1.5px dashed #E8DDD4", background:"transparent", borderRadius:12, padding:"11px", fontSize:13, fontWeight:600, color:"#8B7355", cursor:"pointer", transition:"all 0.15s" }}
              onMouseOver={e => { e.currentTarget.style.borderColor="#C5612C"; e.currentTarget.style.color="#C5612C"; }}
              onMouseOut={e  => { e.currentTarget.style.borderColor="#E8DDD4"; e.currentTarget.style.color="#8B7355"; }}
            >
              + New Complaint
            </button>
          </div>
        </Card>

        {/* Notifications */}
        <Card>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 20px 12px" }}>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17, color:"#1A1412", margin:0 }}>
              Notifications
              {unreadCount > 0 && (
                <span style={{ marginLeft:8, fontSize:11, fontWeight:700, background:"#C5612C", color:"#fff", borderRadius:999, padding:"2px 7px" }}>
                  {unreadCount}
                </span>
              )}
            </h3>
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              {unreadCount > 0 && (
                <button onClick={() => profile?.id && markAllRead(profile.id)}
                  style={{ fontSize:12, color:"#C5612C", fontWeight:600, background:"none", border:"none", cursor:"pointer", padding:0 }}>
                  Mark all read
                </button>
              )}
              <Link to="/dashboard/notifications" style={{ fontSize:12, color:"#C5612C", fontWeight:600, textDecoration:"none", display:"flex", alignItems:"center", gap:3 }}>
                All
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
              </Link>
            </div>
          </div>

          <div>
            {notifications.length === 0 ? (
              <p style={{ fontSize:13, color:"#8B7355", textAlign:"center", padding:"24px 20px" }}>No notifications yet.</p>
            ) : (
              notifications.slice(0, 4).map((n, i, arr) => (
                <div key={n.id} style={{ borderBottom: i < Math.min(arr.length,4)-1 ? "1px solid #F5EDE0" : "none" }}>
                  <NotificationItem notification={n} onRead={useNotificationStore.getState().markRead} />
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* ── Modals ── */}
      <MPesaPayModal
        isOpen={!!payingCycle}
        onClose={() => setPayingCycle(null)}
        cycle={payingCycle}
        onSuccess={() => {
          setPayingCycle(null);
          // Refresh cycles
          getMyBillingCycles(profile.id, { limit:3 }).then(({ data }) => setCycles(data ?? []));
          getCurrentCycle(profile.id).then(({ data }) => setCurrentCycle(data));
        }}
      />

      <NewComplaintModal
        isOpen={newComplaint}
        onClose={() => setNewComplaint(false)}
        tenancyId={tenancy?.id ?? null}
        onSuccess={() => {
          setNewComplaint(false);
          getMyComplaints(profile.id, { limit:3 }).then(({ data }) => setComplaints(data ?? []));
        }}
      />
    </DashboardLayout>
  );
}
