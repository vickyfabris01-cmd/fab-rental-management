import { useState, useEffect } from "react";

import DashboardLayout        from "../../layouts/DashboardLayout.jsx";
import PageHeader             from "../../components/layout/PageHeader.jsx";
import { TabBar }             from "../../components/navigation/TabBar.jsx";
import { Pagination }         from "../../components/navigation/TabBar.jsx";
import Badge                  from "../../components/ui/Badge.jsx";
import Avatar                 from "../../components/ui/Avatar.jsx";
import StatsCard              from "../../components/data/StatsCard.jsx";
import { Spinner }            from "../../components/ui/Spinner.jsx";
import { EmptyState }         from "../../components/ui/Spinner.jsx";
import { Alert }              from "../../components/ui/Alert.jsx";
import { BillingStatusDonut } from "../../components/charts/BillingStatusDonut.jsx";

import useAuthStore           from "../../store/authStore.js";
import { getBillingCycles, getOverdueCycles } from "../../lib/api/billing.js";
import { getRevenueStats }    from "../../lib/api/analytics.js";
import { formatCurrency, formatDate, formatBillingPeriod } from "../../lib/formatters.js";
import { useDebounce }        from "../../hooks/useDebounce.js";

// =============================================================================
// OwnerBillingPage  /owner/billing
// Read-only — owners can view billing but not modify it directly.
// =============================================================================

const PAGE_SIZE = 20;

function CycleRow({ cycle }) {
  const total    = Number(cycle.amount_due) + Number(cycle.late_fee ?? 0);
  const isPaid   = ["paid","waived","cancelled"].includes(cycle.status);
  const isOverdue= !isPaid && cycle.due_date < new Date().toISOString().slice(0,10);
  const client   = cycle.profiles;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 20px", borderBottom:"1px solid #F5EDE0",
      background: isOverdue ? "#FFFCFC" : "transparent" }}>
      <Avatar name={client?.full_name} src={client?.avatar_url} size="sm" />
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:13, fontWeight:600, color:"#1A1412", margin:0,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{client?.full_name ?? "—"}</p>
        <p style={{ fontSize:11, color:"#8B7355", margin:"2px 0 0" }}>
          {cycle.rooms?.room_number ? `Room ${cycle.rooms.room_number}` : ""}
          {" · "}
          {formatBillingPeriod(cycle.period_start, cycle.period_end, cycle.billing_type)}
        </p>
      </div>
      <div style={{ textAlign:"right", minWidth:90 }}>
        <p style={{ fontSize:13, fontWeight:700, color: isOverdue ? "#DC2626" : "#1A1412",
          margin:0, fontFamily:"'Playfair Display',serif" }}>{formatCurrency(total)}</p>
        <p style={{ fontSize:11, color: isOverdue ? "#DC2626" : "#8B7355", margin:"1px 0 0" }}>
          Due {formatDate(cycle.due_date)}{isOverdue ? " ⚠" : ""}
        </p>
      </div>
      <Badge variant={cycle.status} size="sm" style={{ flexShrink:0 }} />
    </div>
  );
}

