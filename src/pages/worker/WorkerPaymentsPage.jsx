import { useState, useEffect } from "react";

import DashboardLayout        from "../../layouts/DashboardLayout.jsx";
import PageHeader             from "../../components/layout/PageHeader.jsx";
import StatsCard              from "../../components/data/StatsCard.jsx";
import { TabBar }             from "../../components/navigation/TabBar.jsx";
import { Spinner }            from "../../components/ui/Spinner.jsx";
import { EmptyState }         from "../../components/ui/Spinner.jsx";
import { Alert }              from "../../components/ui/Alert.jsx";

import useAuthStore           from "../../store/authStore.js";
import { getWorkers, getMyWorkerPayments } from "../../lib/api/workers.js";
import { formatCurrency, formatDate }      from "../../lib/formatters.js";

// =============================================================================
// WorkerPaymentsPage  /worker/payments
// Full salary history, yearly summary, pending banners.
// =============================================================================

const Ic = ({ d }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const METHOD_LABEL = { mpesa:"M-Pesa", cash:"Cash", bank_transfer:"Bank Transfer", other:"Other" };
const METHOD_ICON  = { mpesa:"📱", cash:"💵", bank_transfer:"🏦", other:"🔁" };

function PaymentCard({ payment, index, total }) {
  const isPaid    = payment.payment_status === "paid";
  const periodStr = payment.period_start
    ? new Date(payment.period_start).toLocaleString("en-KE", { month:"long", year:"numeric" })
    : "—";
  const paidStr   = payment.paid_at ? formatDate(payment.paid_at) : null;

  return (
    <div style={{
      display:"flex", alignItems:"center", gap:14, padding:"15px 22px",
      borderBottom: index < total - 1 ? "1px solid #F5EDE0" : "none",
      transition:"background 0.12s",
    }}
      onMouseOver={e => e.currentTarget.style.background = "#FFFAF6"}
      onMouseOut={e  => e.currentTarget.style.background = "transparent"}
    >
      {/* Method icon */}
      <div style={{
        width:40, height:40, borderRadius:12, flexShrink:0,
        background: isPaid ? "#ECFDF5" : "#FFFBEB",
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:18,
      }}>
        {isPaid ? (METHOD_ICON[payment.payment_method] ?? "✅") : "⏳"}
      </div>

      {/* Period + method */}
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:14, fontWeight:700, color:"#1A1412", margin:0 }}>{periodStr}</p>
        <p style={{ fontSize:12, color:"#8B7355", margin:"2px 0 0" }}>
          {METHOD_LABEL[payment.payment_method] ?? payment.payment_method ?? "—"}
          {payment.mpesa_transaction_id && (
            <span style={{ fontFamily:"'DM Mono','Courier New',monospace", marginLeft:8 }}>
              {payment.mpesa_transaction_id}
            </span>
          )}
          {paidStr && <span style={{ marginLeft:8 }}>· {paidStr}</span>}
        </p>
        {payment.notes && (
          <p style={{ fontSize:11, color:"#C5612C", margin:"2px 0 0", fontStyle:"italic" }}>
            {payment.notes}
          </p>
        )}
      </div>

      {/* Amount + status */}
      <div style={{ textAlign:"right", flexShrink:0 }}>
        <p style={{
          fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:17,
          color: isPaid ? "#10B981" : "#D97706", margin:0,
        }}>
          {formatCurrency(payment.amount)}
        </p>
        <span style={{
          fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:999, marginTop:4, display:"inline-block",
          background: isPaid ? "rgba(16,185,129,0.10)" : "rgba(245,158,11,0.12)",
          color:      isPaid ? "#059669"               : "#D97706",
          border:`1px solid ${isPaid ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.25)"}`,
          textTransform:"capitalize",
        }}>
          {payment.payment_status?.replace(/_/g," ") ?? "—"}
        </span>
      </div>
    </div>
  );
}

