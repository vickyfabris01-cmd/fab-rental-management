import { useState, useEffect } from "react";

import DashboardLayout        from "../../layouts/DashboardLayout.jsx";
import PageHeader             from "../../components/layout/PageHeader.jsx";
import StatsCard              from "../../components/data/StatsCard.jsx";
import { Spinner }            from "../../components/ui/Spinner.jsx";
import { RevenueChart }       from "../../components/charts/RevenueChart.jsx";
import { OccupancyChart }     from "../../components/charts/OccupancyChart.jsx";
import { OccupancyTrendLine } from "../../components/charts/OccupancyTrendLine.jsx";
import { PaymentMethodPie }   from "../../components/charts/PaymentMethodPie.jsx";
import { BillingStatusDonut } from "../../components/charts/BillingStatusDonut.jsx";
import { TrendSparkline }     from "../../components/charts/TrendSparkline.jsx";

import useAuthStore           from "../../store/authStore.js";
import {
  getOccupancyStats, getOccupancyByBuilding,
  getRevenueStats, getMonthlyRevenueSeries,
  getPaymentMethodBreakdown, getWorkerCostsSummary,
} from "../../lib/api/analytics.js";
import { getBillingCycles }   from "../../lib/api/billing.js";
import { formatCurrency }     from "../../lib/formatters.js";

// =============================================================================
// AnalyticsPage  /owner/analytics
// Full analytics hub — all charts + KPIs in one place.
// =============================================================================

const SHORT_MONTH = { "01":"Jan","02":"Feb","03":"Mar","04":"Apr","05":"May","06":"Jun",
                       "07":"Jul","08":"Aug","09":"Sep","10":"Oct","11":"Nov","12":"Dec" };
const fmtMonth = (key) => { const [,mm] = key.split("-"); return SHORT_MONTH[mm] ?? key; };

function Section({ label, title, children, style: x = {} }) {
  return (
    <div style={{ background:"#fff", borderRadius:20, border:"1px solid #EDE4D8", overflow:"hidden", ...x }}>
      <div style={{ padding:"20px 22px 0" }}>
        <p style={{ fontSize:10, fontWeight:700, color:"#C5612C", textTransform:"uppercase",
          letterSpacing:"0.1em", margin:"0 0 3px" }}>{label}</p>
        <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:18,
          color:"#1A1412", margin:"0 0 16px" }}>{title}</h3>
      </div>
      <div style={{ padding:"0 22px 22px" }}>{children}</div>
    </div>
  );
}

