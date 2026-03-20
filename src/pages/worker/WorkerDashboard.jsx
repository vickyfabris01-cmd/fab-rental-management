import { useState, useEffect } from "react";
import { useNavigate, Link }   from "react-router-dom";

// ── Layout ────────────────────────────────────────────────────────────────────
import DashboardLayout         from "../../layouts/DashboardLayout.jsx";

// ── Components ────────────────────────────────────────────────────────────────
import PageHeader              from "../../components/layout/PageHeader.jsx";
import StatsCard               from "../../components/data/StatsCard.jsx";
import Avatar                  from "../../components/ui/Avatar.jsx";
import Badge                   from "../../components/ui/Badge.jsx";
import Button                  from "../../components/ui/Button.jsx";
import { Spinner }             from "../../components/ui/Spinner.jsx";
import { Alert }               from "../../components/ui/Alert.jsx";

// ── Store / hooks ─────────────────────────────────────────────────────────────
import useAuthStore            from "../../store/authStore.js";
import useTenantStore          from "../../store/tenantStore.js";

// ── API ───────────────────────────────────────────────────────────────────────
import { getWorkers, getMyWorkerPayments, getAttendance } from "../../lib/api/workers.js";

// ── Utils ─────────────────────────────────────────────────────────────────────
import { formatCurrency, formatDate, formatRelativeTime } from "../../lib/formatters.js";

// =============================================================================
// WorkerDashboard  /worker
//
// Sections:
//   1. Profile hero banner
//   2. KPI stats
//   3. Attendance calendar (current month) + Recent salary payments side by side
// =============================================================================

const Ic = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

// ── Attendance colour config ──────────────────────────────────────────────────
const ATT = {
  present: { dot:"#10B981", bg:"#ECFDF5", border:"#A7F3D0", text:"#065F46", label:"Present"  },
  absent:  { dot:"#EF4444", bg:"#FEF2F2", border:"#FECACA", text:"#991B1B", label:"Absent"   },
  half_day:{ dot:"#F59E0B", bg:"#FFFBEB", border:"#FDE68A", text:"#92400E", label:"Half Day" },
  leave:   { dot:"#3B82F6", bg:"#EFF6FF", border:"#BFDBFE", text:"#1E40AF", label:"Leave"    },
  off:     { dot:"#D1D5DB", bg:"#F9FAFB", border:"transparent", text:"#9CA3AF", label:"Off"  },
  future:  { dot:"transparent", bg:"transparent", border:"transparent", text:"#E5E7EB", label:"" },
};

