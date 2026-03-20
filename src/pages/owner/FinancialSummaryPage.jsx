import { useState, useEffect } from "react";
import { Link }                from "react-router-dom";

import DashboardLayout         from "../../layouts/DashboardLayout.jsx";
import PageHeader              from "../../components/layout/PageHeader.jsx";
import StatsCard               from "../../components/data/StatsCard.jsx";
import { Spinner }             from "../../components/ui/Spinner.jsx";
import { Alert }               from "../../components/ui/Alert.jsx";
import { RevenueChart }        from "../../components/charts/RevenueChart.jsx";
import { PaymentMethodPie }    from "../../components/charts/PaymentMethodPie.jsx";
import { BillingStatusDonut }  from "../../components/charts/BillingStatusDonut.jsx";

import useAuthStore            from "../../store/authStore.js";
import { getRevenueStats, getMonthlyRevenueSeries, getPaymentMethodBreakdown } from "../../lib/api/analytics.js";
import { getBillingCycles }    from "../../lib/api/billing.js";
import { getWorkerCostsSummary } from "../../lib/api/analytics.js";
import { formatCurrency }      from "../../lib/formatters.js";

// =============================================================================
// FinancialSummaryPage  /owner/financials
// =============================================================================

const SHORT_MONTH = { "01":"Jan","02":"Feb","03":"Mar","04":"Apr","05":"May","06":"Jun",
                       "07":"Jul","08":"Aug","09":"Sep","10":"Oct","11":"Nov","12":"Dec" };
const fmtMonth = (key) => { const [,mm] = key.split("-"); return SHORT_MONTH[mm] ?? key; };

function StatRow({ label, value, sub, highlight }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
      padding:"13px 0", borderBottom:"1px solid #F5EDE0" }}>
      <div>
        <p style={{ fontSize:14, fontWeight:600, color:"#1A1412", margin:0 }}>{label}</p>
        {sub && <p style={{ fontSize:11, color:"#8B7355", margin:"2px 0 0" }}>{sub}</p>}
      </div>
      <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:18,
        color: highlight ?? "#1A1412", margin:0 }}>{value}</p>
    </div>
  );
}

