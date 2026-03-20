import { useState, useEffect } from "react";

import DashboardLayout    from "../../layouts/DashboardLayout.jsx";
import PageHeader         from "../../components/layout/PageHeader.jsx";
import { TabBar }         from "../../components/navigation/TabBar.jsx";
import Badge              from "../../components/ui/Badge.jsx";
import Button             from "../../components/ui/Button.jsx";
import { Spinner }        from "../../components/ui/Spinner.jsx";
import { EmptyState }     from "../../components/ui/Spinner.jsx";
import { Alert }          from "../../components/ui/Alert.jsx";
import MPesaPayModal      from "../../components/modals/MPesaPayModal.jsx";

import useAuthStore       from "../../store/authStore.js";
import { getMyBillingCycles, getCurrentCycle } from "../../lib/api/billing.js";
import { formatCurrency, formatDate, formatBillingPeriod } from "../../lib/formatters.js";

// =============================================================================
// BillingPage   /dashboard/billing
// =============================================================================

const TABS = [
  { value:"all",     label:"All" },
  { value:"unpaid",  label:"Unpaid" },
  { value:"paid",    label:"Paid" },
  { value:"overdue", label:"Overdue" },
];

function CycleRow({ cycle, onPay }) {
  const total       = Number(cycle.amount_due) + Number(cycle.late_fee ?? 0);
  const isPaid      = ["paid","waived","cancelled"].includes(cycle.status);
  const isOverdue   = !isPaid && cycle.due_date < new Date().toISOString().slice(0,10);
  const period      = formatBillingPeriod(cycle.period_start, cycle.period_end, cycle.billing_type);

  return (
    <div style={{ display:"flex", alignItems:"center", padding:"14px 20px", borderBottom:"1px solid #F5EDE0", gap:14 }}>
      {/* Period + due */}
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:14, fontWeight:600, color:"#1A1412", margin:0 }}>{period}</p>
        <p style={{ fontSize:12, color: isOverdue ? "#DC2626" : "#8B7355", margin:"2px 0 0" }}>
          Due {formatDate(cycle.due_date)}{isOverdue ? " — OVERDUE" : ""}
        </p>
      </div>
      {/* Amount */}
      <div style={{ textAlign:"right", flexShrink:0, minWidth:90 }}>
        <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:16, color:"#1A1412", margin:0 }}>
          {formatCurrency(total)}
        </p>
        {Number(cycle.late_fee) > 0 && (
          <p style={{ fontSize:10, color:"#DC2626", margin:"1px 0 0" }}>+{formatCurrency(cycle.late_fee)} late fee</p>
        )}
      </div>
      {/* Status */}
      <Badge variant={cycle.status} size="sm" style={{ flexShrink:0 }} />
      {/* Invoice */}
      {cycle.pdf_url && (
        <a href={cycle.pdf_url} target="_blank" rel="noopener" title="Download invoice"
          style={{ color:"#8B7355", textDecoration:"none", flexShrink:0, display:"flex" }}
          onMouseOver={e=>e.currentTarget.style.color="#C5612C"}
          onMouseOut={e=>e.currentTarget.style.color="#8B7355"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 18 15 15"/>
          </svg>
        </a>
      )}
      {/* Pay */}
      {!isPaid && onPay && (
        <button onClick={() => onPay(cycle)}
          style={{ background:"#C5612C", color:"#fff", border:"none", borderRadius:999, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer", flexShrink:0, transition:"background 0.15s" }}
          onMouseOver={e=>e.currentTarget.style.background="#A84E22"}
          onMouseOut={e=>e.currentTarget.style.background="#C5612C"}
        >
          Pay
        </button>
      )}
    </div>
  );
}

export default function BillingPage() {
  const profile  = useAuthStore(s => s.profile);

  const [cycles,      setCycles]      = useState([]);
  const [current,     setCurrent]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState("all");
  const [payingCycle, setPayingCycle] = useState(null);

  useEffect(() => {
    if (!profile?.id) return;
    Promise.all([
      getMyBillingCycles(profile.id),
      getCurrentCycle(profile.id),
    ]).then(([{ data: allCycles }, { data: cur }]) => {
      setCycles(allCycles ?? []);
      setCurrent(cur);
    }).finally(() => setLoading(false));
  }, [profile?.id]);

  const filtered = tab === "all" ? cycles : cycles.filter(c => c.status === tab);

  const totalOutstanding = cycles
    .filter(c => !["paid","waived","cancelled"].includes(c.status))
    .reduce((s,c) => s + Number(c.amount_due) + Number(c.late_fee ?? 0), 0);

  if (loading) return (
    <DashboardLayout pageTitle="Billing">
      <div style={{ display:"flex", justifyContent:"center", padding:80 }}><Spinner size="lg"/></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout pageTitle="Billing & Invoices">
      <PageHeader title="Billing & Invoices" subtitle="Track your rent cycles, payments, and invoice downloads" />

      {/* Current cycle hero */}
      {current && !["paid","waived"].includes(current.status) && (
        <div style={{ background:"linear-gradient(120deg,#C5612C 0%,#A84E22 100%)", borderRadius:20, padding:"28px", marginBottom:24, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
          <div>
            <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.6)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>Current Billing Period</p>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:32, color:"#fff", margin:"0 0 4px" }}>
              {formatCurrency(Number(current.amount_due) + Number(current.late_fee ?? 0))}
            </h2>
            <p style={{ fontSize:13, color:"rgba(255,255,255,0.72)", margin:0 }}>
              Due {formatDate(current.due_date)} · {formatBillingPeriod(current.period_start, current.period_end, current.billing_type)}
            </p>
          </div>
          <Button variant="secondary" onClick={() => setPayingCycle(current)}
            style={{ background:"rgba(255,255,255,0.15)", border:"1.5px solid rgba(255,255,255,0.4)", color:"#fff", flexShrink:0 }}>
            Pay via M-Pesa
          </Button>
        </div>
      )}

      {totalOutstanding > 0 && (
        <Alert type="warning" title="Outstanding balance"
          message={`You have ${formatCurrency(totalOutstanding)} in unpaid rent across ${cycles.filter(c=>!["paid","waived","cancelled"].includes(c.status)).length} billing cycle(s).`}
          style={{ marginBottom:20 }}
        />
      )}

      {/* Tab filter */}
      <div style={{ marginBottom:16 }}>
        <TabBar tabs={TABS.map(t => ({ ...t, count: t.value==="all" ? undefined : cycles.filter(c=>c.status===t.value).length }))}
          active={tab} onChange={setTab} />
      </div>

      {/* Cycles table */}
      <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", overflow:"hidden" }}>
        {/* Header */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 100px 80px 32px 80px", gap:14, padding:"10px 20px", background:"#FAF7F2", borderBottom:"1.5px solid #EDE4D8" }}>
          {["Period","Amount","Status","",""].map((h,i) => (
            <p key={i} style={{ fontSize:11, fontWeight:700, color:"#8B7355", textTransform:"uppercase", letterSpacing:"0.06em", margin:0 }}>{h}</p>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon="billing" title="No billing cycles" description="Your billing history will appear here once your tenancy is active." />
        ) : (
          filtered.map(c => <CycleRow key={c.id} cycle={c} onPay={setPayingCycle} />)
        )}
      </div>

      <MPesaPayModal
        isOpen={!!payingCycle}
        onClose={() => setPayingCycle(null)}
        cycle={payingCycle}
        onSuccess={() => { setPayingCycle(null); getMyBillingCycles(profile.id).then(({data}) => setCycles(data ?? [])); }}
      />
    </DashboardLayout>
  );
}
