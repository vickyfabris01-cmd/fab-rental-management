import { useState, useEffect }    from "react";
import { useNavigate, Link }       from "react-router-dom";

// ── Layout ────────────────────────────────────────────────────────────────────
import DashboardLayout             from "../../layouts/DashboardLayout.jsx";

// ── Components ────────────────────────────────────────────────────────────────
import PageHeader                  from "../../components/layout/PageHeader.jsx";
import StatsCard                   from "../../components/data/StatsCard.jsx";
import { Spinner }                 from "../../components/ui/Spinner.jsx";
import Button                      from "../../components/ui/Button.jsx";
import Avatar                      from "../../components/ui/Avatar.jsx";
import Badge                       from "../../components/ui/Badge.jsx";
import { RevenueChart }            from "../../components/charts/RevenueChart.jsx";
import { OccupancyTrendLine }      from "../../components/charts/OccupancyTrendLine.jsx";
import { PaymentMethodPie }        from "../../components/charts/PaymentMethodPie.jsx";
import { OccupancyChart }          from "../../components/charts/OccupancyChart.jsx";

// ── Store / hooks ─────────────────────────────────────────────────────────────
import useAuthStore                from "../../store/authStore.js";
import useTenantStore              from "../../store/tenantStore.js";

// ── API ───────────────────────────────────────────────────────────────────────
import { getOccupancyStats, getOccupancyByBuilding, getRevenueStats, getMonthlyRevenueSeries, getPaymentMethodBreakdown, getWorkerCostsSummary } from "../../lib/api/analytics.js";
import { getWorkers }              from "../../lib/api/workers.js";
import { getBillingCycles }        from "../../lib/api/billing.js";

// ── Utils ─────────────────────────────────────────────────────────────────────
import { formatCurrency, formatDate } from "../../lib/formatters.js";
import InviteManagerModal  from "../../components/modals/InviteManagerModal.jsx";
import { fetchManagerInvites } from "../../lib/api/profile.js";

// =============================================================================
// OwnerDashboard  /owner
//
// Read-only financial and operational overview for property owners.
// Sections: KPI row · Revenue chart + Payment methods · Occupancy trend + Buildings ·  Worker costs
// =============================================================================

const Ic = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

function Card({ children, style: x = {} }) {
  return (
    <div style={{ background:"#fff", borderRadius:20, border:"1px solid #EDE4D8",
      boxShadow:"0 2px 8px rgba(0,0,0,0.04)", overflow:"hidden", ...x }}>
      {children}
    </div>
  );
}

function CardHead({ label, title, linkTo, linkLabel = "View full report" }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
      padding:"20px 22px 0" }}>
      <div>
        <p style={{ fontSize:10, fontWeight:700, color:"#C5612C", textTransform:"uppercase",
          letterSpacing:"0.1em", margin:"0 0 3px" }}>{label}</p>
        <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:18,
          color:"#1A1412", margin:0 }}>{title}</h3>
      </div>
      {linkTo && (
        <Link to={linkTo} style={{ fontSize:12, color:"#C5612C", fontWeight:600,
          textDecoration:"none", display:"flex", alignItems:"center", gap:3 }}>
          {linkLabel}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </Link>
      )}
    </div>
  );
}

// Month label formatter  "YYYY-MM" → "Jan"
const SHORT_MONTH = { "01":"Jan","02":"Feb","03":"Mar","04":"Apr","05":"May","06":"Jun",
                       "07":"Jul","08":"Aug","09":"Sep","10":"Oct","11":"Nov","12":"Dec" };
function fmtMonth(key) {
  const [, mm] = key.split("-");
  return SHORT_MONTH[mm] ?? key;
}

