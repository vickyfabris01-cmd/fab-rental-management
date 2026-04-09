import { useState, useEffect } from "react";

import AdminLayout  from "../../layouts/AdminLayout.jsx";
import { Spinner }  from "../../components/ui/Spinner.jsx";
import { TabBar }   from "../../components/navigation/TabBar.jsx";

import useAuthStore from "../../store/authStore.js";
import { db }       from "../../config/supabase.js";
import { formatRelativeTime, formatDate } from "../../lib/formatters.js";
import { useLocation } from "react-router-dom";

// =============================================================================
// AdminAuditPage  /admin/audit
//
// Real platform activity log built entirely from Supabase — no FastAPI needed.
// Aggregates recent events from:
//   tenants        — new registrations, status changes
//   profiles       — new users, role changes
//   tenancies      — move-ins, move-outs
//   payments       — recent payments confirmed
//   complaints     — new complaints opened
//   rental_requests — new requests submitted
//
// Events are sorted by time desc and displayed in a unified feed.
// =============================================================================

const S2 = "#1A1612";
const B  = "rgba(255,255,255,0.07)";
const MU = "rgba(255,255,255,0.35)";
const TX = "rgba(255,255,255,0.88)";
const AC = "#C5612C";

const LEVEL_STYLE = {
  info:    { color: "#3B82F6", bg: "rgba(59,130,246,0.10)"  },
  success: { color: "#10B981", bg: "rgba(16,185,129,0.10)"  },
  warning: { color: "#F59E0B", bg: "rgba(245,158,11,0.10)"  },
  error:   { color: "#EF4444", bg: "rgba(239,68,68,0.10)"   },
};

function icon(level) {
  const paths = {
    info:    "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    success: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    warning: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
    error:   "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
  };
  return paths[level] ?? paths.info;
}

