import { useState, useEffect, useCallback } from "react";

import DashboardLayout    from "../../layouts/DashboardLayout.jsx";
import PageHeader         from "../../components/layout/PageHeader.jsx";
import { TabBar }         from "../../components/navigation/TabBar.jsx";
import { Pagination }     from "../../components/navigation/TabBar.jsx";
import Badge              from "../../components/ui/Badge.jsx";
import Avatar             from "../../components/ui/Avatar.jsx";
import Button             from "../../components/ui/Button.jsx";
import { Spinner }        from "../../components/ui/Spinner.jsx";
import { EmptyState }     from "../../components/ui/Spinner.jsx";
import StatsCard          from "../../components/data/StatsCard.jsx";
import ManualPaymentModal from "../../components/modals/ManualPaymentModal.jsx";

import useAuthStore       from "../../store/authStore.js";
import { getPayments, getPaymentSummary } from "../../lib/api/payments.js";
import { getBillingCycles }               from "../../lib/api/billing.js";
import { formatCurrency, formatDate, formatRelativeTime } from "../../lib/formatters.js";
import { useDebounce }    from "../../hooks/useDebounce.js";
import { useLocation } from "react-router-dom";

// =============================================================================
// ManagerPaymentsPage  /manage/billing/payments
// =============================================================================

const PAGE_SIZE = 20;
const METHOD_LABELS = { mpesa:"M-Pesa", cash:"Cash", bank_transfer:"Bank Transfer", other:"Other" };
const METHOD_ICONS  = { mpesa:"📱", cash:"💵", bank_transfer:"🏦", other:"🔁" };

function PaymentRow({ payment }) {
  const isOk = payment.payment_status === "confirmed";
  const client = payment.client;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 20px", borderBottom:"1px solid #F5EDE0" }}
      onMouseOver={e => e.currentTarget.style.background = "#FFFAF6"}
      onMouseOut={e  => e.currentTarget.style.background = "transparent"}
    >
      <div style={{ width:36, height:36, borderRadius:10, background: isOk ? "#ECFDF5" : "#FEF2F2", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:16 }}>
        {METHOD_ICONS[payment.payment_method] ?? "🔁"}
      </div>
      <Avatar name={client?.full_name} src={client?.avatar_url} size="sm" />
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:13, fontWeight:600, color:"#1A1412", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {client?.full_name ?? "—"}
        </p>
        <p style={{ fontSize:11, color:"#8B7355", margin:"2px 0 0" }}>
          {METHOD_LABELS[payment.payment_method] ?? payment.payment_method}
          {payment.mpesa_receipt && <span style={{ fontFamily:"'DM Mono','Courier New',monospace", marginLeft:6 }}>{payment.mpesa_receipt}</span>}
          {payment.recorded_by && <span style={{ color:"#C5612C", marginLeft:8 }}>· Manual entry</span>}
        </p>
      </div>
      <div style={{ textAlign:"right", flexShrink:0, minWidth:90 }}>
        <p style={{ fontSize:14, fontWeight:700, color: isOk ? "#10B981" : "#8B7355", margin:0, fontFamily:"'Playfair Display',serif" }}>
          {formatCurrency(payment.amount)}
        </p>
        <p style={{ fontSize:11, color:"#8B7355", margin:"1px 0 0" }}>{formatRelativeTime(payment.created_at)}</p>
      </div>
      <Badge variant={payment.payment_status} size="sm" style={{ flexShrink:0 }} />
    </div>
  );
}

