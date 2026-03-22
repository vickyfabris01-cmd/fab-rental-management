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

// =============================================================================
// PropertiesPage  /manage/properties
//
// Building cards at top — click to filter.
// Each building card has its own "+ Add Room" button that pre-selects
// that building in the modal so rooms are always bound to a block.
// =============================================================================

export default function PropertiesPage() {
  const profile  = useAuthStore(s => s.profile);
  const tenantId = profile?.tenant_id;
  const toast    = useToast();

  const [buildings,        setBuildings]        = useState([]);
  const [rooms,            setRooms]            = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [tab,              setTab]              = useState("all");
  const [selectedBuilding, setSelectedBuilding] = useState("all");

  // Modal state — roomModalBuildingId tracks which building to pre-select
  const [editRoom,          setEditRoom]         = useState(null);
  const [editBuilding,      setEditBuilding]     = useState(null);
  const [addRoomOpen,       setAddRoomOpen]      = useState(false);
  const [roomModalBuildingId, setRoomModalBuildingId] = useState(null);
  const [addBuildOpen,      setAddBuildOpen]     = useState(false);
  const [deleteTarget,      setDeleteTarget]     = useState(null);
  const [deleting,          setDeleting]         = useState(false);

  const load = useCallback(() => {
    if (!tenantId) return;
    setLoading(true);
    Promise.all([getBuildings(tenantId), getRooms(tenantId)])
      .then(([{ data: b }, { data: r }]) => {
        setBuildings(b ?? []);
        setRooms(r ?? []);
      })
      .finally(() => setLoading(false));
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  // Open add-room modal, optionally pre-selecting a building
  const openAddRoom = (buildingId = null) => {
    setEditRoom(null);
    setRoomModalBuildingId(buildingId);
    setAddRoomOpen(true);
  };

  const closeRoomModal = () => {
    setAddRoomOpen(false);
    setEditRoom(null);
    setRoomModalBuildingId(null);
  };

  const filtered = rooms.filter(r => {
    if (tab !== "all" && r.status !== tab) return false;
    if (selectedBuilding !== "all" && r.building_id !== selectedBuilding) return false;
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
    { value:"all",         label:"All Rooms"   },
    { value:"available",   label:"Available"   },
    { value:"occupied",    label:"Occupied"    },
    { value:"maintenance", label:"Maintenance" },
  ];

  const buildingOptions = [
    { value:"all", label:"All Buildings" },
    ...buildings.map(b => ({ value:b.id, label:b.name })),
  ];

  const columns = [
    { key:"room_number",   label:"Room",     sortable:true,
      render:(v) => <strong style={{ color:"#1A1412" }}>Room {v}</strong> },
    { key:"room_type",     label:"Type",
      render:(v) => <span style={{ textTransform:"capitalize" }}>{v?.replace(/_/g," ")}</span> },
    { key:"status",        label:"Status",   render:(v) => <Badge variant={v} size="sm" /> },
    { key:"building_id",   label:"Building",
      render:(_, row) => (
        <span style={{ fontSize:12, fontWeight:600,
          background:"rgba(197,97,44,0.10)", color:"#C5612C",
          padding:"3px 8px", borderRadius:999 }}>
          {buildings.find(b => b.id === row.building_id)?.name ?? "—"}
        </span>
      )},
    { key:"capacity",      label:"Capacity", align:"center" },
    { key:"monthly_price", label:"Price/mo", align:"right",  sortable:true,
      render:(v) => formatCurrency(v) },
    { key:"id", label:"", align:"right",
      render:(_, row) => (
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
          <button onClick={e => { e.stopPropagation(); setEditRoom(row); setAddRoomOpen(true); }}
            style={{ fontSize:12, color:"#C5612C", fontWeight:600, background:"none", border:"none", cursor:"pointer" }}>
            Edit
          </button>
          <button onClick={e => { e.stopPropagation(); setDeleteTarget(row); }}
            style={{ fontSize:12, color:"#DC2626", fontWeight:600, background:"none", border:"none", cursor:"pointer" }}>
            Delete
          </button>
        </div>
      )},
  ];

  return (
    <DashboardLayout pageTitle="Properties">
      <PageHeader
        title="Properties"
        subtitle="Manage your buildings and rooms"
        actions={
          <div style={{ display:"flex", gap:8 }}>
            <Button variant="secondary" onClick={() => setAddBuildOpen(true)}>
              + Building
            </Button>
            <Button
              variant="primary"
              onClick={() => openAddRoom(
                // pre-select the currently filtered building if one is selected
                selectedBuilding !== "all" ? selectedBuilding : null
              )}
            >
              + Add Room
            </Button>
          </div>
        }
      />

      {/* No buildings prompt */}
      {!loading && buildings.length === 0 && (
        <div style={{ background:"#FFF5EF", border:"1px solid rgba(197,97,44,0.25)",
          borderRadius:14, padding:"20px 24px", marginBottom:24,
          display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ width:44, height:44, borderRadius:12,
            background:"rgba(197,97,44,0.12)", display:"flex",
            alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>
            🏢
          </div>
          <div>
            <p style={{ fontSize:14, fontWeight:700, color:"#C5612C", margin:"0 0 3px" }}>
              No buildings yet
            </p>
            <p style={{ fontSize:13, color:"#5C4A3A", margin:0 }}>
              Create a building or block first — every room must belong to one.
            </p>
          </div>
          <Button variant="primary" onClick={() => setAddBuildOpen(true)} style={{ marginLeft:"auto", flexShrink:0 }}>
            + Add Building
          </Button>
        </div>
      )}

      {/* Building cards — each has its own "+ Add Room" button */}
      {buildings.length > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",
          gap:14, marginBottom:24 }}>
          {buildings.map(b => {
            const bRooms   = rooms.filter(r => r.building_id === b.id);
            const occupied = bRooms.filter(r => r.status === "occupied").length;
            const pct      = bRooms.length ? Math.round((occupied / bRooms.length) * 100) : 0;
            const isActive = selectedBuilding === b.id;
            return (
              <div key={b.id} style={{
                background: isActive ? "#FFF5EF" : "#fff",
                border:`1.5px solid ${isActive ? "#C5612C" : "#EDE4D8"}`,
                borderRadius:14, padding:"14px 16px",
                transition:"all 0.18s",
                display:"flex", flexDirection:"column", gap:10,
              }}>
                {/* Header row */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                  <div onClick={() => setSelectedBuilding(isActive ? "all" : b.id)}
                    style={{ cursor:"pointer", flex:1 }}>
                    <p style={{ fontSize:14, fontWeight:700, color:"#1A1412", margin:"0 0 2px" }}>{b.name}</p>
                    <p style={{ fontSize:12, color:"#8B7355", margin:0 }}>
                      {occupied}/{bRooms.length} rooms occupied · {pct}%
                    </p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); openAddRoom(b.id); }}
                    title={`Add room to ${b.name}`}
                    style={{ flexShrink:0, padding:"5px 10px",
                      background:"#C5612C", color:"#fff", border:"none",
                      borderRadius:8, fontSize:12, fontWeight:700,
                      cursor:"pointer", whiteSpace:"nowrap",
                      transition:"background 0.15s" }}
                    onMouseOver={e => e.currentTarget.style.background="#A84E22"}
                    onMouseOut={e  => e.currentTarget.style.background="#C5612C"}
                  >
                    + Room
                  </button>
                </div>

                {/* Occupancy bar */}
                <div style={{ height:5, borderRadius:999, background:"#F5EDE0", overflow:"hidden" }}>
                  <div style={{
                    height:"100%", width:`${pct}%`, borderRadius:999,
                    background: pct>=80?"#10B981":pct>=60?"#F59E0B":"#C5612C",
                    transition:"width 0.4s ease",
                  }}/>
                </div>

                {/* Edit building link */}
                <button
                  onClick={() => { setEditBuilding(b); setAddBuildOpen(true); }}
                  style={{ fontSize:11, color:"#8B7355", background:"none",
                    border:"none", cursor:"pointer", padding:0, textAlign:"left",
                    textDecoration:"underline" }}>
                  Edit building details
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div style={{ display:"flex", gap:12, alignItems:"center",
        marginBottom:16, flexWrap:"wrap" }}>
        <TabBar tabs={TABS} active={tab} onChange={setTab} />
        <select
          value={selectedBuilding}
          onChange={e => setSelectedBuilding(e.target.value)}
          style={{ marginLeft:"auto", padding:"7px 14px",
            border:"1.5px solid #E8DDD4", borderRadius:10,
            fontSize:13, color:"#5C4A3A", background:"#fff",
            outline:"none", cursor:"pointer" }}
        >
          {buildingOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        emptyTitle="No rooms found"
        emptyDesc={
          buildings.length === 0
            ? "Add a building first, then add rooms to it."
            : "Add your first room using the + Add Room button or the + Room button on a building card."
        }
      />

      {/* Modals */}
      <RoomFormModal
        isOpen={addRoomOpen || !!editRoom}
        onClose={closeRoomModal}
        room={editRoom}
        buildings={buildings}
        buildingId={editRoom ? editRoom.building_id : roomModalBuildingId}
        onSuccess={() => { closeRoomModal(); load(); }}
      />
      <BuildingFormModal
        isOpen={addBuildOpen || !!editBuilding}
        onClose={() => { setAddBuildOpen(false); setEditBuilding(null); }}
        building={editBuilding}
        onSuccess={() => { setAddBuildOpen(false); setEditBuilding(null); load(); }}
      />
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Room?"
        variant="danger"
        loading={deleting}
        message={`Remove Room ${deleteTarget?.room_number} from ${buildings.find(b=>b.id===deleteTarget?.building_id)?.name ?? "this building"}? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardLayout>
  );
}
