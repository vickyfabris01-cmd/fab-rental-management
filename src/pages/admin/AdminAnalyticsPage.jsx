import { useState, useEffect } from "react";

import AdminLayout              from "../../layouts/AdminLayout.jsx";
import { Spinner }              from "../../components/ui/Spinner.jsx";
import { Alert }                from "../../components/ui/Alert.jsx";
import { GrowthLineChart }      from "../../components/charts/GrowthLineChart.jsx";

import useAuthStore             from "../../store/authStore.js";
import { getPlatformStats }     from "../../lib/api/tenants.js";
import { getPlatformAnalytics } from "../../lib/api/analytics.js";

// =============================================================================
// AdminAnalyticsPage  /admin/analytics
// Platform growth, user distribution, and tenant status breakdown.
// =============================================================================

const S2 = "#1A1612"; const B = "rgba(255,255,255,0.07)";
const MU = "rgba(255,255,255,0.35)"; const DIM = "rgba(255,255,255,0.6)";
const TX = "rgba(255,255,255,0.88)"; const AC = "#C5612C";

const ROLE_CLR = { client:"#10B981",manager:"#3B82F6",owner:"#8B5CF6",worker:"#F59E0B",visitor:MU,super_admin:AC };
const STATUS_CLR = { active:"#10B981", pending:"#F59E0B", suspended:"#EF4444" };

function Tile({ label, value, color }) {
  return (
    <div style={{ background:S2,borderRadius:12,border:`1px solid ${B}`,padding:"14px 16px" }}>
      <p style={{ fontSize:11,color:MU,margin:"0 0 5px" }}>{label}</p>
      <p style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:26,color,margin:0 }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

function BarRow({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count/total)*100) : 0;
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
        <span style={{ fontSize:12,fontWeight:600,color:DIM,textTransform:"capitalize" }}>{label}</span>
        <span style={{ fontSize:11,color:MU }}>{count.toLocaleString()} ({pct}%)</span>
      </div>
      <div style={{ height:5,borderRadius:999,background:"rgba(255,255,255,0.07)" }}>
        <div style={{ height:"100%",width:`${pct}%`,borderRadius:999,background:color,transition:"width 0.5s ease" }}/>
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const user     = useAuthStore(s => s.user);
  const [stats,  setStats]   = useState(null);
  const [anl,    setAnl]     = useState(null);
  const [loading,setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      getPlatformStats(),
      import("../../config/supabase.js")
        .then(m => m.supabase.auth.getSession())
        .then(({ data: s }) => getPlatformAnalytics(s?.session?.access_token)),
    ]).then(([{ data: st }, { data: al }]) => {
      setStats(st);
      setAnl(al);
    }).finally(() => setLoading(false));
  }, [user?.id]);

  if (loading) return (
    <AdminLayout>
      <div style={{ display:"flex",justifyContent:"center",padding:80 }}><Spinner size="lg"/></div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div style={{ marginBottom:20 }}>
        <p style={{ fontSize:10,fontWeight:700,color:AC,textTransform:"uppercase",letterSpacing:"0.1em",margin:"0 0 3px" }}>System</p>
        <h1 style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:24,color:TX,margin:0 }}>Platform Analytics</h1>
      </div>

      {/* KPI tiles */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12,marginBottom:20 }}>
        <Tile label="Total Tenants"   value={stats?.tenants?.total   ?? 0} color={AC}      />
        <Tile label="Active Tenants"  value={stats?.tenants?.active  ?? 0} color="#10B981" />
        <Tile label="Pending"         value={stats?.tenants?.pending ?? 0} color="#F59E0B" />
        <Tile label="Suspended"       value={stats?.tenants?.suspended ?? 0} color="#EF4444"/>
        <Tile label="Total Users"     value={stats?.users?.total     ?? 0} color="#3B82F6" />
        <Tile label="Residents"       value={stats?.users?.client    ?? 0} color="#10B981" />
        <Tile label="Managers"        value={stats?.users?.manager   ?? 0} color="#8B5CF6" />
        <Tile label="Workers"         value={stats?.users?.worker    ?? 0} color="#F59E0B" />
      </div>

      {/* Growth chart */}
      {anl?.growth?.length > 0 ? (
        <div style={{ background:S2,borderRadius:16,border:`1px solid ${B}`,padding:"20px 22px",marginBottom:20 }}>
          <h3 style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:17,color:TX,marginBottom:14 }}>
            Platform Growth
          </h3>
          <GrowthLineChart data={anl.growth} height={240} />
        </div>
      ) : (
        <Alert type="info"
          message="Growth charts are served by FastAPI /analytics/platform. Connect the backend to see tenant acquisition, churn, and user growth trends."
          style={{ marginBottom:20 }}
        />
      )}

      {/* Two column: user roles + tenant status */}
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }} className="analytics-split">
        <style>{`@media(max-width:760px){.analytics-split{grid-template-columns:1fr!important}}`}</style>

        {/* User role distribution */}
        {stats?.users && (
          <div style={{ background:S2,borderRadius:16,border:`1px solid ${B}`,padding:"20px 22px" }}>
            <h3 style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:17,color:TX,marginBottom:16 }}>
              User Role Distribution
            </h3>
            {Object.entries(stats.users)
              .filter(([k]) => k !== "total")
              .sort(([,a],[,b]) => b - a)
              .map(([role, count]) => (
                <BarRow key={role} label={role} count={count}
                  total={stats.users.total} color={ROLE_CLR[role] ?? DIM} />
              ))
            }
          </div>
        )}

        {/* Tenant status breakdown */}
        {stats?.tenants && (
          <div style={{ background:S2,borderRadius:16,border:`1px solid ${B}`,padding:"20px 22px" }}>
            <h3 style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:17,color:TX,marginBottom:16 }}>
              Tenant Status Breakdown
            </h3>
            {Object.entries(stats.tenants)
              .filter(([k]) => k !== "total")
              .sort(([,a],[,b]) => b - a)
              .map(([status, count]) => (
                <BarRow key={status} label={status} count={count}
                  total={stats.tenants.total} color={STATUS_CLR[status] ?? DIM} />
              ))
            }

            {/* Plan breakdown if available */}
            {anl?.plans && (
              <>
                <h3 style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:15,color:TX,marginTop:20,marginBottom:12 }}>
                  Plan Distribution
                </h3>
                {Object.entries(anl.plans).map(([plan, count]) => (
                  <BarRow key={plan} label={plan} count={count}
                    total={stats.tenants.total} color={AC} />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
