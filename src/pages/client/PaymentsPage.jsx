import { useState, useEffect } from "react";

import DashboardLayout    from "../../layouts/DashboardLayout.jsx";
import PageHeader         from "../../components/layout/PageHeader.jsx";
import { TabBar }         from "../../components/navigation/TabBar.jsx";
import { Pagination }     from "../../components/navigation/TabBar.jsx";
import Badge              from "../../components/ui/Badge.jsx";
import { Spinner }        from "../../components/ui/Spinner.jsx";
import { EmptyState }     from "../../components/ui/Spinner.jsx";
import StatsCard          from "../../components/data/StatsCard.jsx";

import useAuthStore       from "../../store/authStore.js";
import { getMyPayments, getPaymentSummary } from "../../lib/api/payments.js";
import { formatCurrency, formatDate, formatRelativeTime } from "../../lib/formatters.js";
import { useDebounce }    from "../../hooks/useDebounce.js";

// =============================================================================
// PaymentsPage   /dashboard/payments
// =============================================================================

const PAGE_SIZE = 15;

const METHOD_LABELS = { mpesa:"M-Pesa", cash:"Cash", bank_transfer:"Bank Transfer", other:"Other" };
const METHOD_ICONS  = { mpesa:"📱", cash:"💵", bank_transfer:"🏦", other:"🔁" };

function PaymentRow({ payment }) {
  const isOk = payment.payment_status === "confirmed";
  return (
    <div style={{ display:"flex", alignItems:"center", padding:"14px 20px", borderBottom:"1px solid #F5EDE0", gap:14 }}>
      {/* Icon */}
      <div style={{ width:38, height:38, borderRadius:10, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17,
        background: isOk ? "#ECFDF5" : "#FEF2F2" }}>
        {isOk ? "✅" : "❌"}
      </div>
      {/* Method + date */}
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:14, fontWeight:600, color:"#1A1412", margin:0 }}>
          {METHOD_ICONS[payment.payment_method] ?? ""} {METHOD_LABELS[payment.payment_method] ?? payment.payment_method}
          {payment.mpesa_receipt && (
            <span style={{ fontSize:11, fontWeight:400, color:"#8B7355", marginLeft:8, fontFamily:"'DM Mono','Courier New',monospace" }}>
              {payment.mpesa_receipt}
            </span>
          )}
        </p>
        <p style={{ fontSize:12, color:"#8B7355", margin:"2px 0 0" }}>
          {formatDate(payment.created_at)} · {formatRelativeTime(payment.created_at)}
          {payment.recorded_by && <span style={{ color:"#C5612C", marginLeft:8 }}>Manual</span>}
        </p>
      </div>
      {/* Amount */}
      <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:16, color:"#1A1412", margin:0, flexShrink:0 }}>
        {formatCurrency(payment.amount)}
      </p>
      {/* Status */}
      <Badge variant={payment.payment_status} size="sm" style={{ flexShrink:0 }} />
    </div>
  );
}

export default function PaymentsPage() {
  const profile  = useAuthStore(s => s.profile);

  const [payments,  setPayments]  = useState([]);
  const [summary,   setSummary]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState("all");
  const [search,    setSearch]    = useState("");
  const [page,      setPage]      = useState(1);
  const [total,     setTotal]     = useState(0);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (!profile?.id) return;
    setLoading(true);
    const opts = { limit: PAGE_SIZE, offset: (page-1)*PAGE_SIZE };
    if (tab !== "all") opts.status = tab;
    Promise.all([
      getMyPayments(profile.id, opts),
      getPaymentSummary(profile.id),
    ]).then(([{ data: pays, count }, { data: sum }]) => {
      setPayments(pays ?? []);
      setTotal(count ?? pays?.length ?? 0);
      setSummary(sum);
    }).finally(() => setLoading(false));
  }, [profile?.id, tab, page]);

  // Client-side search filter (receipt / amount)
  const filtered = debouncedSearch
    ? payments.filter(p =>
        p.mpesa_receipt?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        String(p.amount).includes(debouncedSearch)
      )
    : payments;

  const TABS = [
    { value:"all",       label:"All" },
    { value:"confirmed", label:"Confirmed" },
    { value:"pending",   label:"Pending" },
    { value:"failed",    label:"Failed" },
  ];

  if (loading) return (
    <DashboardLayout pageTitle="Payments">
      <div style={{ display:"flex", justifyContent:"center", padding:80 }}><Spinner size="lg"/></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout pageTitle="Payments">
      <PageHeader title="Payment History" subtitle="All your rent payments and M-Pesa transactions" />

      {/* Summary stats */}
      {summary && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:16, marginBottom:24 }}>
          <StatsCard label="Total Paid (Year)" value={formatCurrency(summary.totalPaid ?? 0)} color="success"
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6"/></svg>}
          />
          <StatsCard label="Payments Made" value={summary.count ?? payments.length} color="brand"
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>}
          />
          {summary.nextDueDate && (
            <StatsCard label="Next Due" value={formatDate(summary.nextDueDate)} color="warning"
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v3M16 2v3M3 9h18M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z"/></svg>}
            />
          )}
        </div>
      )}

      {/* Filters row */}
      <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:16, flexWrap:"wrap" }}>
        <TabBar tabs={TABS} active={tab} onChange={v => { setTab(v); setPage(1); }} />
        <div style={{ position:"relative", marginLeft:"auto" }}>
          <svg style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9B8A79" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search receipt or amount…"
            style={{ paddingLeft:32, paddingRight:14, paddingTop:8, paddingBottom:8, border:"1.5px solid #E8DDD4", borderRadius:999, fontSize:13, color:"#1A1412", background:"#fff", outline:"none" }}
            onFocus={e=>e.target.style.borderColor="#C5612C"}
            onBlur={e=>e.target.style.borderColor="#E8DDD4"}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", overflow:"hidden" }}>
        {/* Col headers */}
        <div style={{ padding:"10px 20px", background:"#FAF7F2", borderBottom:"1.5px solid #EDE4D8", display:"flex", gap:14, alignItems:"center" }}>
          <div style={{ width:38, flexShrink:0 }}/>
          <p style={{ flex:1, fontSize:11, fontWeight:700, color:"#8B7355", textTransform:"uppercase", letterSpacing:"0.06em", margin:0 }}>Method / Reference</p>
          <p style={{ fontSize:11, fontWeight:700, color:"#8B7355", textTransform:"uppercase", letterSpacing:"0.06em", margin:0 }}>Amount</p>
          <p style={{ fontSize:11, fontWeight:700, color:"#8B7355", textTransform:"uppercase", letterSpacing:"0.06em", margin:0, minWidth:60 }}>Status</p>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon="payments" title="No payments found" description="Your M-Pesa and cash payments will appear here." />
        ) : (
          filtered.map(p => <PaymentRow key={p.id} payment={p} />)
        )}
      </div>

      <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
    </DashboardLayout>
  );
}
