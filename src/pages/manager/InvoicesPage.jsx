import { useState, useEffect, useCallback } from "react";

import DashboardLayout      from "../../layouts/DashboardLayout.jsx";
import PageHeader           from "../../components/layout/PageHeader.jsx";
import { Pagination }       from "../../components/navigation/TabBar.jsx";
import Badge                from "../../components/ui/Badge.jsx";
import Avatar               from "../../components/ui/Avatar.jsx";
import Button               from "../../components/ui/Button.jsx";
import { Spinner }          from "../../components/ui/Spinner.jsx";
import { EmptyState }       from "../../components/ui/Spinner.jsx";
import GenerateInvoiceModal from "../../components/modals/GenerateInvoiceModal.jsx";

import useAuthStore         from "../../store/authStore.js";
import { getInvoices }      from "../../lib/api/billing.js";
import { formatCurrency, formatDate, formatBillingPeriod } from "../../lib/formatters.js";
import { useDebounce }      from "../../hooks/useDebounce.js";

// =============================================================================
// InvoicesPage  /manage/billing/invoices
// =============================================================================

const PAGE_SIZE = 20;

function InvoiceRow({ invoice }) {
  const cycle  = invoice.billing_cycles;
  const client = invoice.profiles;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 20px", borderBottom:"1px solid #F5EDE0" }}
      onMouseOver={e => e.currentTarget.style.background = "#FFFAF6"}
      onMouseOut={e  => e.currentTarget.style.background = "transparent"}
    >
      <div style={{ width:36, height:36, borderRadius:10, background:"#FAF7F2", border:"1px solid #EDE4D8", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#C5612C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
        </svg>
      </div>
      <Avatar name={client?.full_name} src={client?.avatar_url} size="sm" />
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:13, fontWeight:600, color:"#1A1412", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {client?.full_name ?? "—"}
        </p>
        <p style={{ fontSize:11, color:"#8B7355", margin:"2px 0 0" }}>
          {invoice.invoice_number}
          {cycle && <span style={{ marginLeft:6 }}>· {formatBillingPeriod(cycle.period_start, cycle.period_end)}</span>}
        </p>
      </div>
      <div style={{ textAlign:"right", flexShrink:0, minWidth:80 }}>
        <p style={{ fontSize:13, fontWeight:700, color:"#1A1412", margin:0, fontFamily:"'Playfair Display',serif" }}>{formatCurrency(invoice.total_amount)}</p>
        <p style={{ fontSize:11, color:"#8B7355", margin:"1px 0 0" }}>Issued {formatDate(invoice.issued_at)}</p>
      </div>
      <Badge variant={cycle?.status ?? "neutral"} size="sm" style={{ flexShrink:0 }} />
      {invoice.pdf_url && (
        <a href={invoice.pdf_url} target="_blank" rel="noopener"
          style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, fontWeight:600, color:"#C5612C", textDecoration:"none", flexShrink:0, padding:"5px 10px", border:"1px solid rgba(197,97,44,0.3)", borderRadius:999, transition:"all 0.15s" }}
          onMouseOver={e => { e.currentTarget.style.background="#C5612C"; e.currentTarget.style.color="#fff"; }}
          onMouseOut={e  => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#C5612C"; }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3"/></svg>
          PDF
        </a>
      )}
    </div>
  );
}

export default function InvoicesPage() {
  const profile  = useAuthStore(s => s.profile);
  const tenantId = profile?.tenant_id;

  const [invoices,  setInvoices]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [page,      setPage]      = useState(1);
  const [total,     setTotal]     = useState(0);
  const [genOpen,   setGenOpen]   = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(() => {
    if (!tenantId) return;
    setLoading(true);
    getInvoices(tenantId, { limit: PAGE_SIZE, offset:(page-1)*PAGE_SIZE })
      .then(({ data, count }) => { setInvoices(data ?? []); setTotal(count ?? data?.length ?? 0); })
      .finally(() => setLoading(false));
  }, [tenantId, page]);

  useEffect(() => { load(); }, [load]);

  const filtered = debouncedSearch
    ? invoices.filter(i => i.invoice_number?.toLowerCase().includes(debouncedSearch.toLowerCase()) || i.profiles?.full_name?.toLowerCase().includes(debouncedSearch.toLowerCase()))
    : invoices;

  return (
    <DashboardLayout pageTitle="Invoices">
      <PageHeader title="Invoices" subtitle="View and generate PDF invoices for residents"
        actions={<Button variant="primary" onClick={() => setGenOpen(true)}>+ Generate Invoice</Button>}
        breadcrumb={[{label:"Billing",to:"/manage/billing"},{label:"Invoices"}]}
      />

      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16 }}>
        <div style={{ position:"relative" }}>
          <svg style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9B8A79" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or invoice #…"
            style={{ paddingLeft:30, paddingRight:14, paddingTop:8, paddingBottom:8, border:"1.5px solid #E8DDD4", borderRadius:999, fontSize:13, color:"#1A1412", background:"#fff", outline:"none", width:240 }}
            onFocus={e => e.target.style.borderColor="#C5612C"}
            onBlur={e  => e.target.style.borderColor="#E8DDD4"}
          />
        </div>
      </div>

      <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", overflow:"hidden" }}>
        <div style={{ padding:"9px 20px", background:"#FAF7F2", borderBottom:"1.5px solid #EDE4D8", display:"flex", gap:12 }}>
          {["","","Resident","Amount","Status",""].map((h,i) => (
            <p key={i} style={{ fontSize:11, fontWeight:700, color:"#8B7355", textTransform:"uppercase", letterSpacing:"0.06em", margin:0, flex:i===2?1:0 }}>{h}</p>
          ))}
        </div>
        {loading ? (
          <div style={{ display:"flex", justifyContent:"center", padding:48 }}><Spinner size="md"/></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="invoice" title="No invoices" description="Generate invoices from billing cycles above." />
        ) : (
          filtered.map(inv => <InvoiceRow key={inv.id} invoice={inv} />)
        )}
      </div>

      <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />

      <GenerateInvoiceModal isOpen={genOpen} onClose={() => setGenOpen(false)}
        onSuccess={() => { setGenOpen(false); load(); }} />
    </DashboardLayout>
  );
}
