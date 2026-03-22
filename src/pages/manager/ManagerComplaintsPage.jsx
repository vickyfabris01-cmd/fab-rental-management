import { useState, useEffect, useCallback } from "react";
import { useNavigate }                       from "react-router-dom";

import DashboardLayout    from "../../layouts/DashboardLayout.jsx";
import PageHeader         from "../../components/layout/PageHeader.jsx";
import { TabBar }         from "../../components/navigation/TabBar.jsx";
import { Pagination }     from "../../components/navigation/TabBar.jsx";
import Badge              from "../../components/ui/Badge.jsx";
import Avatar             from "../../components/ui/Avatar.jsx";
import Button             from "../../components/ui/Button.jsx";
import { Spinner }        from "../../components/ui/Spinner.jsx";
import { EmptyState }     from "../../components/ui/Spinner.jsx";
import StatsCard          from "../../components/data/StatsCard.jsx";

import useAuthStore       from "../../store/authStore.js";
import { getComplaints, updateComplaintStatus } from "../../lib/api/complaints.js";
import { formatRelativeTime, formatDate }        from "../../lib/formatters.js";
import { useToast }       from "../../hooks/useNotifications.js";
import { useDebounce }    from "../../hooks/useDebounce.js";

// =============================================================================
// ManagerComplaintsPage  /manage/complaints
// =============================================================================

const PAGE_SIZE = 20;
const PRIORITY_META = {
  low:    { label:"Low",    color:"#8B7355", bg:"#F5EDE0" },
  normal: { label:"Normal", color:"#3B82F6", bg:"#EFF6FF" },
  high:   { label:"High",   color:"#D97706", bg:"#FFFBEB" },
  urgent: { label:"Urgent", color:"#DC2626", bg:"#FEF2F2" },
};

const STATUS_NEXT = { open:"in_progress", in_progress:"resolved", resolved:"closed" };
const STATUS_ACTION = { open:"Start Work", in_progress:"Mark Resolved", resolved:"Close" };

