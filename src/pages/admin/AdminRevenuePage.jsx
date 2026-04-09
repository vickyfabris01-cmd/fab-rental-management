import { useState, useEffect } from "react";

import AdminLayout           from "../../layouts/AdminLayout.jsx";
import { Spinner }           from "../../components/ui/Spinner.jsx";
import { Alert }             from "../../components/ui/Alert.jsx";
import { RevenueChart }      from "../../components/charts/RevenueChart.jsx";

import useAuthStore          from "../../store/authStore.js";
import { getPlatformAnalytics } from "../../lib/api/analytics.js";
import { getTenants }        from "../../lib/api/tenants.js";
import { formatCurrency }    from "../../lib/formatters.js";
import { useLocation } from "react-router-dom";

// =============================================================================
// AdminRevenuePage  /admin/revenue
// Platform-wide revenue overview powered by FastAPI /analytics/platform.
// =============================================================================

const S2 = "#1A1612"; const B = "rgba(255,255,255,0.07)";
const MU = "rgba(255,255,255,0.35)"; const TX = "rgba(255,255,255,0.88)"; const AC = "#C5612C";

export default function AdminRevenuePage() {
  const user     = useAuthStore(s => s.user);
  const [data,   setData]    = useState(null);
  const [tenants,setTenants] = useState([]);
  const [loading,setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      // Get JWT then call FastAPI
      import("../../config/supabase.js")
        .then(m => m.supabase.auth.getSession())
        .then(({ data: s }) => getPlatformAnalytics(s?.session?.access_token)),
      getTenants({ limit: 100 }),
    ]).then(([{ data: d }, { data: t }]) => {
      setData(d);
      setTenants(t ?? []);
    }).finally(() => setLoading(false));
  }, [user?.id]);

  const activeTenants = tenants.filter(t => t.status === "active").length;
  const pendingCount  = tenants.filter(t => t.status === "pending").length;

  return (
    <AdminLayout>
      <div style={{ marginBottom:20 }}>
        <p style={{ fontSize:10,fontWeight:700,color:AC,textTransform:"uppercase",letterSpacing:"0.1em",margin:"0 0 3px" }}>
          Platform Revenue
        </p>
        <h1 style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:24,color:TX,margin:0 }}>
          Revenue Overview
        </h1>
      </div>

      {loading ? (
        <div style={{ display:"flex",justifyContent:"center",padding:60 }}><Spinner size="lg"/></div>
      ) : (
        <>
          {/* KPI tiles */}
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:12,marginBottom:20 }}>
            {[
              ["Active Tenants",   activeTenants,                                                       AC      ],
              ["Pending Approval", pendingCount,                                                         "#F59E0B"],
              ["Platform MRR",     data?.mrr           ? `KES ${(data.mrr/1000).toFixed(0)}K`    : "N/A","#10B981"],
              ["Annual ARR",       data?.arr           ? `KES ${(data.arr/1000).toFixed(0)}K`    : "N/A","#3B82F6"],
              ["Total Revenue",    data?.total_revenue ? formatCurrency(data.total_revenue)       : "N/A","#8B5CF6"],
              ["Avg per Tenant",   data?.mrr && activeTenants ? formatCurrency(Math.round(data.mrr/activeTenants)) : "N/A","#F59E0B"],
            ].map(([label, value, color]) => (
              <div key={label} style={{ background:S2,borderRadius:12,border:`1px solid ${B}`,padding:"16px 18px" }}>
                <p style={{ fontSize:11,color:MU,margin:"0 0 6px" }}>{label}</p>
                <p style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:24,color,margin:0 }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Revenue chart */}
          {data?.monthly_revenue?.length > 0 ? (
            <div style={{ background:S2,borderRadius:16,border:`1px solid ${B}`,padding:"20px 22px",marginBottom:20 }}>
              <h3 style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:17,color:TX,marginBottom:16 }}>
                Monthly Platform Revenue
              </h3>
              <RevenueChart
                data={data.monthly_revenue.map(m => ({ month:m.month, billed:m.billed, collected:m.collected }))}
                height={280} showLegend showGrid
              />
            </div>
          ) : (
            <Alert type="info"
              message="Revenue charts are served by FastAPI /analytics/platform. Start the backend and ensure the super_admin JWT is being passed correctly."
              style={{ marginBottom:20 }}
            />
          )}

          {/* Per-tenant breakdown if available */}
          {data?.tenants_revenue?.length > 0 && (
            <div style={{ background:S2,borderRadius:16,border:`1px solid ${B}`,overflow:"hidden" }}>
              <div style={{ padding:"16px 20px",borderBottom:`1px solid ${B}` }}>
                <h3 style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:17,color:TX,margin:0 }}>
                  Revenue by Tenant
                </h3>
              </div>
              {data.tenants_revenue.map((t, i) => (
                <div key={t.id ?? i} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 20px",
                  borderBottom: i < data.tenants_revenue.length-1 ? `1px solid ${B}` : "none" }}>
                  <div style={{ width:30,height:30,borderRadius:8,background:"rgba(197,97,44,0.15)",display:"flex",
                    alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:AC,flexShrink:0 }}>
                    {t.name?.charAt(0)}
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <p style={{ fontSize:13,fontWeight:600,color:TX,margin:0 }}>{t.name}</p>
                    <p style={{ fontSize:11,color:MU,margin:"1px 0 0" }}>{t.rooms} rooms · {t.residents} residents</p>
                  </div>
                  <p style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:15,color:"#10B981",margin:0 }}>
                    {formatCurrency(t.collected)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
