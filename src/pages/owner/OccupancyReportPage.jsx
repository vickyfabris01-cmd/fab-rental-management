import { useState, useEffect } from "react";
import { useNavigate }         from "react-router-dom";

import DashboardLayout         from "../../layouts/DashboardLayout.jsx";
import PageHeader              from "../../components/layout/PageHeader.jsx";
import StatsCard               from "../../components/data/StatsCard.jsx";
import { Spinner }             from "../../components/ui/Spinner.jsx";
import Badge                   from "../../components/ui/Badge.jsx";
import { OccupancyChart }      from "../../components/charts/OccupancyChart.jsx";
import { OccupancyTrendLine }  from "../../components/charts/OccupancyTrendLine.jsx";

import useAuthStore            from "../../store/authStore.js";
import { getOccupancyStats, getOccupancyByBuilding } from "../../lib/api/analytics.js";
import { getRooms }            from "../../lib/api/rooms.js";
import { formatCurrency }      from "../../lib/formatters.js";

// =============================================================================
// OccupancyReportPage  /owner/occupancy
// =============================================================================

const STATUS_ORDER = ["occupied","available","maintenance","reserved"];

function OccupancyGauge({ rate }) {
  const color = rate >= 80 ? "#10B981" : rate >= 60 ? "#F59E0B" : "#EF4444";
  return (
    <div style={{ position:"relative", display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
      <svg width={140} height={80} viewBox="0 0 140 80">
        <path d="M 10 70 A 60 60 0 0 1 130 70" fill="none" stroke="#F5EDE0" strokeWidth={12} strokeLinecap="round"/>
        <path d="M 10 70 A 60 60 0 0 1 130 70" fill="none" stroke={color} strokeWidth={12} strokeLinecap="round"
          strokeDasharray={`${(rate/100)*188.5} 188.5`}/>
      </svg>
      <div style={{ position:"absolute", bottom:4, textAlign:"center" }}>
        <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:26,
          color:"#1A1412", margin:0, lineHeight:1 }}>{rate}%</p>
        <p style={{ fontSize:10, color:"#8B7355", margin:0 }}>occupied</p>
      </div>
    </div>
  );
}

