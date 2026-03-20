// =============================================================================
// pages/manager/ResidentsPage.jsx         /manage/residents
// pages/manager/ResidentDetailPage.jsx    /manage/residents/:id
// pages/manager/RentalRequestsPage.jsx    /manage/residents/requests
// pages/manager/TenanciesPage.jsx         /manage/residents/tenancies
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams }            from "react-router-dom";

import DashboardLayout    from "../../layouts/DashboardLayout.jsx";
import PageHeader         from "../../components/layout/PageHeader.jsx";
import DataTable          from "../../components/data/DataTable.jsx";
import { TabBar }         from "../../components/navigation/TabBar.jsx";
import { Pagination }     from "../../components/navigation/TabBar.jsx";
import Badge              from "../../components/ui/Badge.jsx";
import Avatar             from "../../components/ui/Avatar.jsx";
import Button             from "../../components/ui/Button.jsx";
import { Spinner }        from "../../components/ui/Spinner.jsx";
import { Alert }          from "../../components/ui/Alert.jsx";
import { MoveInModal, MoveOutModal } from "../../components/modals/MoveInModal.jsx";

import useAuthStore       from "../../store/authStore.js";
import { getTenancies, getMyTenancy, moveOut } from "../../lib/api/tenancies.js";
import { getRequests, approveRequest, rejectRequest } from "../../lib/api/rentalRequests.js";
import { fetchTenantProfiles } from "../../lib/api/profile.js";
import { getBillingSummary }   from "../../lib/api/billing.js";
import { formatCurrency, formatDate, formatRelativeTime } from "../../lib/formatters.js";
import { useToast }       from "../../hooks/useNotifications.js";
import { ConfirmDialog }  from "../../components/modals/Modal.jsx";

const PAGE_SIZE = 20;

// ─────────────────────────────────────────────────────────────────────────────
// ResidentsPage
// ─────────────────────────────────────────────────────────────────────────────
export function ResidentsPage() {
  const profile  = useAuthStore(s => s.profile);
  const tenantId = profile?.tenant_id;
  const navigate = useNavigate();

  const [residents, setResidents] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [page,      setPage]      = useState(1);
  const [total,     setTotal]     = useState(0);

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    fetchTenantProfiles(tenantId, { role:"client", limit: PAGE_SIZE, offset:(page-1)*PAGE_SIZE })
      .then(({ data, count }) => { setResidents(data ?? []); setTotal(count ?? data?.length ?? 0); })
      .finally(() => setLoading(false));
  }, [tenantId, page]);

  const filtered = search
    ? residents.filter(r => r.full_name?.toLowerCase().includes(search.toLowerCase()) || r.email?.toLowerCase().includes(search.toLowerCase()))
    : residents;

  const columns = [
    { key:"full_name", label:"Resident", sortable:true, render:(v,row) => (
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <Avatar name={v} src={row.avatar_url} size="sm" />
        <div>
          <p style={{ fontSize:13, fontWeight:600, color:"#1A1412", margin:0 }}>{v}</p>
          <p style={{ fontSize:11, color:"#8B7355", margin:0 }}>{row.email}</p>
        </div>
      </div>
    )},
    { key:"phone",    label:"Phone",   render:v => v ?? "—" },
    { key:"role",     label:"Status",  render:()  => <Badge variant="active" size="sm">Resident</Badge> },
    { key:"created_at", label:"Joined", render:v => formatDate(v) },
    { key:"id", label:"", align:"right", render:(_,row) => (
      <Button variant="ghost" onClick={() => navigate(`/manage/residents/${row.id}`)}>View →</Button>
    )},
  ];

  return (
    <DashboardLayout pageTitle="Residents">
      <PageHeader title="Residents" subtitle="All current residents in your property" />
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16 }}>
        <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or email…"
          style={{ padding:"8px 14px", border:"1.5px solid #E8DDD4", borderRadius:999, fontSize:13, outline:"none", width:240 }}
          onFocus={e=>e.target.style.borderColor="#C5612C"} onBlur={e=>e.target.style.borderColor="#E8DDD4"}
        />
      </div>
      <DataTable columns={columns} data={filtered} loading={loading} rowKey="id"
        emptyIcon="users" emptyTitle="No residents" emptyDesc="Residents appear here after move-in."
        onRowClick={row => navigate(`/manage/residents/${row.id}`)} />
      <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
    </DashboardLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ResidentDetailPage