export default function ManagerPaymentsPage() {
  const profile  = useAuthStore(s => s.profile);
  const tenantId = profile?.tenant_id;

  const [payments,    setPayments]    = useState([]);
  const [summary,     setSummary]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState("all");
  const [search,      setSearch]      = useState("");
  const [page,        setPage]        = useState(1);
  const [total,       setTotal]       = useState(0);
  const [recordOpen,  setRecordOpen]  = useState(false);
  // For manual payment we need an unpaid cycle — pick first overdue
  const [unpaidCycles, setUnpaidCycles] = useState([]);

  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(() => {
    if (!tenantId) return;
    setLoading(true);
    const opts = { limit: PAGE_SIZE, offset:(page-1)*PAGE_SIZE };
    if (tab !== "all") opts.status = tab;
    Promise.all([
      getPayments(tenantId, opts),
      getPaymentSummary(tenantId),
      getBillingCycles(tenantId, { status:"unpaid", limit:50 }),
    ]).then(([{ data: pay, count }, { data: sum }, { data: cyc }]) => {
      setPayments(pay ?? []);
      setTotal(count ?? pay?.length ?? 0);
      setSummary(sum);
      setUnpaidCycles(cyc ?? []);
    }).finally(() => setLoading(false));
  }, [tenantId, tab, page]);

  useEffect(() => { load(); }, [load]);

  const filtered = debouncedSearch
    ? payments.filter(p => p.client?.full_name?.toLowerCase().includes(debouncedSearch.toLowerCase()) || p.mpesa_receipt?.includes(debouncedSearch))
    : payments;

  const TABS = [
    { value:"all",       label:"All"       },
    { value:"confirmed", label:"Confirmed" },
    { value:"pending",   label:"Pending"   },
    { value:"failed",    label:"Failed"    },
  ];

  return (
    <DashboardLayout pageTitle="Payments">
      <PageHeader title="Payment Records" subtitle="All rent payments — M-Pesa, cash, and bank transfers"
        actions={<Button variant="primary" onClick={() => setRecordOpen(true)}>+ Record Payment</Button>}
      />

      {summary && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:16, marginBottom:24 }}>
          <StatsCard label="Total Collected" value={formatCurrency(summary.totalPaid ?? 0)} color="success"
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6"/></svg>} />
          <StatsCard label="Total Transactions" value={summary.count ?? payments.length} color="neutral"
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5h6"/></svg>} />
          <StatsCard label="M-Pesa" value={`${payments.filter(p=>p.payment_method==="mpesa").length}`} sublabel="transactions" color="brand"
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>} />
        </div>
      )}

      <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:16, flexWrap:"wrap" }}>
        <TabBar tabs={TABS} active={tab} onChange={v => { setTab(v); setPage(1); }} />
        <div style={{ position:"relative", marginLeft:"auto" }}>
          <svg style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9B8A79" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or receipt…"
            style={{ paddingLeft:30, paddingRight:14, paddingTop:8, paddingBottom:8, border:"1.5px solid #E8DDD4", borderRadius:999, fontSize:13, color:"#1A1412", background:"#fff", outline:"none", width:220 }}
            onFocus={e => e.target.style.borderColor="#C5612C"}
            onBlur={e  => e.target.style.borderColor="#E8DDD4"}
          />
        </div>
      </div>

      <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", overflow:"hidden" }}>
        <div style={{ padding:"9px 20px", background:"#FAF7F2", borderBottom:"1.5px solid #EDE4D8", display:"flex", gap:12 }}>
          {["","","Resident / Method","Amount","Status"].map((h,i) => (
            <p key={i} style={{ fontSize:11, fontWeight:700, color:"#8B7355", textTransform:"uppercase", letterSpacing:"0.06em", margin:0, flex:i===2?1:0 }}>{h}</p>
          ))}
        </div>
        {loading ? (
          <div style={{ display:"flex", justifyContent:"center", padding:48 }}><Spinner size="md"/></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="payments" title="No payments found" description="Payments will appear here once residents start paying rent." />
        ) : (
          filtered.map(p => <PaymentRow key={p.id} payment={p} />)
        )}
      </div>

      <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />

      {/* Manual payment modal — uses first unpaid cycle if available */}
      <ManualPaymentModal
        isOpen={recordOpen}
        onClose={() => setRecordOpen(false)}
        cycle={unpaidCycles[0] ?? null}
        onSuccess={() => { setRecordOpen(false); load(); }}
      />
    </DashboardLayout>
  );
}
