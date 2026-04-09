import { useState, useEffect, useCallback } from "react";
import {  useNavigate, useLocation } from "react-router-dom";

import AdminLayout      from "../../layouts/AdminLayout.jsx";
import { Spinner }      from "../../components/ui/Spinner.jsx";
import { Pagination }   from "../../components/navigation/TabBar.jsx";
import TenantFormModal  from "../../components/modals/TenantFormModal.jsx";
import { useToast }     from "../../hooks/useNotifications.js";
import {
  getTenants,
  approveTenant,
  suspendTenant,
  reactivateTenant,
} from "../../lib/api/tenants.js";
import { formatDate }  from "../../lib/formatters.js";
import { useDebounce } from "../../hooks/useDebounce.js";

// =============================================================================
// AdminTenantsPage  /admin/tenants
//
// Lists all tenant (rental business) accounts on the platform.
// Super admin can:
//   • Create a new tenant (opens TenantFormModal)
//   • Approve / suspend / reactivate tenants inline
//   • Click "View" to open TenantDetailPage for deep management
//
// Manager & Owner assignment happens inside TenantDetailPage.
// =============================================================================

const BG     = "#0F0D0C";
const SURFACE= "#1A1612";
const BORDER = "rgba(255,255,255,0.07)";
const MUTED  = "rgba(255,255,255,0.35)";
const DIM    = "rgba(255,255,255,0.6)";
const TEXT   = "rgba(255,255,255,0.88)";
const ACCENT = "#C5612C";
const PAGE_SIZE = 25;

const STATUS_STYLE = {
  active:    { bg:"rgba(16,185,129,0.12)",  color:"#10B981", border:"rgba(16,185,129,0.25)" },
  pending:   { bg:"rgba(245,158,11,0.12)",  color:"#F59E0B", border:"rgba(245,158,11,0.25)" },
  suspended: { bg:"rgba(239,68,68,0.12)",   color:"#EF4444", border:"rgba(239,68,68,0.25)"  },
};

const PLAN_COLOR = {
  basic:      { color:"#8B7355", bg:"rgba(139,115,85,0.12)" },
  pro:        { color:"#3B82F6", bg:"rgba(59,130,246,0.12)" },
  enterprise: { color:"#C5612C", bg:"rgba(197,97,44,0.12)"  },
};

function StatusChip({ status }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  return (
    <span style={{ fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:999,
      background:s.bg, color:s.color, border:`1px solid ${s.border}`,
      textTransform:"capitalize", whiteSpace:"nowrap" }}>
      {status}
    </span>
  );
}

function PlanChip({ plan }) {
  const p = PLAN_COLOR[plan] ?? PLAN_COLOR.basic;
  return (
    <span style={{ fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:999,
      background:p.bg, color:p.color, textTransform:"capitalize" }}>
      {plan ?? "basic"}
    </span>
  );
}

function ActionBtn({ onClick, label, variant }) {
  const colors = {
    approve:    ["rgba(16,185,129,0.10)",  "#10B981"],
    suspend:    ["rgba(239,68,68,0.10)",   "#EF4444"],
    reactivate: ["rgba(16,185,129,0.10)",  "#10B981"],
    view:       ["rgba(255,255,255,0.06)", DIM],
  }[variant] ?? ["rgba(255,255,255,0.06)", DIM];

  return (
    <button onClick={onClick}
      style={{ fontSize:11, fontWeight:600, padding:"4px 10px", borderRadius:7,
        background:colors[0], color:colors[1],
        border:`1px solid ${colors[1]}30`,
        cursor:"pointer", transition:"opacity 0.15s", whiteSpace:"nowrap" }}
      onMouseOver={e => e.currentTarget.style.opacity="0.75"}
      onMouseOut={e  => e.currentTarget.style.opacity="1"}>
      {label}
    </button>
  );
}

// ── Avatar initials ───────────────────────────────────────────────────────────
function TenantAvatar({ name }) {
  return (
    <div style={{ width:34, height:34, borderRadius:9, flexShrink:0,
      background:"rgba(197,97,44,0.14)", border:"1px solid rgba(197,97,44,0.25)",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:13, fontWeight:800, color:ACCENT }}>
      {name?.charAt(0)?.toUpperCase() ?? "?"}
    </div>
  );
}