export default function WorkerPaymentsPage() {
  const profile = useAuthStore(s => s.profile);

  const [payments,      setPayments]      = useState([]);
  const [workerRecord,  setWorkerRecord]  = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [tab,           setTab]           = useState("all");

  useEffect(() => {
    if (!profile?.id || !profile?.tenant_id) return;
    setLoading(true);
    Promise.all([
      getMyWorkerPayments(profile.id),
      getWorkers(profile.tenant_id, { limit:100 }),
    ]).then(([{ data: pays }, { data: workers }]) => {
      setPayments(pays ?? []);
      const mine = (workers ?? []).find(w =>
        w.user_id === profile.id ||
        w.full_name?.toLowerCase() === profile.full_name?.toLowerCase()
      );
      setWorkerRecord(mine ?? null);
    }).finally(() => setLoading(false));
  }, [profile?.id, profile?.tenant_id]);

  // Derived stats
  const paid    = payments.filter(p => p.payment_status === "paid");
  const pending = payments.filter(p => p.payment_status !== "paid");

  const totalPaid    = paid.reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = pending.reduce((s, p) => s + Number(p.amount), 0);

  // Group paid amounts by year for yearly summary
  const byYear = {};
  paid.forEach(p => {
    const yr = p.paid_at ? new Date(p.paid_at).getFullYear() : new Date(p.period_start).getFullYear();
    byYear[yr] = (byYear[yr] ?? 0) + Number(p.amount);
  });

  const TABS = [
    { value:"all",     label:"All"      },
    { value:"paid",    label:"Paid"     },
    { value:"pending", label:"Pending"  },
  ];

  const filtered = tab === "all"     ? payments
                 : tab === "paid"    ? paid
                 :                     pending;

  return (
    <DashboardLayout pageTitle="My Payments">
      <PageHeader title="Salary Payments"
        subtitle="Your full payment history and salary records" />

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))", gap:16, marginBottom:24 }}>
        <StatsCard label="Total Received"   value={formatCurrency(totalPaid)}
          sublabel={`${paid.length} payment${paid.length!==1?"s":""}`} color="success"
          icon={<Ic d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6"/>} />
        <StatsCard label="Monthly Salary"   value={formatCurrency(workerRecord?.salary ?? 0)}
          sublabel={workerRecord?.pay_cycle ?? "Monthly"} color="brand"
          icon={<Ic d="M2 7h20v13a1 1 0 01-1 1H3a1 1 0 01-1-1V7zm0 0l2-4h16l2 4"/>} />
        <StatsCard label="Outstanding"      value={totalPending > 0 ? formatCurrency(totalPending) : "Nil"}
          sublabel={pending.length > 0 ? `${pending.length} pending` : "All clear"} color={totalPending > 0 ? "warning" : "success"}
          icon={<Ic d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0"/>} />
        <StatsCard label="Total Payments"   value={payments.length}
          sublabel="All time" color="neutral"
          icon={<Ic d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5h6"/>} />
      </div>

      {/* Pending alert */}
      {pending.length > 0 && (
        <Alert type="warning"
          title={`${pending.length} pending payment${pending.length!==1?"s":""}`}
          message={`${formatCurrency(totalPending)} is expected from your employer. Contact your manager if it is overdue.`}
          style={{ marginBottom:20 }} />
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 260px", gap:20, alignItems:"start" }}
        className="pay-grid">
        <style>{`@media(max-width:860px){.pay-grid{grid-template-columns:1fr!important}}`}</style>

        {/* Payment list */}
        <div style={{ background:"#fff", borderRadius:20, border:"1px solid #EDE4D8", overflow:"hidden" }}>
          {/* Tab bar */}
          <div style={{ padding:"14px 22px 0" }}>
            <TabBar tabs={TABS} active={tab} onChange={setTab} />
          </div>

          {loading ? (
            <div style={{ display:"flex", justifyContent:"center", padding:48 }}><Spinner size="md"/></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon="payments" title="No payments here"
              description="Payment records will appear once your employer starts processing salary." />
          ) : (
            <div style={{ paddingTop:8 }}>
              {filtered.map((p, i) => (
                <PaymentCard key={p.id} payment={p} index={i} total={filtered.length} />
              ))}
            </div>
          )}

          {/* Footer total */}
          {filtered.length > 0 && (
            <div style={{ padding:"12px 22px", borderTop:"1px solid #EDE4D8",
              display:"flex", justifyContent:"space-between", alignItems:"center",
              background:"#FAF7F2" }}>
              <span style={{ fontSize:13, color:"#8B7355" }}>
                {filtered.length} record{filtered.length!==1?"s":""}
              </span>
              <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
                fontSize:16, color:"#1A1412" }}>
                {formatCurrency(filtered.reduce((s,p)=>s+Number(p.amount),0))}
              </span>
            </div>
          )}
        </div>

        {/* Yearly summary sidebar */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* Contracted salary card */}
          {workerRecord && (
            <div style={{ background:"linear-gradient(135deg,#1A1412 0%,#2D1E16 100%)",
              borderRadius:16, padding:"20px" }}>
              <p style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.4)",
                textTransform:"uppercase", letterSpacing:"0.1em", margin:"0 0 10px" }}>
                Contracted Salary
              </p>
              <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:26,
                color:"#C5612C", margin:"0 0 4px" }}>
                {formatCurrency(workerRecord.salary)}
              </p>
              <p style={{ fontSize:12, color:"rgba(255,255,255,0.45)", margin:0,
                textTransform:"capitalize" }}>
                {workerRecord.pay_cycle} · {workerRecord.role?.replace(/_/g," ")}
              </p>
              {workerRecord.start_date && (
                <p style={{ fontSize:11, color:"rgba(255,255,255,0.3)", margin:"8px 0 0" }}>
                  Since {formatDate(workerRecord.start_date)}
                </p>
              )}
            </div>
          )}

          {/* Yearly breakdown */}
          {Object.keys(byYear).length > 0 && (
            <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", padding:"18px 20px" }}>
              <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:16,
                color:"#1A1412", marginBottom:14 }}>Yearly Summary</h3>
              <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
                {Object.entries(byYear).sort(([a],[b]) => Number(b)-Number(a)).map(([yr, amt], i, arr) => (
                  <div key={yr} style={{ display:"flex", justifyContent:"space-between",
                    alignItems:"center", padding:"10px 0",
                    borderBottom: i < arr.length-1 ? "1px solid #F5EDE0" : "none" }}>
                    <span style={{ fontSize:13, fontWeight:600, color:"#5C4A3A" }}>{yr}</span>
                    <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
                      fontSize:15, color:"#10B981" }}>{formatCurrency(amt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
