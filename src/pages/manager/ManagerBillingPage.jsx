import { useState, useEffect, useCallback } from "react";

import DashboardLayout      from "../../layouts/DashboardLayout.jsx";
import PageHeader           from "../../components/layout/PageHeader.jsx";
import { TabBar }           from "../../components/navigation/TabBar.jsx";
import { Pagination }       from "../../components/navigation/TabBar.jsx";
import Badge                from "../../components/ui/Badge.jsx";
import Avatar               from "../../components/ui/Avatar.jsx";
import Button               from "../../components/ui/Button.jsx";
import { Spinner }          from "../../components/ui/Spinner.jsx";
import { EmptyState }       from "../../components/ui/Spinner.jsx";
import { Alert }            from "../../components/ui/Alert.jsx";
import StatsCard            from "../../components/data/StatsCard.jsx";
import ManualPaymentModal   from "../../components/modals/ManualPaymentModal.jsx";
import GenerateInvoiceModal from "../../components/modals/GenerateInvoiceModal.jsx";

import useAuthStore         from "../../store/authStore.js";
import { getBillingCycles, getBillingSummary, getOverdueCycles } from "../../lib/api/billing.js";
import { formatCurrency, formatDate, formatBillingPeriod } from "../../lib/formatters.js";
import { useDebounce }      from "../../hooks/useDebounce.js";
import { useToast }         from "../../hooks/useNotifications.js";
import { useLocation } from "react-router-dom";

// =============================================================================
// ManagerBillingPage  /manage/billing/cycles
// =============================================================================

const PAGE_SIZE = 20;

const Ic = ({ d }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

function CycleRow({ cycle, onPay, onInvoice }) {
  const total     = Number(cycle.amount_due) + Number(cycle.late_fee ?? 0);
  const isPaid    = ["paid", "waived", "cancelled"].includes(cycle.status);
  const isOverdue = !isPaid && cycle.due_date < new Date().toISOString().slice(0, 10);
  const client    = cycle.profiles;

  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 20px", borderBottom:"1px solid #F5EDE0", background: isOverdue ? "#FFFCFC" : "transparent" }}
      onMouseOver={e => e.currentTarget.style.background = isOverdue ? "#FEF9F9" : "#FFFAF6"}
      onMouseOut={e  => e.currentTarget.style.background = isOverdue ? "#FFFCFC" : "transparent"}
    >
      <Avatar name={client?.full_name} src={client?.avatar_url} size="sm" />
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:13, fontWeight:600, color:"#1A1412", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {client?.full_name ?? "—"}
        </p>
        <p style={{ fontSize:11, color:"#8B7355", margin:"2px 0 0" }}>
          {cycle.rooms?.room_number ? `Room ${cycle.rooms.room_number}` : ""} · {formatBillingPeriod(cycle.period_start, cycle.period_end, cycle.billing_type)}
        </p>
      </div>
      <div style={{ textAlign:"right", minWidth:100 }}>
        <p style={{ fontSize:13, fontWeight:700, color: isOverdue ? "#DC2626" : "#1A1412", margin:0, fontFamily:"'Playfair Display',serif" }}>
          {formatCurrency(total)}
        </p>
        <p style={{ fontSize:11, color: isOverdue ? "#DC2626" : "#8B7355", margin:"1px 0 0" }}>
          Due {formatDate(cycle.due_date)}{isOverdue ? " ⚠" : ""}
        </p>
      </div>
      <Badge variant={cycle.status} size="sm" style={{ flexShrink:0 }} />
      <div style={{ display:"flex", gap:6, flexShrink:0 }}>
        {!isPaid && (
          <button onClick={() => onPay(cycle)}
            style={{ fontSize:11, fontWeight:700, color:"#fff", background:"#C5612C", border:"none", borderRadius:999, padding:"5px 10px", cursor:"pointer", transition:"background 0.15s" }}
            onMouseOver={e => e.currentTarget.style.background = "#A84E22"}
            onMouseOut={e  => e.currentTarget.style.background = "#C5612C"}
          >Record Payment</button>
        )}
        <button onClick={() => onInvoice(cycle)}
          style={{ display:"flex", alignItems:"center", justifyContent:"center", width:28, height:28, borderRadius:"50%", background:"#FAF7F2", border:"1px solid #EDE4D8", cursor:"pointer", color:"#8B7355", transition:"all 0.15s" }}
          title="Generate Invoice"
          onMouseOver={e => { e.currentTarget.style.background="#C5612C"; e.currentTarget.style.color="#fff"; e.currentTarget.style.borderColor="#C5612C"; }}
          onMouseOut={e  => { e.currentTarget.style.background="#FAF7F2"; e.currentTarget.style.color="#8B7355"; e.currentTarget.style.borderColor="#EDE4D8"; }}
        >
          <Ic d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8" />
        </button>
      </div>
    </div>
  );
}