// ─────────────────────────────────────────────────────────────────────────────
export function ResidentDetailPage() {
  const { id }   = useParams();
  const profile  = useAuthStore(s => s.profile);
  const toast    = useToast();
  const navigate = useNavigate();

  const [resident, setResident] = useState(null);
  const [tenancy,  setTenancy]  = useState(null);
  const [summary,  setSummary]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [moveOutOpen, setMoveOutOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetchTenantProfiles(profile?.tenant_id, { userId:id }),
      getMyTenancy(id),
      getBillingSummary(profile?.tenant_id, { clientId:id }),
    ]).then(([{ data: p }, { data: t }, { data: s }]) => {
      setResident(Array.isArray(p) ? p[0] : p);
      setTenancy(t);
      setSummary(s);
    }).finally(() => setLoading(false));
  }, [id, profile?.tenant_id]);

  if (loading) return <DashboardLayout pageTitle="Resident"><div style={{display:"flex",justifyContent:"center",padding:80}}><Spinner size="lg"/></div></DashboardLayout>;
  if (!resident) return <DashboardLayout pageTitle="Resident"><Alert type="error" message="Resident not found." /></DashboardLayout>;

  const room = tenancy?.rooms;

  return (
    <DashboardLayout pageTitle={resident.full_name}>
      <PageHeader title={resident.full_name} back="/manage/residents"
        breadcrumb={[{label:"Residents",to:"/manage/residents"},{label:resident.full_name}]}
        actions={tenancy && <Button variant="danger" onClick={()=>setMoveOutOpen(true)}>Move Out</Button>}
      />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:24 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          {/* Profile card */}
          <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", padding:"24px", display:"flex", gap:20, alignItems:"flex-start" }}>
            <Avatar name={resident.full_name} src={resident.avatar_url} size={72} />
            <div style={{ flex:1 }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:22, color:"#1A1412", margin:"0 0 4px" }}>{resident.full_name}</h2>
              <p style={{ fontSize:14, color:"#8B7355", margin:"0 0 12px" }}>{resident.email}</p>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                <Badge variant="client">Resident</Badge>
                {tenancy && <Badge variant="active">Active Tenancy</Badge>}
              </div>
            </div>
          </div>
          {/* Tenancy details */}
          {tenancy && (
            <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", padding:"20px 24px" }}>
              <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17, color:"#1A1412", marginBottom:14 }}>Tenancy</h3>
              {[
                ["Room",       `Room ${room?.room_number} — ${room?.buildings?.name ?? ""}`],
                ["Move-in",    formatDate(tenancy.move_in_date)],
                ["Rent",       formatCurrency(tenancy.agreed_price) + "/mo"],
                ["Billing",    tenancy.billing_type],
                ["Status",     <Badge key="s" variant={tenancy.status} size="sm"/>],
              ].map(([k,v],i,arr) => (
                <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:i<arr.length-1?"1px solid #F5EDE0":"none" }}>
                  <span style={{ fontSize:13, color:"#8B7355" }}>{k}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:"#1A1412" }}>{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Sidebar */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {summary && (
            <div style={{ background:"#fff", borderRadius:16, border:"1px solid #EDE4D8", padding:"18px 20px" }}>
              <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15, color:"#1A1412", marginBottom:12 }}>Billing Summary</h3>
              {[
                ["Total Paid",    formatCurrency(summary.totalPaid ?? 0)],
                ["Outstanding",  formatCurrency(summary.totalOutstanding ?? 0)],
              ].map(([k,v]) => (
                <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #F5EDE0" }}>
                  <span style={{ fontSize:12, color:"#8B7355" }}>{k}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:"#1A1412" }}>{v}</span>
                </div>
              ))}
            </div>
          )}
          <Button variant="secondary" fullWidth onClick={() => navigate("/manage/residents")}>← Back</Button>
        </div>
      </div>
      <MoveOutModal isOpen={moveOutOpen} onClose={() => setMoveOutOpen(false)} tenancy={tenancy}
        outstanding={summary?.totalOutstanding ?? 0}
        onSuccess={() => { setMoveOutOpen(false); navigate("/manage/residents/tenancies"); }} />
    </DashboardLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RentalRequestsPage
