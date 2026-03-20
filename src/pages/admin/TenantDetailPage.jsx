import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

import AdminLayout    from "../../layouts/AdminLayout.jsx";
import { Spinner }    from "../../components/ui/Spinner.jsx";
import { Alert }      from "../../components/ui/Alert.jsx";
import Button         from "../../components/ui/Button.jsx";
import { useToast }   from "../../hooks/useNotifications.js";
import { getTenant, approveTenant, suspendTenant, reactivateTenant, updateTenant } from "../../lib/api/tenants.js";
import { getRooms, getBuildings } from "../../lib/api/rooms.js";
import { fetchTenantProfiles }    from "../../lib/api/profile.js";
import { getBillingSummary }      from "../../lib/api/billing.js";
import { formatDate, formatCurrency } from "../../lib/formatters.js";

const SURFACE="#1A1612"; const BORDER="rgba(255,255,255,0.07)";
const MUTED="rgba(255,255,255,0.35)"; const DIM="rgba(255,255,255,0.6)"; const TEXT="rgba(255,255,255,0.88)"; const ACCENT="#C5612C";

function Row({ label, value }) {
  return (
    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${BORDER}` }}>
      <span style={{ fontSize:12,color:MUTED }}>{label}</span>
      <span style={{ fontSize:13,fontWeight:600,color:TEXT }}>{value ?? "—"}</span>
    </div>
  );
}

const STATUS_STYLE = {
  active:    { color:"#10B981", bg:"rgba(16,185,129,0.12)" },
  pending:   { color:"#F59E0B", bg:"rgba(245,158,11,0.12)" },
  suspended: { color:"#EF4444", bg:"rgba(239,68,68,0.12)"  },
};

export default function TenantDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const toast    = useToast();

  const [tenant,   setTenant]   = useState(null);
  const [rooms,    setRooms]    = useState([]);
  const [buildings,setBuildings]= useState([]);
  const [users,    setUsers]    = useState([]);
  const [billing,  setBilling]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [actioning,setActioning]= useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getTenant(id),
      getRooms(id, { limit:200 }),
      getBuildings(id),
      fetchTenantProfiles(id, { limit:200 }),
      // billing summary not available without tenant context, skip here
    ]).then(([{ data:t },{ data:r },{ data:b },{ data:u }]) => {
      setTenant(t);
      setRooms(r ?? []);
      setBuildings(b ?? []);
      setUsers(u ?? []);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleAction = async (action) => {
    setActioning(true);
    const fn = action==="approve" ? approveTenant : action==="suspend" ? suspendTenant : reactivateTenant;
    const { data, error } = await fn(id);
    setActioning(false);
    if (error) { toast.error("Action failed."); return; }
    setTenant(data);
    toast.success(`Tenant ${action}d successfully.`);
  };

  if (loading) return <AdminLayout><div style={{display:"flex",justifyContent:"center",padding:80}}><Spinner size="lg"/></div></AdminLayout>;
  if (!tenant) return <AdminLayout><Alert type="error" message="Tenant not found." /></AdminLayout>;

  const totalRooms   = rooms.length;
  const occupied     = rooms.filter(r=>r.status==="occupied").length;
  const occRate      = totalRooms ? Math.round((occupied/totalRooms)*100) : 0;
  const residents    = users.filter(u=>u.role==="client").length;
  const managers     = users.filter(u=>u.role==="manager").length;
  const ss = STATUS_STYLE[tenant.status] ?? STATUS_STYLE.active;

  return (
    <AdminLayout>
      {/* Breadcrumb */}
      <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:20,fontSize:12,color:MUTED }}>
        <Link to="/admin/tenants" style={{ color:ACCENT,textDecoration:"none",fontWeight:600 }}>Tenants</Link>
        <span>/</span>
        <span style={{ color:TEXT }}>{tenant.name}</span>
      </div>

      {/* Header */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:14,marginBottom:24 }}>
        <div style={{ display:"flex",gap:14,alignItems:"flex-start" }}>
          <div style={{ width:52,height:52,borderRadius:14,background:"rgba(197,97,44,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:700,color:ACCENT,flexShrink:0 }}>
            {tenant.name.charAt(0)}
          </div>
          <div>
            <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:4 }}>
              <h1 style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:24,color:TEXT,margin:0 }}>{tenant.name}</h1>
              <span style={{ fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:999,background:ss.bg,color:ss.color,textTransform:"capitalize" }}>
                {tenant.status}
              </span>
            </div>
            <p style={{ fontSize:12,color:MUTED,margin:0,fontFamily:"'DM Mono','Courier New',monospace" }}>{tenant.slug}</p>
          </div>
        </div>
        <div style={{ display:"flex",gap:8 }}>
          {tenant.status==="pending"   && <Button variant="primary"  loading={actioning} onClick={()=>handleAction("approve")}>Approve Tenant</Button>}
          {tenant.status==="active"    && <Button variant="danger"   loading={actioning} onClick={()=>handleAction("suspend")}>Suspend</Button>}
          {tenant.status==="suspended" && <Button variant="primary"  loading={actioning} onClick={()=>handleAction("reactivate")}>Reactivate</Button>}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:12,marginBottom:24 }}>
        {[
          ["Buildings",  buildings.length,  ACCENT  ],
          ["Rooms",      totalRooms,         "#3B82F6"],
          ["Occupancy",  `${occRate}%`,      occRate>=80?"#10B981":occRate>=60?"#F59E0B":"#EF4444"],
          ["Residents",  residents,          "#10B981"],
          ["Managers",   managers,           "#8B5CF6"],
        ].map(([label,value,color]) => (
          <div key={label} style={{ background:SURFACE,borderRadius:12,border:`1px solid ${BORDER}`,padding:"14px 16px" }}>
            <p style={{ fontSize:11,color:MUTED,margin:"0 0 6px" }}>{label}</p>
            <p style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:24,color,margin:0 }}>{value}</p>
          </div>
        ))}
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20 }}>
        {/* Tenant info */}
        <div style={{ background:SURFACE,borderRadius:16,border:`1px solid ${BORDER}`,padding:"18px 20px" }}>
          <h3 style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:16,color:TEXT,marginBottom:12 }}>Details</h3>
          <Row label="Email"   value={tenant.email} />
          <Row label="Phone"   value={tenant.phone} />
          <Row label="Address" value={tenant.address} />
          <Row label="County"  value={tenant.county} />
          <Row label="Plan"    value={<span style={{ textTransform:"capitalize" }}>{tenant.plan ?? "basic"}</span>} />
          <Row label="Created" value={formatDate(tenant.created_at)} />
        </div>

        {/* Buildings */}
        <div style={{ background:SURFACE,borderRadius:16,border:`1px solid ${BORDER}`,padding:"18px 20px" }}>
          <h3 style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:16,color:TEXT,marginBottom:12 }}>Buildings ({buildings.length})</h3>
          {buildings.length === 0 ? (
            <p style={{ fontSize:12,color:MUTED }}>No buildings registered.</p>
          ) : buildings.map(b => {
            const bRooms    = rooms.filter(r => r.buildings?.id === b.id);
            const bOccupied = bRooms.filter(r => r.status==="occupied").length;
            const pct       = bRooms.length ? Math.round((bOccupied/bRooms.length)*100) : 0;
            return (
              <div key={b.id} style={{ marginBottom:12 }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                  <span style={{ fontSize:13,fontWeight:600,color:TEXT }}>{b.name}</span>
                  <span style={{ fontSize:11,color:MUTED }}>{bOccupied}/{bRooms.length} · {pct}%</span>
                </div>
                <div style={{ height:4,borderRadius:999,background:"rgba(255,255,255,0.07)",overflow:"hidden" }}>
                  <div style={{ height:"100%",width:`${pct}%`,background:pct>=80?"#10B981":pct>=60?"#F59E0B":"#EF4444",borderRadius:999 }}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Users table */}
      <div style={{ background:SURFACE,borderRadius:16,border:`1px solid ${BORDER}`,overflow:"hidden" }}>
        <div style={{ padding:"14px 20px",borderBottom:`1px solid ${BORDER}` }}>
          <h3 style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:16,color:TEXT,margin:0 }}>
            Users ({users.length})
          </h3>
        </div>
        <table style={{ width:"100%",borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${BORDER}` }}>
              {["Name","Email","Role","Joined"].map(h=>(
                <th key={h} style={{ padding:"8px 16px",textAlign:"left",fontSize:10,fontWeight:700,color:MUTED,textTransform:"uppercase",letterSpacing:"0.08em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.slice(0,20).map((u,i) => (
              <tr key={u.id} style={{ borderBottom:i<Math.min(users.length,20)-1?`1px solid ${BORDER}`:"none" }}>
                <td style={{ padding:"10px 16px",fontSize:13,fontWeight:600,color:TEXT }}>{u.full_name}</td>
                <td style={{ padding:"10px 16px",fontSize:12,color:DIM }}>{u.email}</td>
                <td style={{ padding:"10px 16px" }}>
                  <span style={{ fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:999,
                    background:"rgba(197,97,44,0.12)",color:ACCENT,textTransform:"capitalize" }}>{u.role}</span>
                </td>
                <td style={{ padding:"10px 16px",fontSize:11,color:MUTED }}>{formatDate(u.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
