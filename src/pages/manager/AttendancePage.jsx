import { useState, useEffect, useCallback } from "react";

import DashboardLayout    from "../../layouts/DashboardLayout.jsx";
import PageHeader         from "../../components/layout/PageHeader.jsx";
import Button             from "../../components/ui/Button.jsx";
import Avatar             from "../../components/ui/Avatar.jsx";
import { Alert }          from "../../components/ui/Alert.jsx";
import { Spinner }        from "../../components/ui/Spinner.jsx";
import { EmptyState }     from "../../components/ui/Spinner.jsx";

import useAuthStore       from "../../store/authStore.js";
import { getWorkers, getAttendance, bulkRecordAttendance } from "../../lib/api/workers.js";
import { formatDate }     from "../../lib/formatters.js";
import { useToast }       from "../../hooks/useNotifications.js";

// =============================================================================
// AttendancePage  /manage/workforce/attendance
// =============================================================================

const STATUS_OPTIONS = [
  { value:"present",  label:"Present",  color:"#10B981" },
  { value:"absent",   label:"Absent",   color:"#EF4444" },
  { value:"half_day", label:"Half Day", color:"#F59E0B" },
  { value:"leave",    label:"Leave",    color:"#3B82F6" },
];

const STATUS_MAP = Object.fromEntries(STATUS_OPTIONS.map(s => [s.value, s]));

function AttendanceDot({ status }) {
  const s = STATUS_MAP[status];
  if (!s) return null;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:11, fontWeight:600,
      padding:"3px 10px", borderRadius:999,
      background: s.color + "18", color: s.color }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:s.color, flexShrink:0 }}/>
      {s.label}
    </span>
  );
}

export default function AttendancePage() {
  const profile  = useAuthStore(s => s.profile);
  const tenantId = profile?.tenant_id;
  const toast    = useToast();

  const today = new Date().toISOString().slice(0, 10);

  const [workers,    setWorkers]    = useState([]);
  const [attendance, setAttendance] = useState({}); // { workerId: status }
  const [saved,      setSaved]      = useState({}); // { workerId: status } from DB
  const [date,       setDate]       = useState(today);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);

  const load = useCallback(() => {
    if (!tenantId) return;
    setLoading(true);
    Promise.all([
      getWorkers(tenantId, { status:"active" }),
      getAttendance(tenantId, { dateFrom:date, dateTo:date }),
    ]).then(([{ data: w }, { data: att }]) => {
      setWorkers(w ?? []);
      const existing = {};
      (att ?? []).forEach(a => { existing[a.worker_id] = a.status; });
      setSaved(existing);
      // Pre-fill UI with saved or default to "present"
      const draft = {};
      (w ?? []).forEach(worker => { draft[worker.id] = existing[worker.id] ?? "present"; });
      setAttendance(draft);
    }).finally(() => setLoading(false));
  }, [tenantId, date]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    const records = workers.map(w => ({
      workerId:   w.id,
      status:     attendance[w.id] ?? "present",
      recordedBy: profile?.id,
    }));
    const { error } = await bulkRecordAttendance(tenantId, date, records);
    setSaving(false);
    if (error) { toast.error("Failed to save attendance."); return; }
    toast.success(`Attendance saved for ${formatDate(date)}.`);
    load();
  };

  const setStatus = (workerId, status) => {
    setAttendance(prev => ({ ...prev, [workerId]: status }));
  };

  const counts = STATUS_OPTIONS.map(s => ({
    ...s, count: Object.values(attendance).filter(v => v === s.value).length,
  }));

  return (
    <DashboardLayout pageTitle="Attendance">
      <PageHeader title="Attendance" subtitle="Record daily attendance for all active staff"
        breadcrumb={[{label:"Workforce",to:"/manage/workforce"},{label:"Attendance"}]}
        actions={<Button variant="primary" loading={saving} onClick={handleSave}>Save Attendance</Button>}
      />

      {/* Date picker + summary */}
      <div style={{ display:"flex", gap:16, alignItems:"center", marginBottom:24, flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <label style={{ fontSize:13, fontWeight:600, color:"#1A1412" }}>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} max={today}
            style={{ padding:"8px 14px", border:"1.5px solid #E8DDD4", borderRadius:10, fontSize:13, color:"#1A1412", outline:"none" }}
            onFocus={e=>e.target.style.borderColor="#C5612C"}
            onBlur={e=>e.target.style.borderColor="#E8DDD4"}
          />
        </div>
        <div style={{ display:"flex", gap:12, marginLeft:"auto" }}>
          {counts.map(s => (
            <div key={s.value} style={{ display:"flex", alignItems:"center", gap:5 }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:s.color }}/>
              <span style={{ fontSize:12, color:"#8B7355" }}>{s.label}: <strong style={{ color:"#1A1412" }}>{s.count}</strong></span>
            </div>
          ))}
        </div>
      </div>

      {/* Bulk select buttons */}
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        <span style={{ fontSize:12, color:"#8B7355", alignSelf:"center" }}>Mark all as:</span>
        {STATUS_OPTIONS.map(s => (
          <button key={s.value} onClick={() => { const all = {}; workers.forEach(w => { all[w.id] = s.value; }); setAttendance(all); }}
            style={{ fontSize:12, fontWeight:600, padding:"5px 12px", borderRadius:999, border:`1px solid ${s.color}40`, background:`${s.color}12`, color:s.color, cursor:"pointer" }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Attendance sheet */}
      <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", overflow:"hidden" }}>
        {loading ? (
          <div style={{ display:"flex", justifyContent:"center", padding:48 }}><Spinner size="md"/></div>
        ) : workers.length === 0 ? (
          <EmptyState icon="workers" title="No active workers" description="Add workers in the Workforce page first." />
        ) : workers.map((w, i) => (
          <div key={w.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"13px 20px", borderBottom: i < workers.length-1 ? "1px solid #F5EDE0" : "none" }}>
            <Avatar name={w.full_name} size="sm"/>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:13, fontWeight:600, color:"#1A1412", margin:0 }}>{w.full_name}</p>
              <p style={{ fontSize:11, color:"#8B7355", margin:"1px 0 0", textTransform:"capitalize" }}>{w.role}</p>
            </div>
            {/* Status toggle buttons */}
            <div style={{ display:"flex", gap:6, flexShrink:0 }}>
              {STATUS_OPTIONS.map(s => {
                const isActive = attendance[w.id] === s.value;
                const hasSaved = saved[w.id] === s.value;
                return (
                  <button key={s.value} onClick={() => setStatus(w.id, s.value)}
                    style={{ fontSize:11, fontWeight:600, padding:"5px 10px", borderRadius:999, cursor:"pointer",
                      background: isActive ? s.color : "transparent",
                      color:      isActive ? "#fff"  : s.color,
                      border:     `1.5px solid ${s.color}`,
                      outline: hasSaved && !isActive ? `2px solid ${s.color}40` : "none",
                      transition: "all 0.15s",
                    }}>
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {Object.keys(saved).length > 0 && (
        <Alert type="success" compact message={`Attendance already recorded for ${formatDate(date)}. Changes will overwrite the saved record.`} style={{ marginTop:16 }} />
      )}
    </DashboardLayout>
  );
}