// ─────────────────────────────────────────────────────────────────────────────
export function RentalRequestsPage() {
  const profile  = useAuthStore(s => s.profile);
  const tenantId = profile?.tenant_id;
  const toast    = useToast();

  const [requests,    setRequests]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState("pending");
  const [moveInReq,   setMoveInReq]   = useState(null);
  const [rejectTarget,setRejectTarget]= useState(null);
  const [processing,  setProcessing]  = useState(false);

  const load = useCallback(() => {
    if (!tenantId) return;
    setLoading(true);
    const opts = tab === "all" ? {} : { status: tab };
    getRequests(tenantId, { ...opts, limit:50 })
      .then(({ data }) => setRequests(data ?? []))
      .finally(() => setLoading(false));
  }, [tenantId, tab]);

  useEffect(() => { load(); }, [load]);

  const handleReject = async () => {
    if (!rejectTarget) return;
    setProcessing(true);
    const { error } = await rejectRequest(rejectTarget.id);
    setProcessing(false);
    if (error) { toast.error("Failed to reject."); return; }
    toast.success("Request rejected.");
    setRejectTarget(null);
    load();
  };

  const TABS = [
    { value:"pending",  label:"Pending"  },
    { value:"offered",  label:"Offered"  },
    { value:"accepted", label:"Accepted" },
    { value:"rejected", label:"Rejected" },
    { value:"all",      label:"All"      },
  ];

  const columns = [
    { key:"profiles", label:"Applicant", render:(v,row) => (
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <Avatar name={v?.full_name} src={v?.avatar_url} size="sm"/>
        <div>
          <p style={{ fontSize:13, fontWeight:600, color:"#1A1412", margin:0 }}>{v?.full_name ?? "—"}</p>
          <p style={{ fontSize:11, color:"#8B7355", margin:0 }}>{v?.phone ?? v?.email}</p>
        </div>
      </div>
    )},
    { key:"rooms",   label:"Room", render:(v) => v ? `Room ${v.room_number}` : "—" },
    { key:"preferred_move_in", label:"Move-In", render:v => v ? formatDate(v) : "—" },
    { key:"status",  label:"Status", render:v => <Badge variant={v} size="sm"/> },
    { key:"created_at", label:"Submitted", render:v => formatRelativeTime(v) },
    { key:"id", label:"", align:"right", render:(_,row) => row.status === "pending" ? (
      <div style={{ display:"flex", gap:8 }}>
        <Button size="sm" variant="primary" onClick={e=>{ e.stopPropagation(); setMoveInReq(row); }}>Approve</Button>
        <Button size="sm" variant="danger"  onClick={e=>{ e.stopPropagation(); setRejectTarget(row); }}>Reject</Button>
      </div>
    ) : null },
  ];

  return (
    <DashboardLayout pageTitle="Rental Requests">
      <PageHeader title="Rental Requests" subtitle="Review and approve move-in applications"
        breadcrumb={[{label:"Residents",to:"/manage/residents"},{label:"Rental Requests"}]} />
      <div style={{ marginBottom:16 }}><TabBar tabs={TABS} active={tab} onChange={v=>{setTab(v);}}/></div>
      <DataTable columns={columns} data={requests} loading={loading} rowKey="id"
        emptyIcon="requests" emptyTitle="No requests" emptyDesc="Rental requests will appear here." />

      <MoveInModal isOpen={!!moveInReq} onClose={() => setMoveInReq(null)} request={moveInReq}
        onSuccess={() => { setMoveInReq(null); load(); }} />
      <ConfirmDialog isOpen={!!rejectTarget} title="Reject Request?" variant="danger" loading={processing}
        message={`Decline ${rejectTarget?.profiles?.full_name}'s request for Room ${rejectTarget?.rooms?.room_number}?`}
        confirmLabel="Reject" onConfirm={handleReject} onCancel={() => setRejectTarget(null)} />
    </DashboardLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TenanciesPage
// ─────────────────────────────────────────────────────────────────────────────
export function TenanciesPage() {
  const profile  = useAuthStore(s => s.profile);
  const tenantId = profile?.tenant_id;
  const navigate = useNavigate();

  const [tenancies, setTenancies] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState("active");
  const [page,      setPage]      = useState(1);
  const [total,     setTotal]     = useState(0);

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    const opts = { limit: PAGE_SIZE, offset:(page-1)*PAGE_SIZE };
    if (tab !== "all") opts.status = tab;
    getTenancies(tenantId, opts)
      .then(({ data, count }) => { setTenancies(data ?? []); setTotal(count ?? data?.length ?? 0); })
      .finally(() => setLoading(false));
  }, [tenantId, tab, page]);

  const TABS = [
    { value:"active",    label:"Active"    },
    { value:"completed", label:"Completed" },
    { value:"terminated",label:"Terminated"},
    { value:"all",       label:"All"       },
  ];

  const columns = [
    { key:"profiles", label:"Resident", render:(v,row) => (
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <Avatar name={v?.full_name} src={v?.avatar_url} size="sm"/>
        <span style={{ fontSize:13, fontWeight:600, color:"#1A1412" }}>{v?.full_name ?? "—"}</span>
      </div>
    )},
    { key:"rooms",         label:"Room",      render:v => v ? `Room ${v.room_number} — ${v.buildings?.name ?? ""}` : "—" },
    { key:"move_in_date",  label:"Moved In",  render:v => formatDate(v) },
    { key:"move_out_date", label:"Moved Out", render:v => v ? formatDate(v) : "—" },
    { key:"agreed_price",  label:"Rent",      render:v => formatCurrency(v) },
    { key:"status",        label:"Status",    render:v => <Badge variant={v} size="sm"/> },
    { key:"id", label:"", align:"right", render:(_,row) => (
      <Button variant="ghost" size="sm" onClick={e=>{ e.stopPropagation(); navigate(`/manage/residents/${row.client_id}`); }}>View</Button>
    )},
  ];

  return (
    <DashboardLayout pageTitle="Tenancies">
      <PageHeader title="Tenancies" subtitle="Move-in and move-out history"
        breadcrumb={[{label:"Residents",to:"/manage/residents"},{label:"Tenancies"}]} />
      <div style={{ marginBottom:16 }}><TabBar tabs={TABS} active={tab} onChange={v=>{setTab(v);setPage(1);}}/></div>
      <DataTable columns={columns} data={tenancies} loading={loading} rowKey="id"
        emptyIcon="tenancies" emptyTitle="No tenancies" emptyDesc="Tenancy records appear after move-in." />
      <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
    </DashboardLayout>
  );
}

export default ResidentsPage;