const DAY_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ── Attendance calendar ───────────────────────────────────────────────────────
function AttendanceCalendar({ records, month, year }) {
  const today        = new Date();
  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const firstDow     = new Date(year, month, 1).getDay();

  // Build a map of day → status from DB records
  const byDay = {};
  records.forEach(r => {
    const d = new Date(r.date);
    if (d.getMonth() === month && d.getFullYear() === year) {
      byDay[d.getDate()] = r.status;
    }
  });

  const cells = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const day  = i + 1;
      const date = new Date(year, month, day);
      const dow  = date.getDay();
      if (date > today) return { day, status:"future" };
      if (dow === 0)    return { day, status:"off" };     // Sunday
      return { day, status: byDay[day] ?? "future" };     // not-yet-recorded = muted
    }),
  ];

  const counts = { present:0, absent:0, half_day:0, leave:0 };
  Object.values(byDay).forEach(s => { if (counts[s] !== undefined) counts[s]++; });

  return (
    <div>
      {/* Legend */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom:16 }}>
        {Object.entries(ATT).filter(([k]) => k !== "future" && k !== "off").map(([k, v]) => (
          <div key={k} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:v.dot, flexShrink:0 }}/>
            <span style={{ fontSize:11, color:"#8B7355" }}>{v.label}</span>
          </div>
        ))}
      </div>

      {/* Day headers */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:6 }}>
        {DAY_LABELS.map(d => (
          <p key={d} style={{ textAlign:"center", fontSize:11, fontWeight:600, color:"#8B7355", margin:0, padding:"4px 0" }}>{d}</p>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
        {cells.map((cell, i) => {
          if (!cell) return <div key={`e-${i}`} />;
          const cfg     = ATT[cell.status] ?? ATT.future;
          const isToday = cell.day === today.getDate() && month === today.getMonth() && year === today.getFullYear() && cell.status !== "future";
          return (
            <div key={cell.day} style={{
              aspectRatio:"1", borderRadius:9, display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center",
              background: cfg.bg,
              border: isToday ? `2px solid #C5612C` : `1px solid ${cfg.border}`,
              opacity: cell.status === "future" ? 0.35 : 1,
            }}>
              <span style={{ fontSize:12, fontWeight: isToday ? 700 : 500,
                color: isToday ? "#C5612C" : cfg.text }}>
                {cell.day}
              </span>
              {cell.status !== "future" && cell.status !== "off" && (
                <span style={{ width:5, height:5, borderRadius:"50%", background:cfg.dot, marginTop:2 }}/>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginTop:16, paddingTop:14, borderTop:"1px solid #F5EDE0" }}>
        {[
          ["Present",  counts.present,  "#10B981", "#ECFDF5"],
          ["Absent",   counts.absent,   "#EF4444", "#FEF2F2"],
          ["Half Day", counts.half_day, "#F59E0B", "#FFFBEB"],
          ["Leave",    counts.leave,    "#3B82F6", "#EFF6FF"],
        ].map(([label, count, color, bg]) => (
          <div key={label} style={{ background:bg, borderRadius:12, padding:"10px 8px", textAlign:"center" }}>
            <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:22, color, margin:0 }}>{count}</p>
            <p style={{ fontSize:11, color:"#8B7355", margin:"2px 0 0" }}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Main dashboard
// =============================================================================
export default function WorkerDashboard() {
  const navigate  = useNavigate();
  const profile   = useAuthStore(s => s.profile);
  const user      = useAuthStore(s => s.user);
  const tenant    = useTenantStore(s => s.tenant);

  const [workerRecord, setWorkerRecord] = useState(null);
  const [payments,     setPayments]     = useState([]);
  const [attendance,   setAttendance]   = useState([]);
  const [loading,      setLoading]      = useState(true);

  const now          = new Date();
  const currentMonth = now.getMonth();
  const currentYear  = now.getFullYear();
  const monthStart   = new Date(currentYear, currentMonth, 1).toISOString().slice(0, 10);
  const monthEnd     = new Date(currentYear, currentMonth + 1, 0).toISOString().slice(0, 10);
  const monthName    = now.toLocaleString("en-KE", { month:"long" });

  useEffect(() => {
    if (!profile?.id || !profile?.tenant_id) return;

    // Workers have a workers table row linked by user_id.
    // Fetch by matching user_id = profile.id within the tenant.
    Promise.all([
      getWorkers(profile.tenant_id, { limit: 100 }),
      getMyWorkerPayments(profile.id),
      getAttendance(profile.tenant_id, { dateFrom: monthStart, dateTo: monthEnd }),
    ]).then(([{ data: workers }, { data: pays }, { data: att }]) => {
      // Find the worker row that belongs to this profile
      const mine = (workers ?? []).find(w =>
        w.user_id === profile.id ||
        w.phone   === profile.phone ||
        w.full_name?.toLowerCase() === profile.full_name?.toLowerCase()
      );
      setWorkerRecord(mine ?? null);

      // Filter attendance to this worker if we found them
      const myAtt = mine
        ? (att ?? []).filter(a => a.worker_id === mine.id)
        : (att ?? []);
      setAttendance(myAtt);
      setPayments(pays ?? []);
    }).finally(() => setLoading(false));
  }, [profile?.id, profile?.tenant_id]);

  const pendingPay = payments.find(p => p.payment_status !== "paid");
  const totalPaid  = payments.filter(p => p.payment_status === "paid")
    .reduce((s, p) => s + Number(p.amount), 0);

  // Attendance counts for current month
  const attCounts = { present:0, absent:0, half_day:0, leave:0 };
  attendance.forEach(a => { if (attCounts[a.status] !== undefined) attCounts[a.status]++; });
  const workingDays = attCounts.present + attCounts.absent + attCounts.half_day + attCounts.leave;
  const attendanceRate = workingDays > 0 ? Math.round(((attCounts.present + attCounts.half_day * 0.5) / workingDays) * 100) : 0;

  const firstName = profile?.full_name?.split(" ")[0] ?? "Worker";

  if (loading) return (
    <DashboardLayout pageTitle="My Dashboard">
      <div style={{ display:"flex", justifyContent:"center", padding:80 }}><Spinner size="lg"/></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout pageTitle="My Dashboard">
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .fu1{animation:fadeUp 0.4s 0.04s ease both} .fu2{animation:fadeUp 0.4s 0.10s ease both}
        .fu3{animation:fadeUp 0.4s 0.16s ease both} .fu4{animation:fadeUp 0.4s 0.22s ease both}
        @media(max-width:900px){.w-two{grid-template-columns:1fr!important}}
      `}</style>

      {/* ── Profile hero ── */}
      <div className="fu1" style={{
        background:"linear-gradient(135deg,#1A1412 0%,#2D1E16 55%,#3D2318 100%)",
        borderRadius:20, padding:"26px 28px", marginBottom:24,
        display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16,
      }}>
        <div style={{ display:"flex", gap:16, alignItems:"center", flexWrap:"wrap" }}>
          <Avatar name={profile?.full_name} src={profile?.avatar_url} size={64}
            style={{ border:"3px solid rgba(197,97,44,0.5)" }}/>
          <div>
            <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.4)", letterSpacing:"0.1em",
              textTransform:"uppercase", marginBottom:4 }}>Worker Portal</p>
            <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900,
              fontSize:"clamp(20px,2.8vw,26px)", color:"#fff", margin:"0 0 4px" }}>
              Good {now.getHours()<12?"morning":now.getHours()<17?"afternoon":"evening"}, {firstName}
            </h1>
            <p style={{ fontSize:13, color:"rgba(255,255,255,0.5)", margin:0 }}>
              {workerRecord
                ? `${workerRecord.role?.replace(/_/g," ")} · ${tenant?.name ?? "Your Property"}`
                : profile?.full_name}
            </p>
          </div>
        </div>

        {workerRecord && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[
              ["Monthly Salary", formatCurrency(workerRecord.salary)],
              ["Pay Cycle",      workerRecord.pay_cycle ?? "Monthly"],
              ["Start Date",     formatDate(workerRecord.start_date)],
              ["Status",         workerRecord.status],
            ].map(([k, v]) => (
              <div key={k} style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.10)",
                borderRadius:12, padding:"10px 14px", textAlign:"center" }}>
                <p style={{ fontSize:10, color:"rgba(255,255,255,0.4)", margin:"0 0 3px" }}>{k}</p>
                <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:14,
                  color: k === "Status" && v === "active" ? "#10B981" : k === "Monthly Salary" ? "#C5612C" : "#fff",
                  margin:0, textTransform:"capitalize" }}>{v}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── KPI stats ── */}
      <div className="fu2" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:16, marginBottom:24 }}>
        <StatsCard label="Total Paid (All time)" value={formatCurrency(totalPaid)} color="success"
          icon={<Ic d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6"/>}
          onClick={() => navigate("/worker/payments")} />
        <StatsCard label="Attendance Rate" value={`${attendanceRate}%`} sublabel={`${monthName}`}
          color={attendanceRate >= 80 ? "success" : attendanceRate >= 60 ? "warning" : "error"}
          icon={<Ic d="M8 2v3M16 2v3M3 9h18M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z"/>}
          onClick={() => navigate("/worker/attendance")} />
        <StatsCard label="Days Present" value={attCounts.present} sublabel={`${monthName}`} color="brand"
          icon={<Ic d="M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3"/>}
          onClick={() => navigate("/worker/attendance")} />
        {pendingPay ? (
          <StatsCard label="Pending Salary" value={formatCurrency(pendingPay.amount)} sublabel="Awaiting payment" color="warning"
            icon={<Ic d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0"/>}
            onClick={() => navigate("/worker/payments")} />
        ) : (
          <StatsCard label="Next Payment" value={formatCurrency(workerRecord?.salary ?? 0)} sublabel="All paid up" color="neutral"
            icon={<Ic d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0"/>}
            onClick={() => navigate("/worker/payments")} />
        )}
      </div>

      {/* ── Calendar + Payments ── */}
      <div className="fu3 w-two" style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:20 }}>

        {/* Attendance calendar */}
        <div style={{ background:"#fff", borderRadius:20, border:"1px solid #EDE4D8",
          boxShadow:"0 2px 8px rgba(0,0,0,0.04)", padding:"22px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
            <div>
              <p style={{ fontSize:10, fontWeight:700, color:"#C5612C", textTransform:"uppercase",
                letterSpacing:"0.1em", margin:"0 0 3px" }}>This Month</p>
              <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:18,
                color:"#1A1412", margin:0 }}>{monthName} {currentYear}</h3>
            </div>
            <Link to="/worker/attendance" style={{ fontSize:12, fontWeight:600, color:"#C5612C",
              textDecoration:"none", display:"flex", alignItems:"center", gap:3 }}>
              Full history
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </Link>
          </div>
          <AttendanceCalendar records={attendance} month={currentMonth} year={currentYear} />
        </div>

        {/* Salary payments */}
        <div style={{ background:"#fff", borderRadius:20, border:"1px solid #EDE4D8",
          boxShadow:"0 2px 8px rgba(0,0,0,0.04)", padding:"22px",
          display:"flex", flexDirection:"column" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
            <div>
              <p style={{ fontSize:10, fontWeight:700, color:"#C5612C", textTransform:"uppercase",
                letterSpacing:"0.1em", margin:"0 0 3px" }}>Salary</p>
              <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:18,
                color:"#1A1412", margin:0 }}>Payments</h3>
            </div>
            <Link to="/worker/payments" style={{ fontSize:12, fontWeight:600, color:"#C5612C",
              textDecoration:"none", display:"flex", alignItems:"center", gap:3 }}>
              View all
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </Link>
          </div>

          {/* Pending banner */}
          {pendingPay && (
            <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:12,
              padding:"12px 14px", marginBottom:14, display:"flex", gap:10, alignItems:"center" }}>
              <span style={{ fontSize:18, flexShrink:0 }}>⏳</span>
              <div>
                <p style={{ fontSize:12, fontWeight:700, color:"#92400E", margin:0 }}>Pending Payment</p>
                <p style={{ fontSize:11, color:"#D97706", margin:"2px 0 0" }}>
                  {formatCurrency(pendingPay.amount)} — due soon
                </p>
              </div>
            </div>
          )}

          {/* Payment list */}
          <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:0 }}>
            {payments.length === 0 ? (
              <p style={{ fontSize:13, color:"#8B7355", textAlign:"center", padding:"24px 0" }}>
                No payment records yet.
              </p>
            ) : (
              payments.slice(0, 6).map((p, i) => {
                const isPaid = p.payment_status === "paid";
                return (
                  <div key={p.id} style={{ display:"flex", alignItems:"center", gap:10,
                    padding:"11px 0", borderBottom: i < Math.min(payments.length,6)-1 ? "1px solid #F5EDE0" : "none" }}>
                    <div style={{ width:34, height:34, borderRadius:10, flexShrink:0,
                      background: isPaid ? "#ECFDF5" : "#FFFBEB",
                      display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>
                      {isPaid ? "✅" : "⏳"}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:13, fontWeight:600, color:"#1A1412", margin:0 }}>
                        {p.period_start ? new Date(p.period_start).toLocaleString("en-KE",{month:"short",year:"numeric"}) : "—"}
                      </p>
                      <p style={{ fontSize:11, color:"#8B7355", margin:"1px 0 0" }}>
                        {p.payment_method === "mpesa" ? "M-Pesa" : p.payment_method ?? "—"}
                        {p.mpesa_transaction_id && ` · ${p.mpesa_transaction_id}`}
                      </p>
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <p style={{ fontSize:14, fontWeight:700,
                        color: isPaid ? "#10B981" : "#D97706",
                        fontFamily:"'Playfair Display',serif", margin:0 }}>
                        {formatCurrency(p.amount)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div style={{ marginTop:14, paddingTop:12, borderTop:"1px solid #EDE4D8",
            display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:12, color:"#8B7355" }}>Total received</span>
            <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
              fontSize:15, color:"#10B981" }}>{formatCurrency(totalPaid)}</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
