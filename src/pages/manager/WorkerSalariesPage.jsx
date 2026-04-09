import { useState, useEffect, useCallback } from "react";

import DashboardLayout    from "../../layouts/DashboardLayout.jsx";
import PageHeader         from "../../components/layout/PageHeader.jsx";
import Badge              from "../../components/ui/Badge.jsx";
import Button             from "../../components/ui/Button.jsx";
import Input              from "../../components/ui/Input.jsx";
import SelectInput        from "../../components/ui/SelectInput.jsx";
import { Modal }          from "../../components/modals/Modal.jsx";
import { Spinner }        from "../../components/ui/Spinner.jsx";
import { EmptyState }     from "../../components/ui/Spinner.jsx";
import { Alert }          from "../../components/ui/Alert.jsx";
import Avatar             from "../../components/ui/Avatar.jsx";

import useAuthStore       from "../../store/authStore.js";
import { getWorkers, getWorkerPayments, recordSalaryPayment } from "../../lib/api/workers.js";
import { formatCurrency, formatDate } from "../../lib/formatters.js";
import { useToast }       from "../../hooks/useNotifications.js";
import { useLocation } from "react-router-dom";

// =============================================================================
// WorkerSalariesPage  /manage/workforce/salaries
// =============================================================================

const METHOD_OPTIONS = [
  { value:"cash",          label:"Cash"          },
  { value:"mpesa",         label:"M-Pesa"        },
  { value:"bank_transfer", label:"Bank Transfer" },
];

function PaySalaryModal({ isOpen, onClose, worker, tenantId, managerId, onSuccess }) {
  const toast = useToast();
  const today = new Date().toISOString().slice(0,10);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10);

  const [amount,  setAmount]  = useState(String(worker?.salary ?? ""));
  const [method,  setMethod]  = useState("cash");
  const [notes,   setNotes]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => { if (worker) setAmount(String(worker.salary ?? "")); }, [worker?.id]);

  const handlePay = async () => {
    setError(null);
    if (!amount || Number(amount) <= 0) { setError("Enter a valid amount."); return; }
    setLoading(true);
    try {
      const { error: err } = await recordSalaryPayment({
        tenantId, workerId: worker.id,
        amount: Number(amount),
        periodStart: monthStart, periodEnd: today,
        method, recordedBy: managerId,
        notes: notes.trim() || null,
      });
      if (err) throw new Error(err.message);
      toast.success(`${formatCurrency(Number(amount))} salary recorded for ${worker.full_name}.`);
      onSuccess?.();
      onClose();
    } catch (e) { setError(e.message ?? "Failed to record payment."); }
    finally { setLoading(false); }
  };

  if (!worker) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Salary Payment" size="sm"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="primary" loading={loading} onClick={handlePay}>Record Payment</Button></>}>
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        <div style={{ background:"#FAF7F2", border:"1px solid #EDE4D8", borderRadius:12, padding:"14px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", gap:12, alignItems:"center" }}>
            <Avatar name={worker.full_name} size="sm"/>
            <div>
              <p style={{ fontSize:14, fontWeight:700, color:"#1A1412", margin:0 }}>{worker.full_name}</p>
              <p style={{ fontSize:12, color:"#8B7355", margin:"2px 0 0", textTransform:"capitalize" }}>{worker.role}</p>
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <p style={{ fontSize:11, color:"#8B7355", margin:0 }}>Contracted salary</p>
            <p style={{ fontSize:16, fontWeight:700, color:"#C5612C", margin:0, fontFamily:"'Playfair Display',serif" }}>{formatCurrency(worker.salary)}</p>
          </div>
        </div>
        {error && <Alert type="error" message={error} />}
        <Input label="Amount (KES)" type="number" required value={amount} onChange={e=>setAmount(e.target.value)}
          leftAdornment={<span style={{ fontSize:12,fontWeight:600,color:"#8B7355" }}>KES</span>} />
        <SelectInput label="Payment Method" options={METHOD_OPTIONS} value={method} onChange={setMethod} />
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          <label style={{ fontSize:13, fontWeight:600, color:"#1A1412" }}>Notes <span style={{ fontWeight:400, color:"#8B7355" }}>(optional)</span></label>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2} placeholder="e.g. March salary payment"
            style={{ width:"100%", padding:"10px 14px", border:"1.5px solid #E8DDD4", borderRadius:12, fontSize:14, fontFamily:"'DM Sans',system-ui", outline:"none", resize:"vertical" }}
            onFocus={e=>e.target.style.borderColor="#C5612C"} onBlur={e=>e.target.style.borderColor="#E8DDD4"}
          />
        </div>
      </div>
    </Modal>
  );
}

