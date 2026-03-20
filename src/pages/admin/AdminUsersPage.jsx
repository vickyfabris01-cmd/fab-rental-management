import { useState, useEffect } from "react";

import AdminLayout             from "../../layouts/AdminLayout.jsx";
import { Spinner }             from "../../components/ui/Spinner.jsx";
import { Pagination }          from "../../components/navigation/TabBar.jsx";
import { fetchTenantProfiles } from "../../lib/api/profile.js";
import { formatDate }          from "../../lib/formatters.js";
import { useDebounce }         from "../../hooks/useDebounce.js";

// =============================================================================
// AdminUsersPage  /admin/users
// Cross-platform user list filterable by role.
// =============================================================================

const S2 = "#1A1612"; const B = "rgba(255,255,255,0.07)";
const MU = "rgba(255,255,255,0.35)"; const DIM = "rgba(255,255,255,0.6)";
const TX = "rgba(255,255,255,0.88)"; const AC = "#C5612C";
const PAGE_SIZE = 30;

const ROLE_CLR = {
  client:"#10B981", manager:"#3B82F6", owner:"#8B5CF6",
  worker:"#F59E0B", visitor:MU, super_admin:AC,
};

export default function AdminUsersPage() {
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page,       setPage]       = useState(1);
  const [total,      setTotal]      = useState(0);
  const dq = useDebounce(search, 300);

  useEffect(() => {
    setLoading(true);
    fetchTenantProfiles(null, {
      limit: PAGE_SIZE, offset: (page-1)*PAGE_SIZE,
      role: roleFilter !== "all" ? roleFilter : undefined,
    }).then(({ data, count }) => {
      setUsers(data ?? []);
      setTotal(count ?? data?.length ?? 0);
    }).catch(() => setUsers([])).finally(() => setLoading(false));
  }, [roleFilter, page, dq]);

  return (
    <AdminLayout>
      <div style={{ marginBottom:20 }}>
        <p style={{ fontSize:10,fontWeight:700,color:AC,textTransform:"uppercase",letterSpacing:"0.1em",margin:"0 0 3px" }}>Management</p>
        <h1 style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:24,color:TX,margin:0 }}>All Users</h1>
      </div>

      {/* Role tabs + search */}
      <div style={{ display:"flex",gap:12,alignItems:"center",marginBottom:16,flexWrap:"wrap" }}>
        <div style={{ display:"flex",gap:4,background:S2,borderRadius:10,border:`1px solid ${B}`,padding:4 }}>
          {["all","client","manager","owner","worker","visitor"].map(r => (
            <button key={r} onClick={() => { setRoleFilter(r); setPage(1); }}
              style={{ fontSize:11,fontWeight:600,padding:"5px 12px",borderRadius:7,border:"none",cursor:"pointer",
                background:roleFilter===r?AC:"transparent", color:roleFilter===r?"#fff":MU, transition:"all 0.15s" }}>
              {r==="all"?"All":r.charAt(0).toUpperCase()+r.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ position:"relative",marginLeft:"auto" }}>
          <svg style={{ position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none" }}
            width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={MU} strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…"
            style={{ paddingLeft:30,paddingRight:14,paddingTop:7,paddingBottom:7,background:S2,
              border:`1px solid ${B}`,borderRadius:9,fontSize:12,color:TX,outline:"none",width:220 }}
            onFocus={e=>e.target.style.borderColor=AC} onBlur={e=>e.target.style.borderColor=B}
          />
        </div>
      </div>

      <div style={{ background:S2,borderRadius:16,border:`1px solid ${B}`,overflow:"hidden" }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%",borderCollapse:"collapse",minWidth:580 }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${B}` }}>
                {["Name","Email","Role","Phone","Joined"].map(h=>(
                  <th key={h} style={{ padding:"9px 16px",textAlign:"left",fontSize:10,fontWeight:700,
                    color:MU,textTransform:"uppercase",letterSpacing:"0.08em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign:"center",padding:48 }}><Spinner size="md"/></td></tr>
              ) : users.length===0 ? (
                <tr><td colSpan={5} style={{ textAlign:"center",padding:48,fontSize:13,color:MU }}>No users found.</td></tr>
              ) : users.map((u,i) => (
                <tr key={u.id} style={{ borderBottom:i<users.length-1?`1px solid ${B}`:"none" }}
                  onMouseOver={e=>e.currentTarget.style.background="rgba(255,255,255,0.025)"}
                  onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{ padding:"10px 16px",fontSize:13,fontWeight:600,color:TX }}>{u.full_name??"—"}</td>
                  <td style={{ padding:"10px 16px",fontSize:12,color:DIM }}>{u.email??"—"}</td>
                  <td style={{ padding:"10px 16px" }}>
                    <span style={{ fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:999,
                      background:(ROLE_CLR[u.role]??MU)+"22", color:ROLE_CLR[u.role]??DIM, textTransform:"capitalize" }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding:"10px 16px",fontSize:12,color:MU }}>{u.phone??"—"}</td>
                  <td style={{ padding:"10px 16px",fontSize:11,color:MU }}>{formatDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding:"10px 20px",borderTop:`1px solid ${B}` }}>
          <p style={{ fontSize:11,color:MU,margin:0 }}>{total} user{total!==1?"s":""}</p>
        </div>
      </div>
      <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
    </AdminLayout>
  );
}