export default function ManagerBillingPage() {
  const profile  = useAuthStore(s => s.profile);
  const tenantId = profile?.tenant_id;
  const toast    = useToast();

  const [cycles,       setCycles]       = useState([]);
  const [summary,      setSummary]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [tab,          setTab]          = useState("all");
  const [search,       setSearch]       = useState("");
  const [page,         setPage]         = useState(1);
  const [total,        setTotal]        = useState(0);
  const [payTarget,    setPayTarget]    = useState(null);
  const [invoiceTarget,setInvoiceTarget]= useState(null);

  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(() => {
    if (!tenantId) return;
    setLoading(true);
    const opts = { limit: PAGE_SIZE, offset:(page-1)*PAGE_SIZE };
    if (tab !== "all") opts.status = tab;
    Promise.all([
      getBillingCycles(tenantId, opts),
      getBillingSummary(tenantId),
    ]).then(([{ data: cy, count }, { data: sum }]) => {
      setCycles(cy ?? []);
      setTotal(count ?? cy?.length ?? 0);
      setSummary(sum);
    }).finally(() => setLoading(false));
  }, [tenantId, tab, page]);

  useEffect(() => { load(); }, [load]);

  const filtered = debouncedSearch
    ? cycles.filter(c => c.profiles?.full_name?.toLowerCase().includes(debouncedSearch.toLowerCase()) || c.rooms?.room_number?.includes(debouncedSearch))
    : cycles;

  const TABS = [
    { value:"all",     label:"All"     },
    { value:"unpaid",  label:"Unpaid"  },
    { value:"partial", label:"Partial" },
    { value:"overdue", label:"Overdue" },
    { value:"paid",    label:"Paid"    },
    { value:"waived",  label:"Waived"  },
  ];

  return (
    <DashboardLayout pageTitle="Billing">
      <PageHeader title="Billing Cycles" subtitle="View and manage all tenant billing" />

      {/* Summary stats */}
      {summary && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:16, marginBottom:24 }}>
          <StatsCard label="Total Billed" value={formatCurrency(summary.totalBilled ?? 0)} color="neutral"
            icon={<Ic d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5h6"/>} />
          <StatsCard label="Collected" value={formatCurrency(summary.totalPaid ?? 0)} color="success"
            icon={<Ic d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6"/>} />
          <StatsCard label="Outstanding" value={formatCurrency(summary.totalOutstanding ?? 0)} color={summary.totalOutstanding > 0 ? "error" : "success"}
            icon={<Ic d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/>} />
          <StatsCard label="Collection Rate" value={`${summary.totalBilled ? Math.round((summary.totalPaid/summary.totalBilled)*100) : 0}%`} color="brand"
            icon={<Ic d="M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3"/>} />
        </div>
      )}

      {/* Filters row */}
      <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:16, flexWrap:"wrap" }}>
        <TabBar tabs={TABS} active={tab} onChange={v => { setTab(v); setPage(1); }} />
        <div style={{ position:"relative", marginLeft:"auto" }}>
          <svg style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9B8A79" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search resident or room…"
            style={{ paddingLeft:30, paddingRight:14, paddingTop:8, paddingBottom:8, border:"1.5px solid #E8DDD4", borderRadius:999, fontSize:13, color:"#1A1412", background:"#fff", outline:"none", width:220 }}
            onFocus={e => e.target.style.borderColor="#C5612C"}
            onBlur={e  => e.target.style.borderColor="#E8DDD4"}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", overflow:"hidden" }}>
        <div style={{ display:"grid", gridTemplateColumns:"36px 1fr 120px 70px 120px", gap:0, padding:"9px 20px", background:"#FAF7F2", borderBottom:"1.5px solid #EDE4D8" }}>
          {["","Resident / Period","Amount","Status",""].map((h,i) => (
            <p key={i} style={{ fontSize:11, fontWeight:700, color:"#8B7355", textTransform:"uppercase", letterSpacing:"0.06em", margin:0 }}>{h}</p>
          ))}
        </div>
        {loading ? (
          <div style={{ display:"flex", justifyContent:"center", padding:48 }}><Spinner size="md"/></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="billing" title="No billing cycles" description="Cycles are created automatically when residents move in." />
        ) : (
          filtered.map(c => <CycleRow key={c.id} cycle={c} onPay={setPayTarget} onInvoice={setInvoiceTarget} />)
        )}
      </div>

      <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />

      <ManualPaymentModal isOpen={!!payTarget} onClose={() => setPayTarget(null)} cycle={payTarget}
        onSuccess={() => { setPayTarget(null); load(); }} />
      <GenerateInvoiceModal isOpen={!!invoiceTarget} onClose={() => setInvoiceTarget(null)} cycle={invoiceTarget}
        onSuccess={() => setInvoiceTarget(null)} />
    </DashboardLayout>
  );
}