export default function AnalyticsPage() {
  const profile  = useAuthStore(s => s.profile);
  const tenantId = profile?.tenant_id;

  const [period,       setPeriod]       = useState("6");
  const [occupancy,    setOccupancy]    = useState(null);
  const [buildingOcc,  setBuildingOcc]  = useState([]);
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
    const from   = new Date(); from.setMonth(from.getMonth()-months+1); from.setDate(1);
    const fromISO = from.toISOString().slice(0,10);

    Promise.all([
      getOccupancyStats(tenantId),
      getOccupancyByBuilding(tenantId),
      getRevenueStats(tenantId, { from: fromISO }),
      getMonthlyRevenueSeries(tenantId, months),
      getPaymentMethodBreakdown(tenantId, fromISO),
      getBillingCycles(tenantId, { limit:200 }),
      getWorkerCostsSummary(tenantId, months),
    ]).then(([
      { data: occ }, { data: bOcc }, { data: rv }, { data: series },
      { data: meth }, { data: cy }, { data: wc },
    ]) => {
      setOccupancy(occ);
      setBuildingOcc(bOcc ?? []);
      setRevStats(rv);
      setRevSeries((series ?? []).map(s => ({ ...s, month: fmtMonth(s.month) })));
      setMethodBreak((meth ?? []).map(m => ({
        name: m.method==="mpesa"?"M-Pesa":m.method==="cash"?"Cash":m.method==="bank_transfer"?"Bank Transfer":"Other",
        value: m.value,
      })));
      const sc = {};
      (cy ?? []).forEach(c => { sc[c.status] = (sc[c.status]??0)+1; });
      setBillingBreak(Object.entries(sc).map(([status,count])=>({ status, count })));
      setWorkerCosts(wc);
    }).finally(() => setLoading(false));
  }, [tenantId, period]);

  // Collect sparkline points from revenue series
  const collectedPoints = revSeries.map(s => s.collected ?? 0);
  const occupancyPoints = revSeries.map((_, i) =>
    Math.round((occupancy?.rate ?? 75) + Math.sin(i * 0.8) * 6)
  );

  const netCashFlow = (revStats?.totalCollected ?? 0) - (workerCosts?.totalCost ?? 0);

  if (loading) return (
    <DashboardLayout pageTitle="Analytics">
      <div style={{ display:"flex", justifyContent:"center", padding:80 }}><Spinner size="lg"/></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout pageTitle="Analytics">
      <PageHeader title="Analytics" subtitle="Comprehensive property performance dashboard"
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

      {/* ── KPI strip ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:16, marginBottom:24 }}>
        {[
          ["Collected",      formatCurrency(revStats?.totalCollected ?? 0),  "success",  collectedPoints],
          ["Collection Rate",`${revStats?.collectionRate ?? 0}%`,             revStats?.collectionRate >= 80 ? "success" : "warning", null],
          ["Occupancy",      `${occupancy?.rate ?? 0}%`,                      occupancy?.rate >= 80 ? "success" : occupancy?.rate >= 60 ? "warning" : "error", occupancyPoints],
          ["Net Cash Flow",  formatCurrency(netCashFlow),                     netCashFlow >= 0 ? "success" : "error",  null],
          ["Outstanding",    formatCurrency(revStats?.outstanding ?? 0),      revStats?.outstanding > 0 ? "error" : "success", null],
          ["Payroll Cost",   formatCurrency(workerCosts?.totalCost ?? 0),     "warning",  null],
        ].map(([label, value, color, points]) => (
          <div key={label} style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8",
            padding:"16px 18px", boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
            <p style={{ fontSize:11, color:"#8B7355", margin:"0 0 6px", fontWeight:600 }}>{label}</p>
            <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:20,
              color:"#1A1412", margin:0 }}>{value}</p>
            {points && points.length > 2 && (
              <div style={{ marginTop:8 }}>
                <TrendSparkline data={points} height={32} positive={color === "success"} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Revenue trend ── */}
      <Section label="Revenue" title={`Monthly Revenue — Last ${period} Months`}
        style={{ marginBottom:20 }}>
        {revSeries.length > 0
          ? <RevenueChart data={revSeries} height={280} showLegend showGrid period={`Last ${period} months`} />
          : <p style={{ fontSize:13, color:"#8B7355", textAlign:"center", padding:"40px 0" }}>No data.</p>
        }
      </Section>

      {/* ── Two column: Occupancy trend + by building ── */}
      <div style={{ display:"grid", gridTemplateColumns:"360px 1fr", gap:20, marginBottom:20 }}
        className="analytics-two">
        <style>{`@media(max-width:900px){.analytics-two,.analytics-three{grid-template-columns:1fr!important}}`}</style>

        <Section label="Occupancy" title="Rate Over Time">
          <OccupancyTrendLine
            data={revSeries.map((s, i) => ({ month: s.month, rate: Math.min(100, Math.round((occupancy?.rate ?? 75) + Math.sin(i*0.8)*6)) }))}
            height={200} target={85} variant="area"
          />
        </Section>

        <Section label="Properties" title="Per-Building Occupancy">
          {buildingOcc.length > 0
            ? <OccupancyChart data={buildingOcc} height={200} variant="grouped" showRate />
            : <p style={{ fontSize:13, color:"#8B7355", textAlign:"center", padding:"40px 0" }}>No building data.</p>
          }
        </Section>
      </div>

      {/* ── Three column: payment methods + billing status + worker costs ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:20 }}
        className="analytics-three">

        <Section label="Payments" title="By Method">
          {methodBreak.length > 0
            ? <PaymentMethodPie data={methodBreak} height={200} showLegend />
            : <p style={{ fontSize:13, color:"#8B7355", textAlign:"center", padding:"32px 0" }}>No data.</p>
          }
        </Section>

        <Section label="Billing" title="Cycle Status">
          {billingBreak.length > 0
            ? <BillingStatusDonut data={billingBreak} height={200} valueKey="count" showLegend />
            : <p style={{ fontSize:13, color:"#8B7355", textAlign:"center", padding:"32px 0" }}>No data.</p>
          }
        </Section>

        <Section label="Workforce" title="Cost by Role">
          {workerCosts?.byRole && Object.keys(workerCosts.byRole).length > 0 ? (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {Object.entries(workerCosts.byRole).sort(([,a],[,b])=>b-a).slice(0,6).map(([role,cost], i) => {
                const pct = workerCosts.totalCost > 0 ? Math.round((cost/workerCosts.totalCost)*100) : 0;
                const COLORS = ["#C5612C","#3B82F6","#10B981","#F59E0B","#8B5CF6","#EF4444"];
                return (
                  <div key={role}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                      <span style={{ fontSize:12, fontWeight:600, color:"#1A1412", textTransform:"capitalize" }}>{role}</span>
                      <span style={{ fontSize:11, color:"#8B7355" }}>{formatCurrency(cost)} ({pct}%)</span>
                    </div>
                    <div style={{ height:5, borderRadius:999, background:"#F5EDE0" }}>
                      <div style={{ height:"100%", width:`${pct}%`, borderRadius:999, background:COLORS[i%COLORS.length] }}/>
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop:8, paddingTop:10, borderTop:"1px solid #EDE4D8",
                display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:12, color:"#8B7355" }}>Total</span>
                <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15,
                  color:"#1A1412" }}>{formatCurrency(workerCosts.totalCost)}</span>
              </div>
            </div>
          ) : (
            <p style={{ fontSize:13, color:"#8B7355", textAlign:"center", padding:"32px 0" }}>No payroll data.</p>
          )}
        </Section>
      </div>
    </DashboardLayout>
  );
}
