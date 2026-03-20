import { useState, useEffect, useCallback } from "react";
import { useNavigate }                       from "react-router-dom";

import AdminLayout      from "../../layouts/AdminLayout.jsx";
import { Spinner }      from "../../components/ui/Spinner.jsx";
import { Pagination }   from "../../components/navigation/TabBar.jsx";
import { useToast }     from "../../hooks/useNotifications.js";
import { getTenants, approveTenant, suspendTenant, reactivateTenant } from "../../lib/api/tenants.js";
import { formatDate }   from "../../lib/formatters.js";
import { useDebounce }  from "../../hooks/useDebounce.js";

const BG=  "#0F0D0C"; const SURFACE="#1A1612"; const BORDER="rgba(255,255,255,0.07)";
const MUTED="rgba(255,255,255,0.35)"; const DIM="rgba(255,255,255,0.6)"; const TEXT="rgba(255,255,255,0.88)"; const ACCENT="#C5612C";
const PAGE_SIZE = 25;

const STATUS_STYLE = {
  active:    { bg:"rgba(16,185,129,0.12)",  color:"#10B981", border:"rgba(16,185,129,0.25)" },
  pending:   { bg:"rgba(245,158,11,0.12)",  color:"#F59E0B", border:"rgba(245,158,11,0.25)" },
  suspended: { bg:"rgba(239,68,68,0.12)",   color:"#EF4444", border:"rgba(239,68,68,0.25)"  },
};

function StatusChip({ status }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.active;
  return <span style={{ fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:999,
    background:s.bg, color:s.color, border:`1px solid ${s.border}`, textTransform:"capitalize" }}>{status}</span>;
}

function Btn({ onClick, label, variant = "neutral" }) {
  const c = { approve:["rgba(16,185,129,0.10)","#10B981"], suspend:["rgba(239,68,68,0.10)","#EF4444"],
    reactivate:["rgba(16,185,129,0.10)","#10B981"], neutral:["rgba(255,255,255,0.06)",DIM] }[variant];
  return (
    <button onClick={onClick} style={{ fontSize:11, fontWeight:600, padding:"4px 10px", borderRadius:7,
      background:c[0], color:c[1], border:`1px solid ${c[1]}30`, cursor:"pointer", transition:"all 0.15s" }}
      onMouseOver={e=>e.currentTarget.style.opacity="0.8"} onMouseOut={e=>e.currentTarget.style.opacity="1"}>
      {label}
    </button>
  );
}