export default function OwnerBillingPage() {
  const profile  = useAuthStore(s => s.profile);
  const tenantId = profile?.tenant_id;

  const [cycles,     setCycles]     = useState([]);
  const [overdue,    setOverdue]    = useState([]);
  const [revStats,   setRevStats]   = useState(null);
  const [statusBreak,setStatusBreak]= useState([]);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState("all");
  const [search,     setSearch]     = useState("");
  const [page,       setPage]       = useState(1);
  const [total,      setTotal]      = useState(0);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    const opts = { limit: PAGE_SIZE, offset:(page-1)*PAGE_SIZE };
    if (tab !== "all") opts.status = tab;

    const from = new Date(); from.setMonth(from.getMonth()-5); from.setDate(1);
    const fromISO = from.toISOString().slice(0,10);

    Promise.all([
      getBillingCycles(tenantId, opts),
      getOverdueCycles(tenantId, 20),
      getRevenueStats(tenantId, { from: fromISO }),
      getBillingCycles(tenantId, { limit:200 }),
    ]).then(([{ data: cy, count }, { data: od }, { data: rv }, { data: all }]) => {
      setCycles(cy ?? []);
      setTotal(count ?? cy?.length ?? 0);
      setOverdue(od ?? []);
      setRevStats(rv);
      const sc = {};
      (all ?? []).forEach(c => { sc[c.status] = (sc[c.status]??0)+1; });
      setStatusBreak(Object.entries(sc).map(([status,count]) => ({ status, count })));
    }).finally(() => setLoading(false));
  }, [tenantId, tab, page]);

  const filtered = debouncedSearch
    ? cycles.filter(c => c.profiles?.full_name?.toLowerCase().includes(debouncedSearch.toLowerCase()))
    : cycles;

  const TABS = [
    { value:"all",     label:"All"     },
    { value:"unpaid",  label:"Unpaid"  },
    { value:"partial", label:"Partial" },
    { value:"overdue", label:"Overdue", count: overdue.length || undefined },
    { value:"paid",    label:"Paid"    },
  ];

  return (
    <DashboardLayout pageTitle="Billing">
      <PageHeader title="Billing Overview" subtitle="View all billing cycles and collection status" />

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:16, marginBottom:24 }}>
        <StatsCard label="Total Billed"   value={formatCurrency(revStats?.totalBilled ?? 0)}    color="neutral"
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5h6"/></svg>} />
        <StatsCard label="Collected"       value={formatCurrency(revStats?.totalCollected ?? 0)} color="success"
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6"/></svg>} />
        <StatsCard label="Outstanding"     value={formatCurrency(revStats?.outstanding ?? 0)}    color={revStats?.outstanding > 0 ? "error" : "success"}
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>} />
        <StatsCard label="Collection Rate" value={`${revStats?.collectionRate ?? 0}%`}           color={revStats?.collectionRate >= 80 ? "success" : "warning"}
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>} />
      </div>

      {/* Overdue alert + donut */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:20, marginBottom:24 }}>
        <div>
          {overdue.length > 0 && (
            <Alert type="warning" title={`${overdue.length} overdue payment${overdue.length>1?"s":""}`}
              message={`Total outstanding overdue: ${formatCurrency(overdue.reduce((s,c)=>s+Number(c.amount_due)+Number(c.late_fee??0),0))}. Contact your manager to issue reminders.`}
              style={{ marginBottom:14 }}
            />
          )}
          {/* Overdue list */}
          {overdue.length > 0 && (
            <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", overflow:"hidden" }}>
              <p style={{ fontSize:12, fontWeight:700, color:"#DC2626", textTransform:"uppercase",
                letterSpacing:"0.08em", padding:"12px 20px 0" }}>Overdue</p>
              {overdue.map(c => <CycleRow key={c.id} cycle={c} />)}
            </div>
          )}
        </div>

        {/* Status donut */}
        {statusBreak.length > 0 && (
          <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", padding:"20px" }}>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:16,
              color:"#1A1412", marginBottom:12 }}>Status Breakdown</h3>
            <BillingStatusDonut data={statusBreak} height={180} valueKey="count" showLegend />
          </div>
        )}
      </div>

      {/* Cycles table */}
      <div style={{ display:"flex", gap:12, marginBottom:14, alignItems:"center", flexWrap:"wrap" }}>
        <TabBar tabs={TABS} active={tab} onChange={v => { setTab(v); setPage(1); }} />
        <div style={{ position:"relative", marginLeft:"auto" }}>
          <svg style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9B8A79" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search resident…"
            style={{ paddingLeft:30, paddingRight:14, paddingTop:8, paddingBottom:8, border:"1.5px solid #E8DDD4", borderRadius:999, fontSize:13, color:"#1A1412", background:"#fff", outline:"none", width:200 }}
            onFocus={e => e.target.style.borderColor="#C5612C"}
            onBlur={e  => e.target.style.borderColor="#E8DDD4"}
          />
        </div>
      </div>

      <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", overflow:"hidden" }}>
        <div style={{ padding:"9px 20px", background:"#FAF7F2", borderBottom:"1.5px solid #EDE4D8" }}>
          <p style={{ fontSize:11, fontWeight:700, color:"#8B7355", textTransform:"uppercase", letterSpacing:"0.06em", margin:0 }}>
            {total} cycle{total!==1?"s":""} found
          </p>
        </div>
        {loading ? (
          <div style={{ display:"flex", justifyContent:"center", padding:48 }}><Spinner size="md"/></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="billing" title="No cycles" description="No billing cycles match the selected filter." />
        ) : (
          filtered.map(c => <CycleRow key={c.id} cycle={c} />)
        )}
      </div>

      <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
    </DashboardLayout>
  );
}
