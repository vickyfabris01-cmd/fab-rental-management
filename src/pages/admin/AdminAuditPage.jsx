import { useState, useEffect } from "react";

import AdminLayout  from "../../layouts/AdminLayout.jsx";
import { Alert }    from "../../components/ui/Alert.jsx";
import { Spinner }  from "../../components/ui/Spinner.jsx";

import useAuthStore from "../../store/authStore.js";
import { formatRelativeTime } from "../../lib/formatters.js";

// =============================================================================
// AdminAuditPage  /admin/audit
//
// Supabase does not expose auth.audit_log_entries to the client SDK.
// This page fetches audit data from FastAPI GET /admin/audit (when available)
// and falls back to showing recent platform events from a static sample.
// =============================================================================

const S2 = "#1A1612"; const B = "rgba(255,255,255,0.07)";
const MU = "rgba(255,255,255,0.35)"; const TX = "rgba(255,255,255,0.88)"; const AC = "#C5612C";

const LEVEL_STYLE = {
  info:    { color:"#3B82F6", bg:"rgba(59,130,246,0.10)"  },
  success: { color:"#10B981", bg:"rgba(16,185,129,0.10)"  },
  warning: { color:"#F59E0B", bg:"rgba(245,158,11,0.10)"  },
  error:   { color:"#EF4444", bg:"rgba(239,68,68,0.10)"   },
};

// Sample logs shown when FastAPI is not connected
const SAMPLE_LOGS = [
  { id:1,  actor:"System",           action:"billing_cycles_generated",   resource:"tenants/all",        time:new Date(Date.now()-2*60*1000).toISOString(),   level:"info"    },
  { id:2,  actor:"admin@fabrentals", action:"tenant_approved",            resource:"tenant/sunrise-hostel", time:new Date(Date.now()-18*60*1000).toISOString(), level:"success" },
  { id:3,  actor:"System",           action:"password_reset_sent",        resource:"user/profile-xyz",   time:new Date(Date.now()-45*60*1000).toISOString(),  level:"info"    },
  { id:4,  actor:"admin@fabrentals", action:"tenant_suspended",           resource:"tenant/kasarani",    time:new Date(Date.now()-2*3600*1000).toISOString(), level:"warning" },
  { id:5,  actor:"System",           action:"new_tenant_registered",      resource:"tenant/bluepeak",    time:new Date(Date.now()-3*3600*1000).toISOString(), level:"info"    },
  { id:6,  actor:"System",           action:"mpesa_webhook_received",     resource:"payment/qkt12x",     time:new Date(Date.now()-3*3600*1000).toISOString(), level:"success" },
  { id:7,  actor:"admin@fabrentals", action:"platform_settings_updated",  resource:"settings",           time:new Date(Date.now()-86400*1000).toISOString(), level:"info"    },
  { id:8,  actor:"System",           action:"worker_salary_disbursed",    resource:"payment/salary",     time:new Date(Date.now()-2*86400*1000).toISOString(),level:"success" },
  { id:9,  actor:"admin@fabrentals", action:"tenant_plan_upgraded",       resource:"tenant/greenfield",  time:new Date(Date.now()-3*86400*1000).toISOString(),level:"success" },
  { id:10, actor:"System",           action:"failed_login_attempt",       resource:"auth",               time:new Date(Date.now()-4*86400*1000).toISOString(),level:"error"   },
];