// Build a unified activity feed from multiple Supabase tables
async function fetchAuditEvents() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // last 30 days
  const events = [];

  const [
    tenantsRes, profilesRes, tenanciesRes,
    paymentsRes, complaintsRes, requestsRes,
  ] = await Promise.allSettled([
    db.tenants()
      .select("id, name, slug, status, created_at, updated_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(30),

    db.profiles()
      .select("id, full_name, email, role, created_at, updated_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(30),

    db.tenancies()
      .select("id, status, move_in_date, move_out_date, created_at, updated_at, profiles!client_id(full_name), rooms!room_id(room_number)")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(20),

    db.payments()
      .select("id, amount, payment_method, payment_status, created_at, client:profiles!client_id(full_name)")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(20),

    db.complaints()
      .select("id, title, status, priority, created_at, submitter:profiles!submitted_by(full_name)")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(20),

    db.rentalRequests()
      .select("id, status, created_at, profiles!requester_id(full_name), rooms!room_id(room_number)")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  // Tenants
  if (tenantsRes.status === "fulfilled") {
    (tenantsRes.value.data ?? []).forEach(t => {
      events.push({
        id:       `t-${t.id}`,
        time:     t.created_at,
        level:    t.status === "active" ? "success" : t.status === "suspended" ? "warning" : "info",
        category: "tenant",
        actor:    "System",
        action:   t.status === "active" ? "tenant_activated"
                : t.status === "suspended" ? "tenant_suspended"
                : "tenant_registered",
        resource: `tenant/${t.slug ?? t.name}`,
        detail:   t.name,
      });
    });
  }

  // Profiles (new users)
  if (profilesRes.status === "fulfilled") {
    (profilesRes.value.data ?? []).forEach(p => {
      events.push({
        id:       `p-${p.id}`,
        time:     p.created_at,
        level:    "info",
        category: "user",
        actor:    "Auth",
        action:   "user_registered",
        resource: `user/${p.role}`,
        detail:   `${p.full_name ?? p.email ?? "New user"} joined as ${p.role}`,
      });
    });
  }

  // Tenancies (move-ins / move-outs)
  if (tenanciesRes.status === "fulfilled") {
    (tenanciesRes.value.data ?? []).forEach(t => {
      const name = t.profiles?.full_name ?? "Resident";
      const room = t.rooms?.room_number ?? "—";
      events.push({
        id:       `ten-${t.id}`,
        time:     t.created_at,
        level:    "success",
        category: "tenancy",
        actor:    "Manager",
        action:   t.status === "completed" ? "move_out_confirmed" : "move_in_confirmed",
        resource: `room/${room}`,
        detail:   `${name} → Room ${room}`,
      });
    });
  }

  // Payments
  if (paymentsRes.status === "fulfilled") {
    (paymentsRes.value.data ?? []).forEach(p => {
      const name   = p.client?.full_name ?? "Resident";
      const method = p.payment_method === "mpesa" ? "M-Pesa"
                   : p.payment_method === "cash"  ? "Cash"
                   : p.payment_method ?? "Payment";
      events.push({
        id:       `pay-${p.id}`,
        time:     p.created_at,
        level:    p.payment_status === "confirmed" ? "success"
                : p.payment_status === "failed"    ? "error" : "info",
        category: "payment",
        actor:    name,
        action:   `payment_${p.payment_status ?? "recorded"}`,
        resource: `payment/${method.toLowerCase()}`,
        detail:   `KES ${Number(p.amount ?? 0).toLocaleString()} via ${method}`,
      });
    });
  }

  // Complaints
  if (complaintsRes.status === "fulfilled") {
    (complaintsRes.value.data ?? []).forEach(c => {
      const name = c.submitter?.full_name ?? "Resident";
      events.push({
        id:       `com-${c.id}`,
        time:     c.created_at,
        level:    c.priority === "urgent" ? "error"
                : c.priority === "high"   ? "warning" : "info",
        category: "complaint",
        actor:    name,
        action:   "complaint_submitted",
        resource: `complaint/${c.status}`,
        detail:   c.title,
      });
    });
  }

  // Rental requests
  if (requestsRes.status === "fulfilled") {
    (requestsRes.value.data ?? []).forEach(r => {
      const name = r.profiles?.full_name ?? "Visitor";
      const room = r.rooms?.room_number ?? "—";
      events.push({
        id:       `req-${r.id}`,
        time:     r.created_at,
        level:    r.status === "rejected" ? "warning"
                : r.status === "accepted" ? "success" : "info",
        category: "request",
        actor:    name,
        action:   `rental_request_${r.status ?? "submitted"}`,
        resource: `room/${room}`,
        detail:   `Room ${room} request — ${r.status ?? "pending"}`,
      });
    });
  }

  // Sort all events newest first
  events.sort((a, b) => new Date(b.time) - new Date(a.time));
  return events.slice(0, 100); // cap at 100 entries
}

const CATEGORY_TABS = [
  { value: "all",       label: "All"       },
  { value: "tenant",    label: "Tenants"   },
  { value: "user",      label: "Users"     },
  { value: "tenancy",   label: "Tenancies" },
  { value: "payment",   label: "Payments"  },
  { value: "complaint", label: "Complaints"},
  { value: "request",   label: "Requests"  },
];

const LEVEL_FILTERS = ["all", "info", "success", "warning", "error"];

export default function AdminAuditPage() {
  const user = useAuthStore(s => s.user);
  const location = useLocation();

  const [logs,     setLogs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [category, setCategory] = useState("all");
  const [level,    setLevel]    = useState("all");
  const [search,   setSearch]   = useState("");

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    fetchAuditEvents()
      .then(events => setLogs(events))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const filtered = logs.filter(l => {
    if (category !== "all" && l.category !== category) return false;
    if (level    !== "all" && l.level    !== level)    return false;
    if (search) {
      const q = search.toLowerCase();
      if (!l.action?.toLowerCase().includes(q) &&
          !l.detail?.toLowerCase().includes(q) &&
          !l.actor?.toLowerCase().includes(q)  &&
          !l.resource?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize:10, fontWeight:700, color:AC, textTransform:"uppercase",
          letterSpacing:"0.1em", margin:"0 0 3px" }}>System</p>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900,
          fontSize:24, color:TX, margin:0 }}>Audit Log</h1>
        <p style={{ fontSize:13, color:MU, margin:"4px 0 0" }}>
          Real-time platform activity — last 30 days · {logs.length} events
        </p>
      </div>

      {/* Live badge */}
      {!loading && (
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
          <span style={{ width:7, height:7, borderRadius:"50%", background:"#10B981",
            boxShadow:"0 0 6px #10B981", display:"inline-block",
            animation:"audit_pulse 2s infinite" }}/>
          <span style={{ fontSize:12, color:"#10B981", fontWeight:600 }}>
            Live — Supabase direct
          </span>
          <style>{`@keyframes audit_pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
        </div>
      )}

      {/* Category tabs */}
      <div style={{ marginBottom:14, overflowX:"auto" }}>
        <TabBar tabs={CATEGORY_TABS} active={category} onChange={setCategory} />
      </div>

      {/* Level + search toolbar */}
      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ display:"flex", gap:3, background:S2, borderRadius:10,
          border:`1px solid ${B}`, padding:3 }}>
          {LEVEL_FILTERS.map(f => {
            const s = LEVEL_STYLE[f];
            return (
              <button key={f} onClick={() => setLevel(f)}
                style={{ fontSize:11, fontWeight:600, padding:"5px 11px",
                  borderRadius:7, border:"none", cursor:"pointer",
                  background: level===f ? (s?.color ?? AC) : "transparent",
                  color:      level===f ? "#fff" : MU,
                  transition: "all 0.15s" }}>
                {f.charAt(0).toUpperCase()+f.slice(1)}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ position:"relative", flex:1, maxWidth:280 }}>
          <svg style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)",
            pointerEvents:"none" }} width="13" height="13" viewBox="0 0 24 24"
            fill="none" stroke={MU} strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search events…"
            style={{ width:"100%", paddingLeft:28, paddingRight:12, paddingTop:8,
              paddingBottom:8, background:"rgba(255,255,255,0.04)",
              border:`1px solid ${B}`, borderRadius:10, fontSize:12,
              color:TX, outline:"none", boxSizing:"border-box" }}
          />
        </div>

        <span style={{ fontSize:12, color:MU, marginLeft:"auto", flexShrink:0 }}>
          {filtered.length} event{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Log feed */}
      {loading ? (
        <div style={{ display:"flex", justifyContent:"center", padding:60 }}>
          <Spinner size="lg"/>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background:S2, borderRadius:16, border:`1px solid ${B}`,
          padding:"48px 24px", textAlign:"center" }}>
          <p style={{ fontSize:14, color:MU }}>No events match the current filter.</p>
        </div>
      ) : (
        <div style={{ background:S2, borderRadius:16, border:`1px solid ${B}`,
          overflow:"hidden" }}>
          {filtered.map((log, i) => {
            const s = LEVEL_STYLE[log.level] ?? LEVEL_STYLE.info;
            return (
              <div key={log.id ?? i}
                style={{ display:"flex", alignItems:"flex-start", gap:14,
                  padding:"13px 20px",
                  borderBottom: i < filtered.length - 1 ? `1px solid ${B}` : "none",
                  transition:"background 0.15s" }}
                onMouseOver={e => e.currentTarget.style.background="rgba(255,255,255,0.02)"}
                onMouseOut={e  => e.currentTarget.style.background="transparent"}
              >
                {/* Level icon */}
                <div style={{ width:28, height:28, borderRadius:8, background:s.bg,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  flexShrink:0, marginTop:1 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke={s.color} strokeWidth="2" strokeLinecap="round"
                    strokeLinejoin="round">
                    <path d={icon(log.level)}/>
                  </svg>
                </div>

                {/* Body */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", justifyContent:"space-between",
                    alignItems:"flex-start", gap:12, marginBottom:3 }}>
                    <p style={{ fontSize:13, fontWeight:600, color:TX, margin:0,
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      <span style={{ color:AC }}>{log.actor}</span>
                      {" · "}
                      <span style={{ fontFamily:"'DM Mono','Courier New',monospace",
                        fontSize:12, color:TX }}>
                        {log.action}
                      </span>
                    </p>
                    <span style={{ fontSize:11, color:MU, flexShrink:0, whiteSpace:"nowrap" }}>
                      {formatRelativeTime(log.time)}
                    </span>
                  </div>
                  <div style={{ display:"flex", gap:8, alignItems:"center",
                    flexWrap:"wrap" }}>
                    <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px",
                      borderRadius:999, background:s.bg, color:s.color }}>
                      {log.level}
                    </span>
                    {log.resource && (
                      <span style={{ fontSize:11, color:MU,
                        fontFamily:"'DM Mono','Courier New',monospace" }}>
                        {log.resource}
                      </span>
                    )}
                    {log.detail && (
                      <span style={{ fontSize:12, color:"rgba(255,255,255,0.55)" }}>
                        — {log.detail}
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