export default function AdminTenantsPage() {
  const navigate = useNavigate();
  const toast    = useToast();

  const [tenants,   setTenants]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState("all");
  const [search,    setSearch]    = useState("");
  const [page,      setPage]      = useState(1);
  const [total,     setTotal]     = useState(0);
  const [actioning, setActioning] = useState(null);

  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(() => {
    setLoading(true);
    const opts = { limit: PAGE_SIZE, offset:(page-1)*PAGE_SIZE };
    if (tab !== "all") opts.status = tab;
    if (debouncedSearch) opts.search = debouncedSearch;
    getTenants(opts).then(({ data, count }) => {
      setTenants(data ?? []);
      setTotal(count ?? data?.length ?? 0);
    }).finally(() => setLoading(false));
  }, [tab, page, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (id, action) => {
    setActioning(id);
    const fn = action==="approve" ? approveTenant : action==="suspend" ? suspendTenant : reactivateTenant;
    const { error } = await fn(id);
    setActioning(null);
    if (error) { toast.error("Action failed."); return; }
    toast.success(`Tenant ${action}d.`);
    load();
  };

  const pendingCount = tab==="all" ? tenants.filter(t=>t.status==="pending").length : 0;

  const TABS = ["all","active","pending","suspended"];

  return (
    <AdminLayout>
      <div style={{ marginBottom:20 }}>
        <p style={{ fontSize:10, fontWeight:700, color:ACCENT, textTransform:"uppercase", letterSpacing:"0.1em", margin:"0 0 3px" }}>Management</p>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:24, color:TEXT, margin:0 }}>
          Tenants
        </h1>
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:16, flexWrap:"wrap" }}>
        <div style={{ display:"flex", gap:4, background:SURFACE, borderRadius:10, border:`1px solid ${BORDER}`, padding:4 }}>
          {TABS.map(s => (
            <button key={s} onClick={() => { setTab(s); setPage(1); }}
              style={{ fontSize:11, fontWeight:600, padding:"5px 12px", borderRadius:7, border:"none", cursor:"pointer",
                background: tab===s ? ACCENT : "transparent",
                color:      tab===s ? "#fff" : MUTED, transition:"all 0.15s" }}>
              {s.charAt(0).toUpperCase()+s.slice(1)}
              {s==="pending" && pendingCount>0 && <span style={{ marginLeft:4, background:"#F59E0B", color:"#0F0D0C", fontSize:9, fontWeight:700, padding:"1px 5px", borderRadius:999 }}>{pendingCount}</span>}
            </button>
          ))}
        </div>
        <div style={{ position:"relative", marginLeft:"auto" }}>
          <svg style={{ position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or email…"
            style={{ paddingLeft:30,paddingRight:14,paddingTop:7,paddingBottom:7,background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:9,fontSize:12,color:TEXT,outline:"none",width:220 }}
            onFocus={e=>e.target.style.borderColor=ACCENT} onBlur={e=>e.target.style.borderColor=BORDER}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ background:SURFACE, borderRadius:16, border:`1px solid ${BORDER}`, overflow:"hidden" }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:760 }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${BORDER}` }}>
                {["Tenant","Email / Phone","Status","Plan","County","Joined","Actions"].map(h => (
                  <th key={h} style={{ padding:"9px 16px", textAlign:"left", fontSize:10, fontWeight:700,
                    color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign:"center", padding:48 }}><Spinner size="md"/></td></tr>
              ) : tenants.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign:"center", padding:48, fontSize:13, color:MUTED }}>No tenants found.</td></tr>
              ) : tenants.map((t,i) => (
                <tr key={t.id} style={{ borderBottom: i<tenants.length-1 ? `1px solid ${BORDER}` : "none", cursor:"pointer" }}
                  onMouseOver={e=>e.currentTarget.style.background="rgba(255,255,255,0.02)"}
                  onMouseOut={e=>e.currentTarget.style.background="transparent"}
                >
                  <td style={{ padding:"11px 16px" }}>
                    <div style={{ display:"flex",gap:10,alignItems:"center" }}>
                      <div style={{ width:32,height:32,borderRadius:9,background:"rgba(197,97,44,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:ACCENT,flexShrink:0 }}>{t.name.charAt(0)}</div>
                      <div>
                        <p style={{ fontSize:13,fontWeight:600,color:TEXT,margin:0 }}>{t.name}</p>
                        <p style={{ fontSize:10,color:MUTED,margin:"1px 0 0",fontFamily:"'DM Mono','Courier New',monospace" }}>{t.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:"11px 16px" }}>
                    <p style={{ fontSize:12,color:DIM,margin:0 }}>{t.email ?? "—"}</p>
                    <p style={{ fontSize:11,color:MUTED,margin:"1px 0 0" }}>{t.phone ?? ""}</p>
                  </td>
                  <td style={{ padding:"11px 16px" }}><StatusChip status={t.status}/></td>
                  <td style={{ padding:"11px 16px",fontSize:11,color:MUTED,textTransform:"capitalize" }}>{t.plan ?? "basic"}</td>
                  <td style={{ padding:"11px 16px",fontSize:11,color:MUTED }}>{t.county ?? "—"}</td>
                  <td style={{ padding:"11px 16px",fontSize:11,color:MUTED }}>{formatDate(t.created_at)}</td>
                  <td style={{ padding:"11px 16px" }}>
                    <div style={{ display:"flex",gap:5 }}>
                      <Btn onClick={() => navigate(`/admin/tenants/${t.id}`)} label="View" variant="neutral"/>
                      {t.status==="pending"   && <Btn onClick={()=>handleAction(t.id,"approve")}    label="Approve"    variant="approve"/>}
                      {t.status==="active"    && <Btn onClick={()=>handleAction(t.id,"suspend")}    label="Suspend"    variant="suspend"/>}
                      {t.status==="suspended" && <Btn onClick={()=>handleAction(t.id,"reactivate")} label="Reactivate" variant="reactivate"/>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding:"10px 20px", borderTop:`1px solid ${BORDER}`, display:"flex", justifyContent:"space-between" }}>
          <p style={{ fontSize:11, color:MUTED, margin:0 }}>{total} total tenant{total!==1?"s":""}</p>
        </div>
      </div>
      <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
    </AdminLayout>
  );
}