export default function WorkerSalariesPage() {
  const profile  = useAuthStore(s => s.profile);
  const tenantId = profile?.tenant_id;

  const [workers,   setWorkers]   = useState([]);
  const [payments,  setPayments]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [payTarget, setPayTarget] = useState(null);

  const load = useCallback(() => {
    if (!tenantId) return;
    setLoading(true);
    Promise.all([
      getWorkers(tenantId, { status:"active" }),
      getWorkerPayments(tenantId, { limit:50 }),
    ]).then(([{data:w},{data:p}]) => { setWorkers(w??[]); setPayments(p??[]); })
      .finally(() => setLoading(false));
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  const totalPaid = payments.reduce((s,p) => s + Number(p.amount), 0);

  if (loading) return <DashboardLayout pageTitle="Salaries"><div style={{display:"flex",justifyContent:"center",padding:80}}><Spinner size="lg"/></div></DashboardLayout>;

  return (
    <DashboardLayout pageTitle="Salaries">
      <PageHeader title="Salary Payments" subtitle="Record and track staff salary disbursements"
        breadcrumb={[{label:"Workforce",to:"/manage/workforce"},{label:"Salaries"}]}
      />

      {/* Workers list with pay button */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14, marginBottom:28 }}>
        {workers.map(w => (
          <div key={w.id} style={{ background:"#fff", borderRadius:14, border:"1px solid #EDE4D8", padding:"16px", display:"flex", alignItems:"center", gap:12 }}>
            <Avatar name={w.full_name} size="md"/>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:13, fontWeight:700, color:"#1A1412", margin:0 }}>{w.full_name}</p>
              <p style={{ fontSize:11, color:"#8B7355", margin:"2px 0 4px", textTransform:"capitalize" }}>{w.role} · {w.pay_cycle}</p>
              <p style={{ fontSize:14, fontWeight:700, color:"#C5612C", margin:0, fontFamily:"'Playfair Display',serif" }}>{formatCurrency(w.salary)}/mo</p>
            </div>
            <Button size="sm" variant="primary" onClick={() => setPayTarget(w)}>Pay</Button>
          </div>
        ))}
      </div>

      {/* Recent salary payments */}
      <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", overflow:"hidden" }}>
        <div style={{ padding:"14px 20px 0" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingBottom:14, borderBottom:"1px solid #EDE4D8" }}>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17, color:"#1A1412", margin:0 }}>Payment History</h3>
            <span style={{ fontSize:13, fontWeight:700, color:"#10B981", fontFamily:"'Playfair Display',serif" }}>{formatCurrency(totalPaid)} disbursed</span>
          </div>
        </div>
        {payments.length === 0 ? (
          <EmptyState icon="salary" title="No salary payments" description="Record salary payments for your staff above." />
        ) : payments.map(p => (
          <div key={p.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 20px", borderBottom:"1px solid #F5EDE0" }}>
            <Avatar name={p.workers?.full_name} size="sm"/>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:13, fontWeight:600, color:"#1A1412", margin:0 }}>{p.workers?.full_name ?? "—"}</p>
              <p style={{ fontSize:11, color:"#8B7355", margin:"2px 0 0", textTransform:"capitalize" }}>{p.workers?.role} · {p.payment_method}</p>
            </div>
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <p style={{ fontSize:14, fontWeight:700, color:"#10B981", margin:0, fontFamily:"'Playfair Display',serif" }}>{formatCurrency(p.amount)}</p>
              <p style={{ fontSize:11, color:"#8B7355", margin:"1px 0 0" }}>{formatDate(p.paid_at ?? p.created_at)}</p>
            </div>
          </div>
        ))}
      </div>

      <PaySalaryModal isOpen={!!payTarget} onClose={() => setPayTarget(null)}
        worker={payTarget} tenantId={tenantId} managerId={profile?.id} onSuccess={load} />
    </DashboardLayout>
  );
}
