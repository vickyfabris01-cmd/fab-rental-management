import { useState, useEffect } from "react";

import DashboardLayout        from "../../layouts/DashboardLayout.jsx";
import PageHeader             from "../../components/layout/PageHeader.jsx";
import StatsCard              from "../../components/data/StatsCard.jsx";
import { Spinner }            from "../../components/ui/Spinner.jsx";

import useAuthStore           from "../../store/authStore.js";
import { getWorkers, getAttendance } from "../../lib/api/workers.js";
import { formatDate }         from "../../lib/formatters.js";

// =============================================================================
// WorkerAttendancePage  /worker/attendance
// Full attendance history — month selector, calendar view, monthly stats.
// =============================================================================

const Ic = ({ d }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

// ── Shared attendance config ──────────────────────────────────────────────────
const ATT = {
  present: { dot:"#10B981", bg:"#ECFDF5", border:"#A7F3D0", text:"#065F46", label:"Present"  },
  absent:  { dot:"#EF4444", bg:"#FEF2F2", border:"#FECACA", text:"#991B1B", label:"Absent"   },
  half_day:{ dot:"#F59E0B", bg:"#FFFBEB", border:"#FDE68A", text:"#92400E", label:"Half Day" },
  leave:   { dot:"#3B82F6", bg:"#EFF6FF", border:"#BFDBFE", text:"#1E40AF", label:"Leave"    },
  off:     { dot:"#E5E7EB", bg:"#F9FAFB", border:"transparent", text:"#9CA3AF", label:"Off"  },
  future:  { dot:"transparent", bg:"transparent", border:"transparent", text:"#E5E7EB", label:"" },
};

const DAY_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ── Calendar grid ─────────────────────────────────────────────────────────────
function MonthCalendar({ records, month, year }) {
  const today       = new Date();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow    = new Date(year, month, 1).getDay();

  const byDay = {};
  records.forEach(r => {
    const d = new Date(r.date);
    if (d.getMonth() === month && d.getFullYear() === year) {
      byDay[d.getDate()] = { status: r.status, notes: r.notes };
    }
  });

  const cells = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const day  = i + 1;
      const date = new Date(year, month, day);
      const dow  = date.getDay();
      if (date > today && !(month === today.getMonth() && year === today.getFullYear() && day === today.getDate())) {
        return { day, status:"future" };
      }
      if (dow === 0) return { day, status:"off" };
      return { day, status: byDay[day]?.status ?? "future", notes: byDay[day]?.notes };
    }),
  ];

  const counts = { present:0, absent:0, half_day:0, leave:0 };
  Object.values(byDay).forEach(({ status: s }) => { if (counts[s] !== undefined) counts[s]++; });
  const workDays = counts.present + counts.absent + counts.half_day + counts.leave;
  const rate     = workDays > 0 ? Math.round(((counts.present + counts.half_day * 0.5) / workDays) * 100) : 0;

  return (
    <div>
      {/* Legend */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom:14 }}>
        {Object.entries(ATT).filter(([k]) => k !== "future" && k !== "off").map(([k, v]) => (
          <div key={k} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:v.dot }}/>
            <span style={{ fontSize:11, color:"#8B7355" }}>{v.label}</span>
          </div>
        ))}
      </div>

      {/* Day headers */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:5 }}>
        {DAY_LABELS.map(d => (
          <p key={d} style={{ textAlign:"center", fontSize:11, fontWeight:600, color:"#8B7355", margin:0, padding:"3px 0" }}>{d}</p>
        ))}
      </div>

      {/* Calendar cells */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
        {cells.map((cell, i) => {
          if (!cell) return <div key={`e-${i}`}/>;
          const cfg     = ATT[cell.status] ?? ATT.future;
          const isToday = cell.day === today.getDate()
            && month === today.getMonth()
            && year  === today.getFullYear()
            && cell.status !== "future";
          return (
            <div key={cell.day} title={cell.notes ?? cfg.label}
              style={{ aspectRatio:"1", borderRadius:9, display:"flex", flexDirection:"column",
                alignItems:"center", justifyContent:"center",
                background:  cfg.bg,
                border:      isToday ? "2px solid #C5612C" : `1px solid ${cfg.border}`,
                opacity:     cell.status === "future" ? 0.3 : 1,
                cursor:      cell.notes ? "help" : "default",
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

      {/* Monthly summary */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))",
        gap:8, marginTop:16, paddingTop:14, borderTop:"1px solid #F5EDE0" }}>
        {[
          ["Present",  counts.present,  "#10B981", "#ECFDF5"],
          ["Absent",   counts.absent,   "#EF4444", "#FEF2F2"],
          ["Half Day", counts.half_day, "#F59E0B", "#FFFBEB"],
          ["Leave",    counts.leave,    "#3B82F6", "#EFF6FF"],
          ["Rate",     `${rate}%`,      rate>=80?"#10B981":rate>=60?"#F59E0B":"#EF4444", "#FAF7F2"],
        ].map(([label, value, color, bg]) => (
          <div key={label} style={{ background:bg, borderRadius:12, padding:"10px 8px", textAlign:"center" }}>
            <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:20, color, margin:0 }}>{value}</p>
            <p style={{ fontSize:11, color:"#8B7355", margin:"2px 0 0" }}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Streak calculator ─────────────────────────────────────────────────────────
function calcLongestStreak(records) {
  const presentDays = new Set(
    records.filter(r => r.status === "present").map(r => r.date)
  );
  const sorted = [...presentDays].sort();
  let max = 0, cur = 0, prev = null;
  for (const d of sorted) {
    const dt   = new Date(d);
    const prevDt = prev ? new Date(prev) : null;
    if (prevDt) {
      const diff = (dt - prevDt) / 86400000;
      cur = (diff === 1) ? cur + 1 : 1;
    } else { cur = 1; }
    if (cur > max) max = cur;
    prev = d;
  }
  return max;
}

// =============================================================================
// Main page
// =============================================================================
export default function WorkerAttendancePage() {
  const profile = useAuthStore(s => s.profile);

  const now           = new Date();
  const [selMonth,    setSelMonth]    = useState(now.getMonth());
  const [selYear,     setSelYear]     = useState(now.getFullYear());
  const [records,     setRecords]     = useState([]);
  const [allRecords,  setAllRecords]  = useState([]);
  const [workerRecord,setWorkerRecord]= useState(null);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    if (!profile?.id || !profile?.tenant_id) return;
    setLoading(true);

    // Fetch 12 months back for streak + overall stats
    const yearAgo = new Date(); yearAgo.setFullYear(yearAgo.getFullYear() - 1);

    Promise.all([
      getWorkers(profile.tenant_id, { limit:100 }),
      getAttendance(profile.tenant_id, {
        dateFrom: yearAgo.toISOString().slice(0,10),
        dateTo:   now.toISOString().slice(0,10),
      }),
    ]).then(([{ data: workers }, { data: att }]) => {
      const mine = (workers ?? []).find(w =>
        w.user_id === profile.id ||
        w.full_name?.toLowerCase() === profile.full_name?.toLowerCase()
      );
      setWorkerRecord(mine ?? null);

      const myAtt = mine
        ? (att ?? []).filter(a => a.worker_id === mine.id)
        : [];
      setAllRecords(myAtt);
    }).finally(() => setLoading(false));
  }, [profile?.id, profile?.tenant_id]);

  // Filter records to selected month
  useEffect(() => {
    const filtered = allRecords.filter(r => {
      const d = new Date(r.date);
      return d.getMonth() === selMonth && d.getFullYear() === selYear;
    });
    setRecords(filtered);
  }, [allRecords, selMonth, selYear]);

  // Overall stats across all records
  const overallCounts = { present:0, absent:0, half_day:0, leave:0 };
  allRecords.forEach(r => { if (overallCounts[r.status] !== undefined) overallCounts[r.status]++; });
  const overallTotal = overallCounts.present + overallCounts.absent + overallCounts.half_day + overallCounts.leave;
  const overallRate  = overallTotal > 0
    ? Math.round(((overallCounts.present + overallCounts.half_day * 0.5) / overallTotal) * 100) : 0;
  const longestStreak = calcLongestStreak(allRecords);

  // Build month options (current month back 12 months)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return {
      value: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleString("en-KE", { month:"long", year:"numeric" }),
      month: d.getMonth(),
      year:  d.getFullYear(),
    };
  });

  const selLabel = new Date(selYear, selMonth, 1).toLocaleString("en-KE", { month:"long", year:"numeric" });

  return (
    <DashboardLayout pageTitle="Attendance">
      <PageHeader title="Attendance" subtitle="Your daily attendance records and history" />

      {/* Overall stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(175px,1fr))", gap:16, marginBottom:24 }}>
        <StatsCard label="Overall Rate"       value={`${overallRate}%`}
          sublabel="All time" color={overallRate>=80?"success":overallRate>=60?"warning":"error"}
          icon={<Ic d="M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3"/>} />
        <StatsCard label="Total Present"      value={overallCounts.present}
          sublabel="All time" color="success"
          icon={<Ic d="M5 13l4 4L19 7"/>} />
        <StatsCard label="Total Absent"       value={overallCounts.absent}
          sublabel="All time" color={overallCounts.absent > 5 ? "error" : "neutral"}
          icon={<Ic d="M18 6L6 18M6 6l12 12"/>} />
        <StatsCard label="Longest Streak"     value={`${longestStreak} days`}
          sublabel="Consecutive present" color="brand"
          icon={<Ic d="M13 10V3L4 14h7v7l9-11h-7z"/>} />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:20, alignItems:"start" }}
        className="att-grid">
        <style>{`@media(max-width:860px){.att-grid{grid-template-columns:1fr!important}}`}</style>

        {/* Calendar panel */}
        <div style={{ background:"#fff", borderRadius:20, border:"1px solid #EDE4D8", padding:"22px" }}>
          {/* Month selector */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
            <div>
              <p style={{ fontSize:10, fontWeight:700, color:"#C5612C", textTransform:"uppercase",
                letterSpacing:"0.1em", margin:"0 0 3px" }}>Attendance</p>
              <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:18,
                color:"#1A1412", margin:0 }}>{selLabel}</h3>
            </div>
            <select
              value={`${selYear}-${selMonth}`}
              onChange={e => {
                const opt = monthOptions.find(o => o.value === e.target.value);
                if (opt) { setSelMonth(opt.month); setSelYear(opt.year); }
              }}
              style={{ padding:"7px 12px", border:"1.5px solid #E8DDD4", borderRadius:10,
                fontSize:13, color:"#5C4A3A", background:"#FAF7F2", outline:"none", cursor:"pointer" }}
              onFocus={e => e.target.style.borderColor="#C5612C"}
              onBlur={e  => e.target.style.borderColor="#E8DDD4"}
            >
              {monthOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div style={{ display:"flex", justifyContent:"center", padding:48 }}><Spinner size="md"/></div>
          ) : (
            <MonthCalendar records={records} month={selMonth} year={selYear} />
          )}
        </div>

        {/* Sidebar: worker info + monthly breakdown list */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

          {workerRecord && (
            <div style={{ background:"linear-gradient(135deg,#1A1412 0%,#2D1E16 100%)",
              borderRadius:16, padding:"18px 20px" }}>
              <p style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.4)",
                textTransform:"uppercase", letterSpacing:"0.1em", margin:"0 0 10px" }}>Your Profile</p>
              <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:17,
                color:"#fff", margin:"0 0 4px" }}>{workerRecord.full_name}</p>
              <p style={{ fontSize:12, color:"rgba(255,255,255,0.5)", margin:"0 0 12px",
                textTransform:"capitalize" }}>
                {workerRecord.role?.replace(/_/g," ")}
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {[
                  ["Start Date",   formatDate(workerRecord.start_date)],
                  ["Status",       workerRecord.status],
                  ["Days Recorded", allRecords.length],
                ].map(([k, v]) => (
                  <div key={k} style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{k}</span>
                    <span style={{ fontSize:12, fontWeight:600, color:"#fff", textTransform:"capitalize" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monthly breakdown per month */}
          <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", padding:"18px 20px" }}>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:16,
              color:"#1A1412", marginBottom:12 }}>Monthly Breakdown</h3>
            {monthOptions.slice(0, 6).map((opt, i, arr) => {
              const monthRecs = allRecords.filter(r => {
                const d = new Date(r.date);
                return d.getMonth() === opt.month && d.getFullYear() === opt.year;
              });
              const present = monthRecs.filter(r => r.status === "present").length;
              const absent  = monthRecs.filter(r => r.status === "absent").length;
              const total   = present + absent + monthRecs.filter(r=>r.status==="half_day"||r.status==="leave").length;
              const rate    = total > 0 ? Math.round((present / total) * 100) : null;
              return (
                <div key={opt.value} style={{ display:"flex", alignItems:"center", gap:10,
                  padding:"9px 0", borderBottom: i < arr.length-1 ? "1px solid #F5EDE0" : "none",
                  cursor:"pointer" }}
                  onClick={() => { setSelMonth(opt.month); setSelYear(opt.year); }}
                  onMouseOver={e=>e.currentTarget.style.background="#FFFAF6"}
                  onMouseOut={e=>e.currentTarget.style.background="transparent"}
                >
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:12, fontWeight:600, color:"#1A1412", margin:0 }}>{opt.label}</p>
                    <p style={{ fontSize:11, color:"#8B7355", margin:"1px 0 0" }}>
                      {total > 0 ? `${present}P · ${absent}A · ${total} days` : "No records"}
                    </p>
                  </div>
                  {rate !== null && (
                    <span style={{ fontSize:11, fontWeight:700, flexShrink:0, padding:"3px 8px",
                      borderRadius:999,
                      background: rate>=80?"rgba(16,185,129,0.10)":rate>=60?"rgba(245,158,11,0.10)":"rgba(239,68,68,0.10)",
                      color:      rate>=80?"#059669":rate>=60?"#D97706":"#DC2626" }}>
                      {rate}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
