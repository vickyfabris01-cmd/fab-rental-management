import { useState, useEffect } from "react";

import DashboardLayout        from "../../layouts/DashboardLayout.jsx";
import PageHeader             from "../../components/layout/PageHeader.jsx";
import StatsCard              from "../../components/data/StatsCard.jsx";
import { Spinner }            from "../../components/ui/Spinner.jsx";
import { EmptyState }         from "../../components/ui/Spinner.jsx";
import Avatar                 from "../../components/ui/Avatar.jsx";
import Badge                  from "../../components/ui/Badge.jsx";
import { RevenueChart }       from "../../components/charts/RevenueChart.jsx";

import useAuthStore           from "../../store/authStore.js";
import { getWorkerCostsSummary } from "../../lib/api/analytics.js";
import { getWorkers, getWorkerPayments } from "../../lib/api/workers.js";
import { getRevenueStats }    from "../../lib/api/analytics.js";
import { formatCurrency, formatDate } from "../../lib/formatters.js";

// =============================================================================
// WorkerCostsPage  /owner/workforce
// Read-only view of payroll for property owners.
// =============================================================================

const SHORT_MONTH = { "01":"Jan","02":"Feb","03":"Mar","04":"Apr","05":"May","06":"Jun",
                       "07":"Jul","08":"Aug","09":"Sep","10":"Oct","11":"Nov","12":"Dec" };
const fmtMonth = (key) => { const [,mm] = key.split("-"); return SHORT_MONTH[mm] ?? key; };

const ROLE_LABELS = { security:"Security", cleaner:"Cleaner", maintenance:"Maintenance",
  gardener:"Gardener", receptionist:"Receptionist", driver:"Driver", other:"Other" };

const ROLE_COLORS = ["#C5612C","#3B82F6","#10B981","#F59E0B","#8B5CF6","#EF4444","#6B7280"];