// =============================================================================
export default function AdminTenantsPage() {
  const navigate  = useNavigate();
  const toast     = useToast();

  const [tenants,    setTenants]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState("all");
  const [search,     setSearch]     = useState("");
  const [page,       setPage]       = useState(1);
  const [total,      setTotal]      = useState(0);
  const [actioning,  setActioning]  = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(() => {
    setLoading(true);
    const opts = { limit:PAGE_SIZE, offset:(page-1)*PAGE_SIZE };
    if (tab !== "all")    opts.status = tab;
    if (debouncedSearch)  opts.search = debouncedSearch;
    getTenants(opts).then(({ data }) => {
      setTenants(data ?? []);
      setTotal(data?.length ?? 0);
    }).finally(() => setLoading(false));
  }, [tab, page, debouncedSearch]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [tab, debouncedSearch]);

  const handleAction = async (id, action) => {
    setActioning(id);
    const fn = action === "approve"    ? approveTenant
             : action === "suspend"    ? suspendTenant
             :                           reactivateTenant;
    const { error } = await fn(id);
    setActioning(null);
    if (error) { toast.error("Action failed. Please try again."); return; }
    toast.success(`Tenant ${action}d successfully.`);
    load();
  };

  const handleCreated = () => {
    setShowCreate(false);
    load();
    toast.success("Tenant created. You can now approve it and assign an owner.");
  };

  const pendingCount = tenants.filter(t => t.status === "pending").length;
  const TABS = [
    { value:"all",       label:"All" },
    { value:"active",    label:"Active" },
    { value:"pending",   label:"Pending" },
    { value:"suspended", label:"Suspended" },
  ];

  return (
    <AdminLayout>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between",
        alignItems:"flex-start", marginBottom:22, flexWrap:"wrap", gap:12 }}>
        <div>
          <p style={{ fontSize:10, fontWeight:700, color:ACCENT,
            textTransform:"uppercase", letterSpacing:"0.1em", margin:"0 0 3px" }}>
            Platform Management
          </p>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900,
            fontSize:24, color:TEXT, margin:0 }}>
            Tenants
          </h1>
          <p style={{ fontSize:12, color:MUTED, margin:"5px 0 0" }}>
            Rental businesses registered on the platform
          </p>
        </div>
        <button onClick={() => setShowCreate(true)}
          style={{ display:"flex", alignItems:"center", gap:8,
            background:ACCENT, color:"#fff", border:"none", borderRadius:10,
            padding:"10px 18px", fontSize:13, fontWeight:700, cursor:"pointer",
            transition:"background 0.18s" }}
          onMouseOver={e => e.currentTarget.style.background="#A84E22"}
          onMouseOut={e  => e.currentTarget.style.background=ACCENT}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          New Tenant
        </button>
      </div>

      {/* How it works hint */}
      <div style={{ background:"rgba(197,97,44,0.06)", border:`1px solid rgba(197,97,44,0.15)`,
        borderRadius:12, padding:"12px 16px", marginBottom:20,
        display:"flex", alignItems:"flex-start", gap:12 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#C5612C" style={{ flexShrink:0, marginTop:1 }}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
        <p style={{ fontSize:12, color:DIM, margin:0, lineHeight:1.7 }}>
          <strong style={{ color:TEXT }}>How it works:</strong> Create a tenant → Approve it → Click <strong>View</strong> to assign an Owner &amp; Manager, set up buildings and rooms. Managers are then invited via the Manager Settings page.
        </p>
      </div>

      {/* Tabs + Search */}
      <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:16, flexWrap:"wrap" }}>
        <div style={{ display:"flex", gap:4, background:SURFACE,
          borderRadius:10, border:`1px solid ${BORDER}`, padding:4 }}>
          {TABS.map(t => (
            <button key={t.value} onClick={() => setTab(t.value)}
              style={{ fontSize:11, fontWeight:600, padding:"5px 12px", borderRadius:7,
                border:"none", cursor:"pointer",
                background: tab === t.value ? ACCENT : "transparent",
                color:      tab === t.value ? "#fff"  : MUTED,
                transition:"all 0.15s", display:"flex", alignItems:"center", gap:5 }}>
              {t.label}
              {t.value === "pending" && pendingCount > 0 && (
                <span style={{ background:"#F59E0B", color:"#0F0D0C",
                  fontSize:9, fontWeight:800, padding:"1px 5px", borderRadius:999 }}>
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div style={{ position:"relative", marginLeft:"auto" }}>
          <svg style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}
            width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name or email…"
            style={{ paddingLeft:30, paddingRight:14, paddingTop:7, paddingBottom:7,
              background:SURFACE, border:`1px solid ${BORDER}`, borderRadius:9,
              fontSize:12, color:TEXT, outline:"none", width:220, transition:"border-color 0.18s" }}
            onFocus={e => e.target.style.borderColor=ACCENT}
            onBlur={e  => e.target.style.borderColor=BORDER}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ background:SURFACE, borderRadius:16, border:`1px solid ${BORDER}`, overflow:"hidden" }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:780 }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${BORDER}` }}>
                {["Tenant","Contact","Status","Plan","County","Joined","Actions"].map(h => (
                  <th key={h} style={{ padding:"9px 16px", textAlign:"left", fontSize:10,
                    fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.08em",
                    whiteSpace:"nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign:"center", padding:52 }}>
                    <Spinner size="md"/>
                  </td>
                </tr>
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign:"center", padding:52 }}>
                    <p style={{ fontSize:14, color:MUTED, margin:"0 0 6px" }}>
                      {search ? "No tenants match your search." : "No tenants yet."}
                    </p>
                    {!search && (
                      <button onClick={() => setShowCreate(true)}
                        style={{ fontSize:12, color:ACCENT, background:"none",
                          border:`1px solid rgba(197,97,44,0.3)`, borderRadius:8,
                          padding:"6px 14px", cursor:"pointer" }}>
                        + Create your first tenant
                      </button>
                    )}
                  </td>
                </tr>
              ) : tenants.map((t, i) => (
                <tr key={t.id}
                  style={{ borderBottom: i < tenants.length-1 ? `1px solid ${BORDER}` : "none" }}
                  onMouseOver={e => e.currentTarget.style.background="rgba(255,255,255,0.02)"}
                  onMouseOut={e  => e.currentTarget.style.background="transparent"}>

                  {/* Name + slug */}
                  <td style={{ padding:"12px 16px" }}>
                    <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                      <TenantAvatar name={t.name}/>
                      <div>
                        <p style={{ fontSize:13, fontWeight:700, color:TEXT, margin:0 }}>{t.name}</p>
                        <p style={{ fontSize:10, color:MUTED, margin:"2px 0 0",
                          fontFamily:"'DM Mono','Courier New',monospace" }}>
                          /{t.slug}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td style={{ padding:"12px 16px" }}>
                    <p style={{ fontSize:12, color:DIM, margin:0 }}>{t.email ?? "—"}</p>
                    <p style={{ fontSize:11, color:MUTED, margin:"2px 0 0" }}>{t.phone ?? ""}</p>
                  </td>

                  {/* Status */}
                  <td style={{ padding:"12px 16px" }}>
                    <StatusChip status={t.status}/>
                  </td>

                  {/* Plan */}
                  <td style={{ padding:"12px 16px" }}>
                    <PlanChip plan={t.plan}/>
                  </td>

                  {/* County */}
                  <td style={{ padding:"12px 16px", fontSize:11, color:MUTED }}>
                    {t.county ?? "—"}
                  </td>

                  {/* Joined */}
                  <td style={{ padding:"12px 16px", fontSize:11, color:MUTED, whiteSpace:"nowrap" }}>
                    {formatDate(t.created_at)}
                  </td>

                  {/* Actions */}
                  <td style={{ padding:"12px 16px" }}>
                    <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                      <ActionBtn onClick={() => navigate(`/admin/tenants/${t.id}`)} label="View" variant="view"/>
                      {actioning === t.id
                        ? <div style={{ width:16, height:16, border:"2px solid rgba(255,255,255,0.2)",
                            borderTopColor:ACCENT, borderRadius:"50%",
                            animation:"spin 0.7s linear infinite", margin:"auto 4px" }}/>
                        : <>
                            {t.status === "pending"   && <ActionBtn onClick={() => handleAction(t.id,"approve")}    label="Approve"    variant="approve"/>}
                            {t.status === "active"    && <ActionBtn onClick={() => handleAction(t.id,"suspend")}    label="Suspend"    variant="suspend"/>}
                            {t.status === "suspended" && <ActionBtn onClick={() => handleAction(t.id,"reactivate")} label="Reactivate" variant="reactivate"/>}
                          </>
                      }
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding:"10px 20px", borderTop:`1px solid ${BORDER}`,
          display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <p style={{ fontSize:11, color:MUTED, margin:0 }}>
            {total} tenant{total !== 1 ? "s" : ""} total
          </p>
          <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage}/>
        </div>
      </div>

      {/* Create tenant modal */}
      <TenantFormModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleCreated}
      />
    </AdminLayout>
  );
}