export default function OccupancyReportPage() {
  const profile  = useAuthStore(s => s.profile);
  const tenantId = profile?.tenant_id;

  const [stats,      setStats]      = useState(null);
  const [buildings,  setBuildings]  = useState([]);
  const [rooms,      setRooms]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    Promise.all([
      getOccupancyStats(tenantId),
      getOccupancyByBuilding(tenantId),
      getRooms(tenantId, { limit: 200 }),
    ]).then(([{ data: s }, { data: b }, { data: r }]) => {
      setStats(s);
      setBuildings(b ?? []);
      setRooms(r ?? []);
    }).finally(() => setLoading(false));
  }, [tenantId]);

  const filteredRooms = filterStatus === "all" ? rooms : rooms.filter(r => r.status === filterStatus);

  if (loading) return (
    <DashboardLayout pageTitle="Occupancy Report">
      <div style={{ display:"flex", justifyContent:"center", padding:80 }}><Spinner size="lg"/></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout pageTitle="Occupancy Report">
      <PageHeader title="Occupancy Report" subtitle="Room-by-room and building-level occupancy analysis" />

      {/* ── Summary row ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))", gap:16, marginBottom:24 }}>
        {[
          ["Total Rooms",   stats?.total      ?? 0, "neutral"],
          ["Occupied",      stats?.occupied   ?? 0, "success"],
          ["Available",     stats?.available  ?? 0, "brand"  ],
          ["Maintenance",   stats?.maintenance?? 0, "warning"],
          ["Reserved",      stats?.reserved   ?? 0, "neutral"],
        ].map(([label, value, color]) => (
          <StatsCard key={label} label={label} value={value} color={color}
            icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/></svg>}
          />
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"240px 1fr", gap:20, marginBottom:24 }}>
        {/* Gauge */}
        <div style={{ background:"#fff", borderRadius:20, border:"1px solid #EDE4D8",
          padding:"24px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
          <p style={{ fontSize:10, fontWeight:700, color:"#C5612C", textTransform:"uppercase",
            letterSpacing:"0.1em", marginBottom:16 }}>Overall Occupancy</p>
          <OccupancyGauge rate={stats?.rate ?? 0} />
          <div style={{ marginTop:16, display:"flex", flexDirection:"column", gap:8, width:"100%" }}>
            {STATUS_ORDER.map(s => {
              const count = stats?.[s] ?? 0;
              const pct   = stats?.total > 0 ? Math.round((count/stats.total)*100) : 0;
              const color = s==="occupied"?"#10B981":s==="available"?"#C5612C":s==="maintenance"?"#F59E0B":"#8B7355";
              return (
                <div key={s} style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ width:8, height:8, borderRadius:"50%", background:color, flexShrink:0 }}/>
                  <span style={{ fontSize:12, color:"#5C4A3A", flex:1, textTransform:"capitalize" }}>{s}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:"#1A1412" }}>{count}</span>
                  <span style={{ fontSize:11, color:"#8B7355" }}>({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Building chart */}
        <div style={{ background:"#fff", borderRadius:20, border:"1px solid #EDE4D8", padding:"20px 22px" }}>
          <p style={{ fontSize:10, fontWeight:700, color:"#C5612C", textTransform:"uppercase",
            letterSpacing:"0.1em", marginBottom:4 }}>Per Building</p>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17,
            color:"#1A1412", marginBottom:16 }}>Building Breakdown</h3>
          {buildings.length > 0
            ? <OccupancyChart data={buildings} height={220} variant="stacked" showRate />
            : <p style={{ fontSize:13, color:"#8B7355", textAlign:"center", padding:"40px 0" }}>No building data.</p>
          }
        </div>
      </div>

      {/* Building cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:16, marginBottom:24 }}>
        {buildings.map(b => {
          const pct = b.rate ?? 0;
          return (
            <div key={b.id} style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", padding:"18px 20px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                <div>
                  <p style={{ fontSize:15, fontWeight:700, color:"#1A1412", margin:0 }}>{b.name}</p>
                  <p style={{ fontSize:12, color:"#8B7355", margin:"2px 0 0" }}>
                    {b.occupied}/{b.total} rooms occupied
                  </p>
                </div>
                <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:20,
                  color: pct>=80?"#10B981":pct>=60?"#F59E0B":"#EF4444" }}>{pct}%</span>
              </div>
              <div style={{ height:6, borderRadius:999, background:"#F5EDE0", overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${pct}%`, borderRadius:999,
                  background: pct>=80?"#10B981":pct>=60?"#F59E0B":"#EF4444", transition:"width 0.6s ease" }}/>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginTop:12 }}>
                {[["Available",b.available||0,"#C5612C"],["Maintenance",b.maintenance||0,"#F59E0B"]].map(([k,v,c])=>(
                  <div key={k} style={{ background:"#FAF7F2", borderRadius:8, padding:"6px 10px" }}>
                    <p style={{ fontSize:10, color:"#8B7355", margin:"0 0 1px" }}>{k}</p>
                    <p style={{ fontSize:14, fontWeight:700, color:c, margin:0 }}>{v}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Room table with filter */}
      <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", overflow:"hidden" }}>
        <div style={{ padding:"16px 20px", borderBottom:"1px solid #EDE4D8",
          display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17,
            color:"#1A1412", margin:0 }}>All Rooms</h3>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ padding:"7px 14px", border:"1.5px solid #E8DDD4", borderRadius:10, fontSize:13,
              color:"#5C4A3A", background:"#fff", outline:"none" }}>
            <option value="all">All Status</option>
            {STATUS_ORDER.map(s => <option key={s} value={s} style={{ textTransform:"capitalize" }}>{s}</option>)}
          </select>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:480 }}>
            <thead>
              <tr style={{ borderBottom:"1.5px solid #EDE4D8" }}>
                {["Room","Type","Status","Building","Price/mo"].map(h=>(
                  <th key={h} style={{ padding:"8px 16px", textAlign:"left", fontSize:11, fontWeight:700,
                    color:"#8B7355", textTransform:"uppercase", letterSpacing:"0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRooms.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: i < filteredRooms.length-1 ? "1px solid #F5EDE0" : "none" }}
                  onMouseOver={e => e.currentTarget.style.background = "#FFFAF6"}
                  onMouseOut={e  => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding:"11px 16px", fontWeight:700, fontSize:13, color:"#1A1412" }}>Room {r.room_number}</td>
                  <td style={{ padding:"11px 16px", fontSize:13, color:"#5C4A3A", textTransform:"capitalize" }}>{r.room_type?.replace(/_/g," ")}</td>
                  <td style={{ padding:"11px 16px" }}><Badge variant={r.status} size="sm"/></td>
                  <td style={{ padding:"11px 16px", fontSize:13, color:"#8B7355" }}>{r.buildings?.name ?? "—"}</td>
                  <td style={{ padding:"11px 16px", fontSize:13, fontWeight:600, color:"#1A1412" }}>{formatCurrency(r.monthly_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRooms.length === 0 && (
            <p style={{ fontSize:13, color:"#8B7355", textAlign:"center", padding:"32px 20px" }}>No rooms match the selected filter.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