export default function WorkerCostsPage() {
  const profile  = useAuthStore(s => s.profile);
  const tenantId = profile?.tenant_id;

  const [period,       setPeriod]       = useState("6");
  const [costs,        setCosts]        = useState(null);
  const [workers,      setWorkers]      = useState([]);
  const [payments,     setPayments]     = useState([]);
  const [revStats,     setRevStats]     = useState(null);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    const months = Number(period);
    const from = new Date(); from.setMonth(from.getMonth()-months+1); from.setDate(1);
    const fromISO = from.toISOString().slice(0,10);

    Promise.all([
      getWorkerCostsSummary(tenantId, months),
      getWorkers(tenantId, { status:"active" }),
      getWorkerPayments(tenantId, { limit:30 }),
      getRevenueStats(tenantId, { from: fromISO }),
    ]).then(([{ data: c }, { data: w }, { data: p }, { data: rv }]) => {
      setCosts(c);
      setWorkers(w ?? []);
      setPayments(p ?? []);
      setRevStats(rv);
    }).finally(() => setLoading(false));
  }, [tenantId, period]);

  // Monthly cost series for chart
  const costSeries = (costs?.monthSeries ?? []).map(s => ({
    month: fmtMonth(s.month),
    billed: s.cost,
    collected: s.cost, // cost is the same value — single bar
  }));

  const costAsRevenueRatio = revStats?.totalCollected > 0
    ? Math.round(((costs?.totalCost ?? 0) / revStats.totalCollected) * 100) : 0;

  const monthlyContracted = workers.reduce((s,w) => s + Number(w.salary), 0);

  if (loading) return (
    <DashboardLayout pageTitle="Worker Costs">
      <div style={{ display:"flex", justifyContent:"center", padding:80 }}><Spinner size="lg"/></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout pageTitle="Worker Costs">
      <PageHeader title="Worker Costs" subtitle="Payroll breakdown and workforce costs analysis"
        actions={
          <div style={{ display:"flex", border:"1.5px solid #EDE4D8", borderRadius:10, overflow:"hidden" }}>
            {[["3","3m"],["6","6m"],["12","12m"]].map(([v,label]) => (
              <button key={v} onClick={() => setPeriod(v)}
                style={{ padding:"6px 14px", fontSize:12, fontWeight:600, border:"none", cursor:"pointer",
                  background: period===v ? "#1A1412" : "#fff", color: period===v ? "#fff" : "#8B7355" }}>
                {label}
              </button>
            ))}
          </div>
        }
      />

      {/* ── KPI tiles ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:16, marginBottom:24 }}>
        <StatsCard label="Total Payroll Paid" value={formatCurrency(costs?.totalCost ?? 0)}   color="warning"
          sublabel={`Last ${period} months`}
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z"/></svg>} />
        <StatsCard label="Monthly Contracted" value={formatCurrency(monthlyContracted)}       color="neutral"
          sublabel={`${workers.length} active staff`}
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6"/></svg>} />
        <StatsCard label="Cost / Revenue" value={`${costAsRevenueRatio}%`}
          sublabel="Of collected rent" color={costAsRevenueRatio > 30 ? "error" : costAsRevenueRatio > 20 ? "warning" : "success"}
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>} />
        <StatsCard label="Active Staff" value={workers.length} color="neutral"
          sublabel={`${[...new Set(workers.map(w=>w.role))].length} different roles`}
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>} />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:20, marginBottom:24 }}>
        {/* Monthly cost trend */}
        <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", padding:"22px" }}>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17,
            color:"#1A1412", marginBottom:14 }}>Monthly Payroll Cost</h3>
          {costSeries.length > 0
            ? <RevenueChart data={costSeries.map(s => ({ ...s, collected: undefined }))} height={220} />
            : <p style={{ fontSize:13, color:"#8B7355", textAlign:"center", padding:"40px 0" }}>No payment history.</p>
          }
        </div>

        {/* Cost by role */}
        {costs?.byRole && (
          <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", padding:"22px" }}>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17,
              color:"#1A1412", marginBottom:14 }}>Cost by Role</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {Object.entries(costs.byRole).sort(([,a],[,b])=>b-a).map(([role,cost], i) => {
                const pct = costs.totalCost > 0 ? Math.round((cost/costs.totalCost)*100) : 0;
                return (
                  <div key={role}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ fontSize:12, fontWeight:600, color:"#1A1412", textTransform:"capitalize" }}>
                        {ROLE_LABELS[role] ?? role}
                      </span>
                      <span style={{ fontSize:12, color:"#8B7355" }}>{formatCurrency(cost)} · {pct}%</span>
                    </div>
                    <div style={{ height:6, borderRadius:999, background:"#F5EDE0", overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${pct}%`, borderRadius:999,
                        background: ROLE_COLORS[i % ROLE_COLORS.length] }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Active workers grid */}
      <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", padding:"22px", marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17,
            color:"#1A1412", margin:0 }}>Active Staff</h3>
          <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17,
            color:"#C5612C" }}>{formatCurrency(monthlyContracted)}<span style={{ fontSize:12, fontWeight:400,
            color:"#8B7355" }}>/mo contracted</span></span>
        </div>
        {workers.length === 0 ? (
          <EmptyState icon="workers" title="No active workers" description="No staff are currently employed." />
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:14 }}>
            {workers.map(w => (
              <div key={w.id} style={{ background:"#FAF7F2", border:"1px solid #EDE4D8",
                borderRadius:14, padding:"14px 16px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                  <Avatar name={w.full_name} size="sm"/>
                  <div style={{ minWidth:0 }}>
                    <p style={{ fontSize:13, fontWeight:700, color:"#1A1412", margin:0,
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{w.full_name}</p>
                    <p style={{ fontSize:11, color:"#8B7355", margin:"1px 0 0",
                      textTransform:"capitalize" }}>{ROLE_LABELS[w.role] ?? w.role}</p>
                  </div>
                </div>
                <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:900,
                  fontSize:17, color:"#1A1412", margin:"0 0 3px" }}>
                  {formatCurrency(w.salary)}<span style={{ fontSize:11, fontWeight:400, color:"#8B7355" }}>/mo</span>
                </p>
                <div style={{ display:"flex", gap:6 }}>
                  <Badge variant="active" size="sm"/>
                  <span style={{ fontSize:11, color:"#8B7355", textTransform:"capitalize" }}>{w.pay_cycle}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent salary payments */}
      {payments.length > 0 && (
        <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", overflow:"hidden" }}>
          <div style={{ padding:"16px 20px", borderBottom:"1px solid #EDE4D8" }}>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17,
              color:"#1A1412", margin:0 }}>Recent Salary Payments</h3>
          </div>
          {payments.slice(0,10).map((p, i) => (
            <div key={p.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 20px",
              borderBottom: i < Math.min(payments.length,10)-1 ? "1px solid #F5EDE0" : "none" }}>
              <Avatar name={p.workers?.full_name} size="sm"/>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:13, fontWeight:600, color:"#1A1412", margin:0 }}>
                  {p.workers?.full_name ?? "—"}
                </p>
                <p style={{ fontSize:11, color:"#8B7355", margin:"1px 0 0", textTransform:"capitalize" }}>
                  {ROLE_LABELS[p.workers?.role] ?? p.workers?.role} · {p.payment_method}
                </p>
              </div>
              <div style={{ textAlign:"right" }}>
                <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15,
                  color:"#10B981", margin:0 }}>{formatCurrency(p.amount)}</p>
                <p style={{ fontSize:11, color:"#8B7355", margin:"1px 0 0" }}>
                  {formatDate(p.paid_at ?? p.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
