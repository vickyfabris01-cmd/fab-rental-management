import { useState, useEffect, useCallback } from "react";

import DashboardLayout    from "../../layouts/DashboardLayout.jsx";
import PageHeader         from "../../components/layout/PageHeader.jsx";
import { TabBar }         from "../../components/navigation/TabBar.jsx";
import Badge              from "../../components/ui/Badge.jsx";
import Avatar             from "../../components/ui/Avatar.jsx";
import Button             from "../../components/ui/Button.jsx";
import { Spinner }        from "../../components/ui/Spinner.jsx";
import { EmptyState }     from "../../components/ui/Spinner.jsx";
import { ConfirmDialog }  from "../../components/modals/Modal.jsx";
import { WorkerFormModal } from "../../components/modals/BuildingFormModal.jsx";

import useAuthStore       from "../../store/authStore.js";
import { getWorkers, terminateWorker } from "../../lib/api/workers.js";
import { formatCurrency, formatDate }  from "../../lib/formatters.js";
import { useToast }       from "../../hooks/useNotifications.js";
import { useDebounce }    from "../../hooks/useDebounce.js";

// =============================================================================
// WorkforcePage  /manage/workforce/workers
// =============================================================================

const ROLE_LABELS = { security:"Security", cleaner:"Cleaner", maintenance:"Maintenance", gardener:"Gardener", receptionist:"Receptionist", driver:"Driver", other:"Other" };

function WorkerRow({ worker, onEdit, onTerminate }) {
  const isActive = worker.status === "active";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 20px", borderBottom:"1px solid #F5EDE0" }}
      onMouseOver={e => e.currentTarget.style.background = "#FFFAF6"}
      onMouseOut={e  => e.currentTarget.style.background = "transparent"}
    >
      <Avatar name={worker.full_name} size="sm" />
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:13, fontWeight:600, color:"#1A1412", margin:0 }}>{worker.full_name}</p>
        <p style={{ fontSize:11, color:"#8B7355", margin:"2px 0 0" }}>
          {worker.phone ?? "—"} {worker.id_number && `· ID ${worker.id_number}`}
        </p>
      </div>
      <span style={{ fontSize:12, fontWeight:600, color:"#5C4A3A", background:"#F5EDE0", borderRadius:999, padding:"3px 10px", flexShrink:0, textTransform:"capitalize" }}>
        {ROLE_LABELS[worker.role] ?? worker.role}
      </span>
      <div style={{ textAlign:"right", flexShrink:0, minWidth:80 }}>
        <p style={{ fontSize:13, fontWeight:700, color:"#1A1412", margin:0, fontFamily:"'Playfair Display',serif" }}>
          {formatCurrency(worker.salary)}<span style={{ fontSize:11, fontWeight:400, color:"#8B7355" }}>/mo</span>
        </p>
        <p style={{ fontSize:11, color:"#8B7355", margin:"1px 0 0", textTransform:"capitalize" }}>{worker.pay_cycle}</p>
      </div>
      <Badge variant={isActive ? "active" : "terminated"} size="sm" style={{ flexShrink:0 }} />
      <div style={{ display:"flex", gap:6, flexShrink:0 }}>
        <button onClick={() => onEdit(worker)}
          style={{ fontSize:12, fontWeight:600, color:"#C5612C", background:"none", border:"none", cursor:"pointer", padding:0 }}>Edit</button>
        {isActive && (
          <button onClick={() => onTerminate(worker)}
            style={{ fontSize:12, fontWeight:600, color:"#DC2626", background:"none", border:"none", cursor:"pointer", padding:0 }}>End</button>
        )}
      </div>
    </div>
  );
}