export default function FinancialSummaryPage() {
  const profile  = useAuthStore(s => s.profile);
  const tenantId = profile?.tenant_id;

  const [period,       setPeriod]       = useState("6");
  const [revStats,     setRevStats]     = useState(null);
  const [revSeries,    setRevSeries]    = useState([]);
  const [methodBreak,  setMethodBreak]  = useState([]);
  const [billingBreak, setBillingBreak] = useState([]);
  const [workerCosts,  setWorkerCosts]  = useState(null);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    const months = Number(period);
    const from = new Date();
    from.setMonth(from.getMonth() - months + 1);
    from.setDate(1);
    const fromISO = from.toISOString().slice(0, 10);

    Promise.all([
      getRevenueStats(tenantId, { from: fromISO }),
      getMonthlyRevenueSeries(tenantId, months),
      getPaymentMethodBreakdown(tenantId, fromISO),
      getBillingCycles(tenantId, { limit:200 }),
      getWorkerCostsSummary(tenantId, months),
    ]).then(([{ data: rv }, { data: series }, { data: meth }, { data: cy }, { data: wc }]) => {
      setRevStats(rv);
      setRevSeries((series ?? []).map(s => ({ ...s, month: fmtMonth(s.month) })));
      setMethodBreak((meth ?? []).map(m => ({
        name: m.method === "mpesa" ? "M-Pesa" : m.method === "cash" ? "Cash" : m.method === "bank_transfer" ? "Bank Transfer" : "Other",
        value: m.value,
      })));
      // Billing status breakdown
      const statusCount = {};
      (cy ?? []).forEach(c => { statusCount[c.status] = (statusCount[c.status]??0)+1; });
      setBillingBreak(Object.entries(statusCount).map(([status,count]) => ({ status, count })));
      setWorkerCosts(wc);
    }).finally(() => setLoading(false));
  }, [tenantId, period]);

  const netCashFlow = (revStats?.totalCollected ?? 0) - (workerCosts?.totalCost ?? 0);
  const profitMargin = revStats?.totalCollected > 0
    ? Math.round((netCashFlow / revStats.totalCollected) * 100) : 0;

  if (loading) return (
    <DashboardLayout pageTitle="Financial Summary">
      <div style={{ display:"flex", justifyContent:"center", padding:80 }}><Spinner size="lg"/></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout pageTitle="Financial Summary">
      <PageHeader title="Financial Summary"
        subtitle={`Revenue, costs, and profitability over the last ${period} months`}
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
        <StatsCard label="Revenue Billed"    value={formatCurrency(revStats?.totalBilled ?? 0)}    color="neutral"
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5h6"/></svg>} />
        <StatsCard label="Collected"          value={formatCurrency(revStats?.totalCollected ?? 0)} color="success"
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6"/></svg>} />
        <StatsCard label="Outstanding"        value={formatCurrency(revStats?.outstanding ?? 0)}    color={revStats?.outstanding > 0 ? "error" : "success"}
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>} />
        <StatsCard label="Worker Costs"       value={formatCurrency(workerCosts?.totalCost ?? 0)}   color="warning"
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z"/></svg>} />
        <StatsCard label="Net Cash Flow"      value={formatCurrency(netCashFlow)}                   color={netCashFlow >= 0 ? "success" : "error"}
          sublabel={`${profitMargin}% profit margin`}
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>} />
        <StatsCard label="Collection Rate"    value={`${revStats?.collectionRate ?? 0}%`}           color={revStats?.collectionRate >= 80 ? "success" : revStats?.collectionRate >= 60 ? "warning" : "error"}
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>} />
      </div>

      {/* ── Revenue chart ── */}
      <div style={{ background:"#fff", borderRadius:20, border:"1px solid #EDE4D8", padding:"22px", marginBottom:20 }}>
        <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:18,
          color:"#1A1412", marginBottom:16 }}>Monthly Revenue</h3>
        {revSeries.length > 0
          ? <RevenueChart data={revSeries} height={280} showLegend showGrid />
          : <p style={{ fontSize:13, color:"#8B7355", textAlign:"center", padding:"40px 0" }}>No data for this period.</p>
        }
      </div>

      {/* ── Three column: P&L + methods + billing status ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 260px 260px", gap:20, marginBottom:20 }}
        className="fin-grid">
        <style>{`@media(max-width:900px){.fin-grid{grid-template-columns:1fr!important}}`}</style>

        {/* P&L */}
        <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", padding:"22px" }}>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17,
            color:"#1A1412", marginBottom:4 }}>P&L Summary</h3>
          <p style={{ fontSize:12, color:"#8B7355", marginBottom:16 }}>Last {period} months</p>
          <StatRow label="Total Billed"    value={formatCurrency(revStats?.totalBilled ?? 0)} />
          <StatRow label="Total Collected" value={formatCurrency(revStats?.totalCollected ?? 0)} highlight="#10B981" />
          <StatRow label="Outstanding"     value={formatCurrency(revStats?.outstanding ?? 0)}   highlight={revStats?.outstanding > 0 ? "#DC2626" : undefined} />
          <div style={{ height:1, background:"#EDE4D8", margin:"4px 0" }}/>
          <StatRow label="Worker Costs"    value={formatCurrency(workerCosts?.totalCost ?? 0)}  highlight="#D97706" />
          <div style={{ height:1, background:"#EDE4D8", margin:"4px 0" }}/>
          <StatRow label="Net Cash Flow"   value={formatCurrency(netCashFlow)}
            sub={`${profitMargin}% margin`} highlight={netCashFlow >= 0 ? "#10B981" : "#DC2626"} />
        </div>

        {/* Payment methods */}
        <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", padding:"22px" }}>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17,
            color:"#1A1412", marginBottom:16 }}>Payment Methods</h3>
          {methodBreak.length > 0
            ? <PaymentMethodPie data={methodBreak} height={180} showLegend />
            : <p style={{ fontSize:13, color:"#8B7355", textAlign:"center", padding:"32px 0" }}>No data.</p>
          }
        </div>

        {/* Billing status */}
        <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", padding:"22px" }}>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17,
            color:"#1A1412", marginBottom:16 }}>Billing Status</h3>
          {billingBreak.length > 0
            ? <BillingStatusDonut data={billingBreak} height={180} valueKey="count" />
            : <p style={{ fontSize:13, color:"#8B7355", textAlign:"center", padding:"32px 0" }}>No data.</p>
          }
        </div>
      </div>

      {/* Worker cost by role */}
      {workerCosts?.byRole && Object.keys(workerCosts.byRole).length > 0 && (
        <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", padding:"22px" }}>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17,
            color:"#1A1412", marginBottom:16 }}>Worker Cost by Role</h3>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:12 }}>
            {Object.entries(workerCosts.byRole).map(([role, cost]) => (
              <div key={role} style={{ background:"#FAF7F2", border:"1px solid #EDE4D8",
                borderRadius:12, padding:"14px 16px" }}>
                <p style={{ fontSize:12, color:"#8B7355", margin:"0 0 4px", textTransform:"capitalize" }}>{role}</p>
                <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:17,
                  color:"#1A1412", margin:0 }}>{formatCurrency(cost)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