function ComplaintRow({ complaint, onStatusChange }) {
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();
  const pm = PRIORITY_META[complaint.priority] ?? PRIORITY_META.normal;
  const next = STATUS_NEXT[complaint.status];

  const handleAdvance = async (e) => {
    e.stopPropagation();
    if (!next || updating) return;
    setUpdating(true);
    await onStatusChange(complaint.id, next);
    setUpdating(false);
  };

  return (
    <div onClick={() => navigate(`/manage/complaints/${complaint.id}`)}
      style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"14px 20px", borderBottom:"1px solid #F5EDE0", cursor:"pointer" }}
      onMouseOver={e => e.currentTarget.style.background = "#FFFAF6"}
      onMouseOut={e  => e.currentTarget.style.background = "transparent"}
    >
      {/* Priority dot */}
      <div style={{ width:8, height:8, borderRadius:"50%", background:pm.color, flexShrink:0, marginTop:5 }}/>
      <Avatar name={complaint.submitter?.full_name} src={complaint.submitter?.avatar_url} size="sm" />
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:13, fontWeight:600, color:"#1A1412", margin:"0 0 3px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {complaint.title}
        </p>
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          <span style={{ fontSize:11, color:"#8B7355" }}>{complaint.submitter?.full_name ?? "—"}</span>
          <span style={{ fontSize:11, color:"#8B7355" }}>·</span>
          <span style={{ fontSize:11, color:"#8B7355", textTransform:"capitalize" }}>{complaint.category}</span>
          <span style={{ fontSize:11, color:"#8B7355" }}>·</span>
          <span style={{ fontSize:11, color:"#8B7355" }}>{formatRelativeTime(complaint.created_at)}</span>
        </div>
      </div>
      <div style={{ display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
        <span style={{ fontSize:11, fontWeight:600, padding:"3px 9px", borderRadius:999, background:pm.bg, color:pm.color }}>
          {pm.label}
        </span>
        <Badge variant={complaint.status} size="sm" />
        {next && (
          <button onClick={handleAdvance} disabled={updating}
            style={{ fontSize:11, fontWeight:700, color:"#C5612C", background:"rgba(197,97,44,0.08)", border:"1px solid rgba(197,97,44,0.25)", borderRadius:999, padding:"4px 10px", cursor:"pointer", transition:"all 0.15s", whiteSpace:"nowrap" }}
            onMouseOver={e => { e.currentTarget.style.background="#C5612C"; e.currentTarget.style.color="#fff"; }}
            onMouseOut={e  => { e.currentTarget.style.background="rgba(197,97,44,0.08)"; e.currentTarget.style.color="#C5612C"; }}
          >
            {STATUS_ACTION[complaint.status]}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ManagerComplaintsPage() {
  const profile  = useAuthStore(s => s.profile);
  const tenantId = profile?.tenant_id;
  const toast    = useToast();

  const [complaints, setComplaints] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState("open");
  const [priority,   setPriority]   = useState("all");
  const [search,     setSearch]     = useState("");
  const [page,       setPage]       = useState(1);
  const [total,      setTotal]      = useState(0);
  const [counts,     setCounts]     = useState({});

  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(() => {
    if (!tenantId) return;
    setLoading(true);
    const opts = { limit: PAGE_SIZE, offset:(page-1)*PAGE_SIZE };
    if (tab !== "all") opts.status = tab;
    if (priority !== "all") opts.priority = priority;
    Promise.all([
      getComplaints(tenantId, opts),
      getComplaints(tenantId, { limit:200 }), // for counts
    ]).then(([{ data: c, count }, { data: all }]) => {
      setComplaints(c ?? []);
      setTotal(count ?? c?.length ?? 0);
      const ct = {};
      (all ?? []).forEach(x => { ct[x.status] = (ct[x.status] ?? 0) + 1; });
      setCounts(ct);
    }).finally(() => setLoading(false));
  }, [tenantId, tab, page, priority]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id, newStatus) => {
    const { error } = await updateComplaintStatus(id, newStatus);
    if (error) { toast.error("Failed to update status."); return; }
    toast.success("Status updated.");
    load();
  };

  const filtered = debouncedSearch
    ? complaints.filter(c => c.title.toLowerCase().includes(debouncedSearch.toLowerCase()) || c.submitter?.full_name?.toLowerCase().includes(debouncedSearch.toLowerCase()))
    : complaints;

  const TABS = [
    { value:"open",        label:"Open",        count: counts.open        || undefined },
    { value:"in_progress", label:"In Progress",  count: counts.in_progress || undefined },
    { value:"resolved",    label:"Resolved"                                             },
    { value:"closed",      label:"Closed"                                               },
    { value:"all",         label:"All"                                                  },
  ];

  return (
    <DashboardLayout pageTitle="Complaints">
      <PageHeader title="Complaints" subtitle="Manage and resolve resident complaints" />

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:14, marginBottom:24 }}>
        {[
          ["Open",        counts.open || 0,        "error"  ],
          ["In Progress", counts.in_progress || 0, "warning"],
          ["Resolved",    counts.resolved || 0,    "success"],
          ["Closed",      counts.closed || 0,      "neutral"],
        ].map(([label,val,color]) => (
          <StatsCard key={label} label={label} value={val} color={val > 0 && color !== "neutral" ? color : "neutral"}
            icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>} />
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:16, flexWrap:"wrap" }}>
        <TabBar tabs={TABS} active={tab} onChange={v => { setTab(v); setPage(1); }} />
        <select value={priority} onChange={e => setPriority(e.target.value)}
          style={{ padding:"7px 14px", border:"1.5px solid #E8DDD4", borderRadius:10, fontSize:13, color:"#5C4A3A", background:"#fff", outline:"none" }}>
          <option value="all">All Priority</option>
          {Object.keys(PRIORITY_META).map(k => <option key={k} value={k}>{PRIORITY_META[k].label}</option>)}
        </select>
        <div style={{ position:"relative", marginLeft:"auto" }}>
          <svg style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9B8A79" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search complaints…"
            style={{ paddingLeft:30, paddingRight:14, paddingTop:8, paddingBottom:8, border:"1.5px solid #E8DDD4", borderRadius:999, fontSize:13, color:"#1A1412", background:"#fff", outline:"none", width:200 }}
            onFocus={e => e.target.style.borderColor="#C5612C"}
            onBlur={e  => e.target.style.borderColor="#E8DDD4"}
          />
        </div>
      </div>

      <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", overflow:"hidden" }}>
        {loading ? (
          <div style={{ display:"flex", justifyContent:"center", padding:48 }}><Spinner size="md"/></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="complaints" title="No complaints" description="All complaints matching the current filter will appear here." />
        ) : (
          filtered.map(c => <ComplaintRow key={c.id} complaint={c} onStatusChange={handleStatusChange} />)
        )}
      </div>

      <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
    </DashboardLayout>
  );
}