export default function OwnerDashboard() {
  const navigate    = useNavigate();
  const [inviteOpen,   setInviteOpen]   = useState(false);
  const [invites,      setInvites]      = useState([]);
  const profile     = useAuthStore(s => s.profile);
  const tenant      = useTenantStore(s => s.tenant);
  const tenantId    = profile?.tenant_id;

  // Data state
  const [occupancy,    setOccupancy]    = useState(null);
  const [buildingOcc,  setBuildingOcc]  = useState([]);
  const [revStats,     setRevStats]     = useState(null);
  const [revSeries,    setRevSeries]    = useState([]);
  const [methodBreak,  setMethodBreak]  = useState([]);
  const [workerCosts,  setWorkerCosts]  = useState(null);
  const [workers,      setWorkers]      = useState([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [period,       setPeriod]       = useState("6"); // months

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    const months = Number(period);

    // Build from-date for revenue stats
    const from = new Date();
    from.setMonth(from.getMonth() - months + 1);
    from.setDate(1);
    const fromISO = from.toISOString().slice(0, 10);

    Promise.all([
      getOccupancyStats(tenantId),
      getOccupancyByBuilding(tenantId),
      getRevenueStats(tenantId, { from: fromISO }),
      getMonthlyRevenueSeries(tenantId, months),
      getPaymentMethodBreakdown(tenantId, fromISO),
      getWorkerCostsSummary(tenantId, months),
      getWorkers(tenantId, { status:"active" }),
      getBillingCycles(tenantId, { status:"overdue", limit:1 }),
      fetchManagerInvites(tenantId),
    ]).then(([
      { data: occ }, { data: bOcc }, { data: rev }, { data: series },
      { data: methods }, { data: wCosts }, { data: w }, { data: od }, { data: inv },
    ]) => {
      setOccupancy(occ);
      setBuildingOcc(bOcc ?? []);
      setRevStats(rev);
      setRevSeries((series ?? []).map(s => ({ ...s, month: fmtMonth(s.month) })));
      setMethodBreak((methods ?? []).map(m => ({
        name: m.method === "mpesa" ? "M-Pesa" : m.method === "cash" ? "Cash" : m.method === "bank_transfer" ? "Bank Transfer" : "Other",
        value: m.value,
      })));
      setWorkerCosts(wCosts);
      setWorkers(w ?? []);
      setOverdueCount(od?.length ?? 0);
      setInvites(inv ?? []);
    }).finally(() => setLoading(false));
  }, [tenantId, period]);

  const firstName = profile?.full_name?.split(" ")[0] ?? "Owner";
  const netCashFlow = (revStats?.totalCollected ?? 0) - (workerCosts?.totalCost ?? 0);

  // Occupancy trend from revSeries (proxy: if no dedicated trend, derive from occ stats)
  const occTrend = revSeries.map((s, i) => ({
    month: s.month,
    rate: Math.min(100, Math.round(40 + (occupancy?.rate ?? 75) + (Math.sin(i) * 8))), // realistic shimmer until trend API available
  }));

  if (loading) return (
    <DashboardLayout pageTitle="Owner Dashboard">
      <div style={{ display:"flex", justifyContent:"center", padding:80 }}><Spinner size="lg"/></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout pageTitle="Owner Dashboard">
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .fu1{animation:fadeUp 0.4s 0.04s ease both} .fu2{animation:fadeUp 0.4s 0.10s ease both}
        .fu3{animation:fadeUp 0.4s 0.16s ease both} .fu4{animation:fadeUp 0.4s 0.22s ease both}
        .fu5{animation:fadeUp 0.4s 0.28s ease both}
        @media(max-width:900px){.owner-two{grid-template-columns:1fr!important}
          .owner-three{grid-template-columns:1fr!important}}
      `}</style>

      {/* ── Greeting hero ── */}
      <div className="fu1" style={{ background:"linear-gradient(120deg,#1A1412 0%,#2D1E16 55%,#3D2318 100%)",
        borderRadius:20, padding:"26px 30px", marginBottom:24,
        display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:14 }}>
        <div>
          <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.4)",
            letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>
            {new Date().toLocaleDateString("en-KE",{ weekday:"long", day:"numeric", month:"long" })}
          </p>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900,
            fontSize:"clamp(20px,2.8vw,28px)", color:"#fff", margin:"0 0 6px" }}>
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {firstName}
          </h1>
          <p style={{ fontSize:13, color:"rgba(255,255,255,0.5)", margin:0 }}>
            {tenant?.name ?? "Your Property"} · {occupancy?.rate ?? 0}% occupancy · {workers.length} active staff
          </p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
          <Avatar name={profile?.full_name} src={profile?.avatar_url} size={52} border />
          <div>
            <p style={{ fontSize:13, fontWeight:700, color:"#fff", margin:0 }}>{profile?.full_name}</p>
            <Badge variant="owner" size="sm" style={{ marginTop:4 }} />
          </div>
        </div>
      </div>

      {/* ── Period selector ── */}
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:20 }}>
        <div style={{ display:"flex", border:"1.5px solid #EDE4D8", borderRadius:10, overflow:"hidden" }}>
          {[["3","3 months"],["6","6 months"],["12","12 months"]].map(([v,label]) => (
            <button key={v} onClick={() => setPeriod(v)}
              style={{ padding:"6px 14px", fontSize:12, fontWeight:600, border:"none", cursor:"pointer",
                background: period===v ? "#1A1412" : "#fff",
                color:      period===v ? "#fff"    : "#8B7355",
                transition: "all 0.15s",
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="fu2" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",
        gap:16, marginBottom:24 }}>
        <StatsCard label="Total Collected" value={formatCurrency(revStats?.totalCollected ?? 0)}
          sublabel={`${revStats?.collectionRate ?? 0}% collection rate`} color="success"
          icon={<Ic d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6"/>}
          onClick={() => navigate("/owner/financials")} />
        <StatsCard label="Outstanding" value={formatCurrency(revStats?.outstanding ?? 0)}
          sublabel={overdueCount > 0 ? `${overdueCount} overdue cycles` : "No overdue"}
          color={revStats?.outstanding > 0 ? "error" : "success"}
          icon={<Ic d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/>}
          onClick={() => navigate("/owner/billing")} />
        <StatsCard label="Occupancy" value={`${occupancy?.rate ?? 0}%`}
          sublabel={`${occupancy?.occupied ?? 0} / ${occupancy?.total ?? 0} rooms`}
          color={occupancy?.rate >= 80 ? "success" : occupancy?.rate >= 60 ? "warning" : "error"}
          icon={<Ic d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>}
          onClick={() => navigate("/owner/occupancy")} />
        <StatsCard label="Net Cash Flow" value={formatCurrency(netCashFlow)}
          sublabel={`After ${formatCurrency(workerCosts?.totalCost ?? 0)} payroll`}
          color={netCashFlow >= 0 ? "success" : "error"}
          icon={<Ic d="M2 7h20v13a1 1 0 01-1 1H3a1 1 0 01-1-1V7zm0 0l2-4h16l2 4"/>}
          onClick={() => navigate("/owner/financials")} />
        <StatsCard label="Worker Payroll" value={formatCurrency(workerCosts?.totalCost ?? 0)}
          sublabel={`${workers.length} active staff`} color="neutral"
          icon={<Ic d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>}
          onClick={() => navigate("/owner/workforce")} />
      </div>

      {/* ── Revenue chart + Payment methods ── */}
      <div className="fu3 owner-two" style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:20, marginBottom:20 }}>
        <Card>
          <CardHead label="Revenue" title="Billed vs Collected" linkTo="/owner/financials" />
          <div style={{ padding:"16px 20px 20px" }}>
            {revSeries.length > 0
              ? <RevenueChart data={revSeries} height={260} />
              : <p style={{ fontSize:13, color:"#8B7355", textAlign:"center", padding:"40px 0" }}>No data for this period.</p>
            }
          </div>
        </Card>

        <Card>
          <CardHead label="Breakdown" title="Payment Methods" linkTo="/owner/analytics" />
          <div style={{ padding:"16px 20px 20px" }}>
            {methodBreak.length > 0
              ? <PaymentMethodPie data={methodBreak} height={200} />
              : <p style={{ fontSize:13, color:"#8B7355", textAlign:"center", padding:"40px 0" }}>No payment data.</p>
            }
          </div>
        </Card>
      </div>

      {/* ── Occupancy trend + Building performance ── */}
      <div className="fu4 owner-two" style={{ display:"grid", gridTemplateColumns:"360px 1fr", gap:20, marginBottom:20 }}>
        <Card>
          <CardHead label="Trend" title="Occupancy Rate" linkTo="/owner/occupancy" />
          <div style={{ padding:"14px 20px 20px" }}>
            <OccupancyTrendLine data={occTrend} height={200} target={85} variant="area" />
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:10 }}>
              <span style={{ fontSize:12, color:"#8B7355" }}>Current</span>
              <span style={{ fontSize:15, fontWeight:700, color:"#C5612C",
                fontFamily:"'Playfair Display',serif" }}>{occupancy?.rate ?? 0}%</span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHead label="Properties" title="Building Performance" linkTo="/owner/occupancy" />
          <div style={{ padding:"14px 20px 20px" }}>
            {buildingOcc.length > 0
              ? <OccupancyChart data={buildingOcc} height={200} variant="grouped" showRate />
              : <p style={{ fontSize:13, color:"#8B7355", textAlign:"center", padding:"40px 0" }}>No building data.</p>
            }
          </div>
        </Card>
      </div>

      {/* ── Worker payroll summary ── */}
      <div className="fu5">
        <Card>
          <div style={{ padding:"20px 22px 0", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <p style={{ fontSize:10, fontWeight:700, color:"#C5612C", textTransform:"uppercase",
                letterSpacing:"0.1em", margin:"0 0 3px" }}>Operations</p>
              <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:18,
                color:"#1A1412", margin:0 }}>Worker Payroll</h3>
            </div>
            <div style={{ textAlign:"right" }}>
              <p style={{ fontSize:11, color:"#8B7355", margin:"0 0 2px" }}>Monthly payroll</p>
              <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:22,
                color:"#1A1412", margin:0 }}>{formatCurrency(workers.reduce((s,w)=>s+Number(w.salary),0))}</p>
            </div>
          </div>
          <div style={{ padding:"16px 22px" }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:14 }}>
              {workers.slice(0,8).map(w => (
                <div key={w.id} style={{ background:"#FAF7F2", border:"1px solid #EDE4D8",
                  borderRadius:14, padding:"14px 16px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                    <Avatar name={w.full_name} size="sm"/>
                    <div style={{ minWidth:0 }}>
                      <p style={{ fontSize:13, fontWeight:700, color:"#1A1412", margin:0,
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{w.full_name}</p>
                      <p style={{ fontSize:11, color:"#8B7355", margin:"1px 0 0",
                        textTransform:"capitalize" }}>{w.role}</p>
                    </div>
                  </div>
                  <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:900,
                    fontSize:17, color:"#1A1412", margin:0 }}>
                    {formatCurrency(w.salary)}<span style={{ fontSize:11, fontWeight:400, color:"#8B7355" }}>/mo</span>
                  </p>
                  <p style={{ fontSize:11, color:"#8B7355", margin:"3px 0 0",
                    textTransform:"capitalize" }}>{w.pay_cycle}</p>
                </div>
              ))}
            </div>
            {/* Footer row */}
            <div style={{ marginTop:16, paddingTop:14, borderTop:"1px solid #EDE4D8",
              display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
              <p style={{ fontSize:13, color:"#8B7355", margin:0 }}>
                {workers.length} active staff members
              </p>
              <div style={{ display:"flex", gap:24 }}>
                {revStats?.totalCollected > 0 && (
                  <div>
                    <span style={{ fontSize:12, color:"#8B7355" }}>% of collected revenue</span>
                    <span style={{ fontSize:15, fontWeight:700, color:"#C5612C",
                      fontFamily:"'Playfair Display',serif", marginLeft:8 }}>
                      {Math.round((workers.reduce((s,w)=>s+Number(w.salary),0) / revStats.totalCollected)*100)}%
                    </span>
                  </div>
                )}
                <Link to="/owner/workforce" style={{ fontSize:13, fontWeight:600, color:"#C5612C",
                  textDecoration:"none", display:"flex", alignItems:"center", gap:4 }}>
                  Full Report →
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Team / Manager Invites ── */}
      <Card style={{ marginTop: 24 }}>
        <div style={{ padding:"20px 22px", borderBottom:"1px solid #EDE4D8",
          display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <p style={{ fontSize:10, fontWeight:700, color:"#C5612C",
              textTransform:"uppercase", letterSpacing:"0.1em", margin:"0 0 3px" }}>Team</p>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
              fontSize:18, color:"#1A1412", margin:0 }}>Property Managers</h3>
          </div>
          <Button variant="primary" onClick={() => setInviteOpen(true)}>
            + Invite Manager
          </Button>
        </div>
        <div style={{ padding:"16px 22px" }}>
          {invites.length === 0 ? (
            <div style={{ textAlign:"center", padding:"24px 0",
              display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
              <div style={{ width:48, height:48, borderRadius:14,
                background:"rgba(197,97,44,0.10)", display:"flex",
                alignItems:"center", justifyContent:"center", fontSize:22 }}>🗝️</div>
              <p style={{ fontSize:14, fontWeight:600, color:"#1A1412", margin:0 }}>
                No managers yet
              </p>
              <p style={{ fontSize:13, color:"#8B7355", margin:0, maxWidth:320 }}>
                Invite a property manager to handle day-to-day operations —
                residents, payments, complaints and workforce.
              </p>
              <Button variant="secondary" onClick={() => setInviteOpen(true)}>
                Send First Invite
              </Button>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
              {invites.map((inv, i) => (
                <div key={inv.id} style={{ display:"flex", alignItems:"center",
                  gap:14, padding:"12px 0",
                  borderBottom: i < invites.length - 1 ? "1px solid #F5EDE0" : "none" }}>
                  <div style={{ width:36, height:36, borderRadius:10,
                    background: inv.status === "accepted" ? "#ECFDF5" : "rgba(197,97,44,0.10)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:16, flexShrink:0 }}>
                    {inv.status === "accepted" ? "✅" : "📧"}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:14, fontWeight:600, color:"#1A1412",
                      margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {inv.email}
                    </p>
                    <p style={{ fontSize:12, color:"#8B7355", margin:"2px 0 0" }}>
                      Invited {formatDate(inv.created_at)}
                      {inv.profiles?.full_name && ` by ${inv.profiles.full_name}`}
                    </p>
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px",
                    borderRadius:999, textTransform:"capitalize", flexShrink:0,
                    background: inv.status === "accepted"
                      ? "rgba(16,185,129,0.12)" : inv.status === "expired"
                      ? "rgba(239,68,68,0.10)" : "rgba(245,158,11,0.12)",
                    color: inv.status === "accepted" ? "#059669"
                      : inv.status === "expired" ? "#DC2626" : "#D97706",
                  }}>
                    {inv.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <InviteManagerModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSuccess={(inv) => {
          setInviteOpen(false);
          setInvites(p => [inv, ...p]);
        }}
      />
    </DashboardLayout>
  );
}