export default function WorkforcePage() {
  const profile  = useAuthStore(s => s.profile);
  const tenantId = profile?.tenant_id;
  const toast    = useToast();

  const [workers,      setWorkers]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [tab,          setTab]          = useState("active");
  const [search,       setSearch]       = useState("");
  const [editTarget,   setEditTarget]   = useState(null);
  const [addOpen,      setAddOpen]      = useState(false);
  const [termTarget,   setTermTarget]   = useState(null);
  const [termLoading,  setTermLoading]  = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(() => {
    if (!tenantId) return;
    setLoading(true);
    const opts = tab !== "all" ? { status: tab } : {};
    getWorkers(tenantId, opts)
      .then(({ data }) => setWorkers(data ?? []))
      .finally(() => setLoading(false));
  }, [tenantId, tab]);

  useEffect(() => { load(); }, [load]);

  const filtered = debouncedSearch
    ? workers.filter(w => w.full_name?.toLowerCase().includes(debouncedSearch.toLowerCase()) || w.role?.includes(debouncedSearch.toLowerCase()))
    : workers;

  const handleTerminate = async () => {
    if (!termTarget) return;
    setTermLoading(true);
    const { error } = await terminateWorker(termTarget.id);
    setTermLoading(false);
    if (error) { toast.error("Failed to terminate worker."); return; }
    toast.success(`${termTarget.full_name} has been terminated.`);
    setTermTarget(null);
    load();
  };

  const totalMonthlyCost = workers.filter(w => w.status === "active").reduce((s,w) => s + Number(w.salary), 0);

  const TABS = [
    { value:"active",     label:"Active"    },
    { value:"terminated", label:"Former"    },
    { value:"all",        label:"All"       },
  ];

  return (
    <DashboardLayout pageTitle="Workforce">
      <PageHeader title="Workforce" subtitle="Manage staff, roles, and salaries"
        actions={<Button variant="primary" onClick={() => setAddOpen(true)}>+ Add Worker</Button>}
      />

      {/* Summary banner */}
      <div style={{ background:"linear-gradient(120deg,#1A1412 0%,#2D1E16 100%)", borderRadius:16, padding:"18px 24px", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
        <div>
          <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.45)", textTransform:"uppercase", letterSpacing:"0.1em", margin:"0 0 4px" }}>Monthly Payroll</p>
          <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:28, color:"#fff", margin:0 }}>
            {formatCurrency(totalMonthlyCost)}
          </p>
        </div>
        <div style={{ display:"flex", gap:20 }}>
          {[
            ["Active Staff", workers.filter(w=>w.status==="active").length],
            ["Roles",        [...new Set(workers.filter(w=>w.status==="active").map(w=>w.role))].length],
          ].map(([k,v]) => (
            <div key={k} style={{ textAlign:"center" }}>
              <p style={{ fontSize:24, fontWeight:900, color:"#C5612C", margin:0 }}>{v}</p>
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.45)", margin:"3px 0 0" }}>{k}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:16, flexWrap:"wrap" }}>
        <TabBar tabs={TABS} active={tab} onChange={v => { setTab(v); }} />
        <div style={{ position:"relative", marginLeft:"auto" }}>
          <svg style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9B8A79" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or role…"
            style={{ paddingLeft:30, paddingRight:14, paddingTop:8, paddingBottom:8, border:"1.5px solid #E8DDD4", borderRadius:999, fontSize:13, color:"#1A1412", background:"#fff", outline:"none", width:200 }}
            onFocus={e => e.target.style.borderColor="#C5612C"}
            onBlur={e  => e.target.style.borderColor="#E8DDD4"}
          />
        </div>
      </div>

      <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", overflow:"hidden" }}>
        <div style={{ padding:"9px 20px", background:"#FAF7F2", borderBottom:"1.5px solid #EDE4D8", display:"flex", gap:12 }}>
          {["","Name / Contact","Role","Salary","Status",""].map((h,i) => (
            <p key={i} style={{ fontSize:11, fontWeight:700, color:"#8B7355", textTransform:"uppercase", letterSpacing:"0.06em", margin:0, flex:i===1?1:0 }}>{h}</p>
          ))}
        </div>
        {loading ? (
          <div style={{ display:"flex", justifyContent:"center", padding:48 }}><Spinner size="md"/></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="workers" title="No workers found" description="Add your first staff member to get started." />
        ) : (
          filtered.map(w => <WorkerRow key={w.id} worker={w} onEdit={setEditTarget} onTerminate={setTermTarget} />)
        )}
      </div>

      <WorkerFormModal isOpen={addOpen || !!editTarget} onClose={() => { setAddOpen(false); setEditTarget(null); }}
        worker={editTarget} onSuccess={() => { setAddOpen(false); setEditTarget(null); load(); }} />

      <ConfirmDialog isOpen={!!termTarget} title="Terminate Worker?" variant="danger" loading={termLoading}
        message={`This will mark ${termTarget?.full_name} as terminated. Their records will be preserved.`}
        confirmLabel="Terminate" onConfirm={handleTerminate} onCancel={() => setTermTarget(null)} />
    </DashboardLayout>
  );
}