export default function AdminAuditPage() {
  const user     = useAuthStore(s => s.user);
  const [logs,   setLogs]    = useState([]);
  const [loading,setLoading] = useState(true);
  const [live,   setLive]    = useState(false);
  const [filter, setFilter]  = useState("all");

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);

    // Attempt to fetch from FastAPI
    import("../../config/supabase.js")
      .then(m => m.supabase.auth.getSession())
      .then(({ data: s }) => {
        const token = s?.session?.access_token;
        if (!token) return null;
        return fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/audit?limit=50`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.ok ? r.json() : null).catch(() => null);
      })
      .then(data => {
        if (data?.logs?.length) {
          setLogs(data.logs);
          setLive(true);
        } else {
          setLogs(SAMPLE_LOGS);
          setLive(false);
        }
      })
      .catch(() => { setLogs(SAMPLE_LOGS); setLive(false); })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const LEVEL_FILTERS = ["all","info","success","warning","error"];
  const filtered = filter === "all" ? logs : logs.filter(l => l.level === filter);

  return (
    <AdminLayout>
      <div style={{ marginBottom:20 }}>
        <p style={{ fontSize:10,fontWeight:700,color:AC,textTransform:"uppercase",letterSpacing:"0.1em",margin:"0 0 3px" }}>System</p>
        <h1 style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:24,color:TX,margin:0 }}>Audit Logs</h1>
      </div>

      {!live && !loading && (
        <Alert type="info" compact
          message="Full audit logs are served by FastAPI GET /admin/audit. Currently showing sample platform events."
          style={{ marginBottom:16 }}
        />
      )}

      {live && (
        <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:16 }}>
          <span style={{ width:7,height:7,borderRadius:"50%",background:"#10B981",
            boxShadow:"0 0 6px #10B981",display:"inline-block" }}/>
          <span style={{ fontSize:12,color:"#10B981",fontWeight:600 }}>Live data from FastAPI</span>
        </div>
      )}

      {/* Level filter */}
      <div style={{ display:"flex",gap:4,background:S2,borderRadius:10,border:`1px solid ${B}`,
        padding:4,width:"fit-content",marginBottom:16 }}>
        {LEVEL_FILTERS.map(f => {
          const s = LEVEL_STYLE[f];
          return (
            <button key={f} onClick={() => setFilter(f)}
              style={{ fontSize:11,fontWeight:600,padding:"5px 12px",borderRadius:7,border:"none",cursor:"pointer",
                background: filter===f ? (s?.color ?? AC) : "transparent",
                color:      filter===f ? "#fff" : MU,
                transition:"all 0.15s" }}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ display:"flex",justifyContent:"center",padding:60 }}><Spinner size="lg"/></div>
      ) : (
        <div style={{ background:S2,borderRadius:16,border:`1px solid ${B}`,overflow:"hidden" }}>
          {filtered.length === 0 ? (
            <p style={{ fontSize:13,color:MU,textAlign:"center",padding:48 }}>No log entries for this filter.</p>
          ) : filtered.map((log, i) => {
            const s = LEVEL_STYLE[log.level] ?? LEVEL_STYLE.info;
            const timeStr = log.time
              ? (typeof log.time === "string" && log.time.includes("ago") ? log.time : formatRelativeTime(log.time))
              : "—";
            return (
              <div key={log.id ?? i} style={{ display:"flex",alignItems:"flex-start",gap:12,padding:"13px 20px",
                borderBottom: i < filtered.length-1 ? `1px solid ${B}` : "none" }}>
                <span style={{ width:7,height:7,borderRadius:"50%",background:s.color,flexShrink:0,marginTop:5 }}/>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:4 }}>
                    <p style={{ fontSize:13,fontWeight:600,color:TX,margin:0 }}>
                      <span style={{ color:AC }}>{log.actor}</span>
                      {" · "}
                      <span style={{ fontFamily:"'DM Mono','Courier New',monospace",fontSize:12 }}>
                        {log.action}
                      </span>
                    </p>
                    <span style={{ fontSize:11,color:MU,flexShrink:0 }}>{timeStr}</span>
                  </div>
                  <div style={{ display:"flex",gap:8,alignItems:"center" }}>
                    <span style={{ fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:999,
                      background:s.bg,color:s.color }}>{log.level}</span>
                    {log.resource && (
                      <span style={{ fontSize:11,color:MU,fontFamily:"'DM Mono','Courier New',monospace" }}>
                        {log.resource}
                      </span>
                    )}
                    {log.ip && (
                      <span style={{ fontSize:11,color:MU,fontFamily:"'DM Mono','Courier New',monospace" }}>
                        · {log.ip}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
