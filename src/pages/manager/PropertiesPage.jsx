import { useState, useEffect, useCallback } from "react";

import DashboardLayout    from "../../layouts/DashboardLayout.jsx";
import PageHeader         from "../../components/layout/PageHeader.jsx";
import DataTable          from "../../components/data/DataTable.jsx";
import { TabBar }         from "../../components/navigation/TabBar.jsx";
import Badge              from "../../components/ui/Badge.jsx";
import Button             from "../../components/ui/Button.jsx";
import { Spinner }        from "../../components/ui/Spinner.jsx";
import { ConfirmDialog }  from "../../components/modals/Modal.jsx";
import RoomFormModal      from "../../components/modals/RoomFormModal.jsx";
import { BuildingFormModal } from "../../components/modals/BuildingFormModal.jsx";

import useAuthStore       from "../../store/authStore.js";
import { getBuildings, getRooms, deleteRoom } from "../../lib/api/rooms.js";
import { formatCurrency } from "../../lib/formatters.js";
import { useToast }       from "../../hooks/useNotifications.js";

export default function PropertiesPage() {
  const profile  = useAuthStore(s => s.profile);
  const tenantId = profile?.tenant_id;
  const toast    = useToast();

  const [buildings,     setBuildings]     = useState([]);
  const [rooms,         setRooms]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [tab,           setTab]           = useState("all");
  const [selectedBuilding, setSelectedBuilding] = useState("all");
  const [editRoom,      setEditRoom]      = useState(null);
  const [editBuilding,  setEditBuilding]  = useState(null);
  const [addRoomOpen,   setAddRoomOpen]   = useState(false);
  const [addBuildOpen,  setAddBuildOpen]  = useState(false);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [deleting,      setDeleting]      = useState(false);

  const load = useCallback(() => {
    if (!tenantId) return;
    setLoading(true);
    Promise.all([getBuildings(tenantId), getRooms(tenantId)])
      .then(([{ data: b }, { data: r }]) => { setBuildings(b ?? []); setRooms(r ?? []); })
      .finally(() => setLoading(false));
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  const filtered = rooms.filter(r => {
    if (tab !== "all" && r.status !== tab) return false;
    if (selectedBuilding !== "all" && r.buildings?.id !== selectedBuilding) return false;
    return true;
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await deleteRoom(deleteTarget.id);
    setDeleting(false);
    if (error) { toast.error("Failed to delete room."); return; }
    toast.success(`Room ${deleteTarget.room_number} deleted.`);
    setDeleteTarget(null);
    load();
  };

  const TABS = [
    { value:"all",         label:"All Rooms" },
    { value:"available",   label:"Available" },
    { value:"occupied",    label:"Occupied"  },
    { value:"maintenance", label:"Maintenance"},
  ];

  const buildingOptions = [{ value:"all", label:"All Buildings" }, ...buildings.map(b => ({ value:b.id, label:b.name }))];

  const columns = [
    { key:"room_number", label:"Room", sortable:true, render:(v) => <strong style={{ color:"#1A1412" }}>Room {v}</strong> },
    { key:"room_type",   label:"Type", render:(v) => <span style={{ textTransform:"capitalize" }}>{v?.replace(/_/g," ")}</span> },
    { key:"status",      label:"Status", render:(v) => <Badge variant={v} size="sm" /> },
    { key:"buildings",   label:"Building", render:(v) => v?.name ?? "—" },
    { key:"capacity",    label:"Capacity", align:"center" },
    { key:"monthly_price", label:"Price/mo", align:"right", sortable:true, render:(v) => formatCurrency(v) },
    { key:"id", label:"", align:"right", render:(_, row) => (
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <button onClick={e => { e.stopPropagation(); setEditRoom(row); }}
          style={{ fontSize:12, color:"#C5612C", fontWeight:600, background:"none", border:"none", cursor:"pointer" }}>Edit</button>
        <button onClick={e => { e.stopPropagation(); setDeleteTarget(row); }}
          style={{ fontSize:12, color:"#DC2626", fontWeight:600, background:"none", border:"none", cursor:"pointer" }}>Delete</button>
      </div>
    )},
  ];

  return (
    <DashboardLayout pageTitle="Properties">
      <PageHeader title="Properties" subtitle="Manage buildings and rooms"
        actions={
          <div style={{ display:"flex", gap:8 }}>
            <Button variant="secondary" onClick={() => setAddBuildOpen(true)}>+ Building</Button>
            <Button variant="primary" onClick={() => setAddRoomOpen(true)}>+ Add Room</Button>
          </div>
        }
      />

      {/* Building summary cards */}
      {buildings.length > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:14, marginBottom:24 }}>
          {buildings.map(b => {
            const bRooms    = rooms.filter(r => r.buildings?.id === b.id);
            const occupied  = bRooms.filter(r => r.status === "occupied").length;
            const pct       = bRooms.length ? Math.round((occupied / bRooms.length) * 100) : 0;
            return (
              <div key={b.id} onClick={() => setSelectedBuilding(selectedBuilding === b.id ? "all" : b.id)}
                style={{ background: selectedBuilding === b.id ? "#FFF5EF" : "#fff", border:`1.5px solid ${selectedBuilding === b.id ? "#C5612C" : "#EDE4D8"}`, borderRadius:14, padding:"14px 16px", cursor:"pointer", transition:"all 0.18s" }}>
                <p style={{ fontSize:14, fontWeight:700, color:"#1A1412", margin:"0 0 4px" }}>{b.name}</p>
                <p style={{ fontSize:12, color:"#8B7355", margin:"0 0 10px" }}>{occupied}/{bRooms.length} rooms · {pct}%</p>
                <div style={{ height:5, borderRadius:999, background:"#F5EDE0", overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${pct}%`, background: pct>=80?"#10B981":pct>=60?"#F59E0B":"#EF4444", borderRadius:999 }}/>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:16, flexWrap:"wrap" }}>
        <TabBar tabs={TABS} active={tab} onChange={setTab} />
        <select value={selectedBuilding} onChange={e => setSelectedBuilding(e.target.value)}
          style={{ marginLeft:"auto", padding:"7px 14px", border:"1.5px solid #E8DDD4", borderRadius:10, fontSize:13, color:"#5C4A3A", background:"#fff", outline:"none", cursor:"pointer" }}>
          {buildingOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <DataTable columns={columns} data={filtered} loading={loading}
        emptyTitle="No rooms found" emptyDesc="Add your first room to get started." />

      <RoomFormModal isOpen={addRoomOpen || !!editRoom} onClose={() => { setAddRoomOpen(false); setEditRoom(null); }}
        room={editRoom} buildings={buildings} onSuccess={() => { setAddRoomOpen(false); setEditRoom(null); load(); }} />
      <BuildingFormModal isOpen={addBuildOpen || !!editBuilding} onClose={() => { setAddBuildOpen(false); setEditBuilding(null); }}
        building={editBuilding} onSuccess={() => { setAddBuildOpen(false); setEditBuilding(null); load(); }} />
      <ConfirmDialog isOpen={!!deleteTarget} title="Delete Room?" variant="danger" loading={deleting}
        message={`Remove Room ${deleteTarget?.room_number}? This cannot be undone.`}
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </DashboardLayout>
  );
}
