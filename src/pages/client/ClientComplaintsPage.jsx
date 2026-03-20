import { useState, useEffect, useCallback } from "react";
import { useNavigate }                       from "react-router-dom";

import DashboardLayout   from "../../layouts/DashboardLayout.jsx";
import PageHeader        from "../../components/layout/PageHeader.jsx";
import { TabBar }        from "../../components/navigation/TabBar.jsx";
import { Pagination }    from "../../components/navigation/TabBar.jsx";
import Button            from "../../components/ui/Button.jsx";
import { Spinner }       from "../../components/ui/Spinner.jsx";
import { EmptyState }    from "../../components/ui/Spinner.jsx";
import { ComplaintCard } from "../../components/data/domain-cards.jsx";
import NewComplaintModal from "../../components/modals/NewComplaintModal.jsx";

import useAuthStore      from "../../store/authStore.js";
import { getMyComplaints }    from "../../lib/api/complaints.js";
import { getMyTenancy }       from "../../lib/api/tenancies.js";

// =============================================================================
// ClientComplaintsPage   /dashboard/complaints
// =============================================================================

const PAGE_SIZE = 12;

const TABS = [
  { value:"all",         label:"All"         },
  { value:"open",        label:"Open"        },
  { value:"in_progress", label:"In Progress" },
  { value:"resolved",    label:"Resolved"    },
];

export default function ClientComplaintsPage() {
  const navigate   = useNavigate();
  const profile    = useAuthStore(s => s.profile);

  const [complaints,  setComplaints]  = useState([]);
  const [tenancy,     setTenancy]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState("all");
  const [page,        setPage]        = useState(1);
  const [total,       setTotal]       = useState(0);
  const [newOpen,     setNewOpen]     = useState(false);

  const loadComplaints = useCallback(() => {
    if (!profile?.id) return;
    setLoading(true);
    const opts = { limit: PAGE_SIZE, offset: (page-1)*PAGE_SIZE };
    if (tab !== "all") opts.status = tab;
    Promise.all([
      getMyComplaints(profile.id, opts),
      getMyTenancy(profile.id),
    ]).then(([{ data: c, count }, { data: t }]) => {
      setComplaints(c ?? []);
      setTotal(count ?? c?.length ?? 0);
      setTenancy(t);
    }).finally(() => setLoading(false));
  }, [profile?.id, tab, page]);

  useEffect(() => { loadComplaints(); }, [loadComplaints]);

  // Counts per status for tab badges
  const [counts, setCounts] = useState({});
  useEffect(() => {
    if (!profile?.id) return;
    getMyComplaints(profile.id, { limit: 200 }).then(({ data }) => {
      const c = {};
      (data ?? []).forEach(x => { c[x.status] = (c[x.status] ?? 0) + 1; });
      setCounts(c);
    });
  }, [profile?.id]);

  const tabsWithCounts = TABS.map(t => ({
    ...t,
    count: t.value === "all" ? undefined : counts[t.value] || undefined,
  }));

  if (loading && complaints.length === 0) return (
    <DashboardLayout pageTitle="Complaints">
      <div style={{ display:"flex", justifyContent:"center", padding:80 }}><Spinner size="lg"/></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout pageTitle="Complaints">
      <PageHeader
        title="My Complaints"
        subtitle="Track maintenance requests and property issues"
        actions={
          <Button variant="primary" onClick={() => setNewOpen(true)}>
            + New Complaint
          </Button>
        }
      />

      {/* Status tabs */}
      <div style={{ marginBottom:20 }}>
        <TabBar tabs={tabsWithCounts} active={tab} onChange={v => { setTab(v); setPage(1); }} />
      </div>

      {/* Grid */}
      {complaints.length === 0 ? (
        <EmptyState icon="complaints" title="No complaints yet"
          description="Submit a complaint to report maintenance issues, noise disturbances, or any concerns about your room."
          action={<Button variant="primary" onClick={() => setNewOpen(true)}>Submit a Complaint</Button>}
        />
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:16 }}>
          {complaints.map(c => (
            <ComplaintCard key={c.id} complaint={c}
              onView={() => navigate(`/dashboard/complaints/${c.id}`)}
            />
          ))}
        </div>
      )}

      <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />

      <NewComplaintModal
        isOpen={newOpen}
        onClose={() => setNewOpen(false)}
        tenancyId={tenancy?.id ?? null}
        onSuccess={() => { setNewOpen(false); loadComplaints(); }}
      />
    </DashboardLayout>
  );
}
