import { useState, useEffect } from "react";
import { Modal }         from "./Modal.jsx";
import Button            from "../ui/Button.jsx";
import Input             from "../ui/Input.jsx";
import { Alert }         from "../ui/Alert.jsx";
import { RoomCard }      from "../data/domain-cards.jsx";
import { Spinner }       from "../ui/Spinner.jsx";
import { formatCurrency, formatDate } from "../../lib/formatters.js";
import { requestTransfer, approveTransfer } from "../../lib/api/tenancies.js";
import { getRooms }      from "../../lib/api/rooms.js";
import useAuthStore      from "../../store/authStore.js";
import { useToast }      from "../../hooks/useNotifications.js";

// =============================================================================
// TransferRequestModal
//
// Client submits a request to move to a different room within the same property.
//
// Props:
//   isOpen    — boolean
//   onClose   — fn
//   tenancy   — active tenancy row (with rooms join)
//   onSuccess — fn(transfer)
// =============================================================================
export function TransferRequestModal({ isOpen, onClose, tenancy, onSuccess }) {
  const profile      = useAuthStore(s => s.profile);
  const toast        = useToast();

  const [rooms,      setRooms]      = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [transferDate, setTransferDate] = useState("");
  const [reason,       setReason]       = useState("");
  const [loading,      setLoading]      = useState(false);
  const [errors,       setErrors]       = useState({});

  const today = new Date().toISOString().slice(0, 10);

  // Load available rooms in same tenant (excluding current room)
  useEffect(() => {
    if (!isOpen || !tenancy) return;
    setLoadingRooms(true);
    getRooms(profile.tenant_id, { status: "available" })
      .then(({ data }) => setRooms((data ?? []).filter(r => r.id !== tenancy.room_id)))
      .finally(() => setLoadingRooms(false));
  }, [isOpen, tenancy, profile?.tenant_id]);

  if (!tenancy) return null;

  const currentRoom = tenancy.rooms;

  const validate = () => {
    const e = {};
    if (!selectedRoom)              e.room       = "Select a room to transfer to";
    if (!transferDate)              e.date       = "Preferred transfer date is required";
    if (transferDate < today)       e.date       = "Transfer date must be today or later";
    if (!reason.trim())             e.reason     = "Please provide a reason for the transfer";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      const { data, error } = await requestTransfer({
        tenantId:     profile.tenant_id,
        tenancyId:    tenancy.id,
        fromRoomId:   tenancy.room_id,
        toRoomId:     selectedRoom.id,
        transferDate,
        reason:       reason.trim(),
      });
      if (error) throw new Error(error.message);
      toast.success("Transfer request submitted. The manager will review it shortly.");
      onSuccess?.(data);
      onClose();
    } catch (err) {
      toast.error(err.message ?? "Failed to submit transfer request.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => { setSelectedRoom(null); setReason(""); setErrors({}); onClose(); };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Request Room Transfer" size="md"
      footer={<>
        <Button variant="secondary" onClick={handleClose}>Cancel</Button>
        <Button variant="primary" loading={loading} onClick={handleSubmit}>Submit Request</Button>
      </>}>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Current room */}
        <div style={{ background: "#FAF7F2", border: "1px solid #EDE4D8", borderRadius: 12, padding: "12px 16px" }}>
          <p style={{ fontSize: 12, color: "#8B7355", margin: "0 0 4px" }}>Moving from</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#1A1412", margin: 0 }}>
            Room {currentRoom?.room_number ?? "—"}
            <span style={{ fontSize: 12, fontWeight: 400, color: "#8B7355", marginLeft: 8 }}>
              {formatCurrency(tenancy.agreed_price)}/mo
            </span>
          </p>
        </div>

        {/* Available rooms grid */}
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#1A1412", marginBottom: 10 }}>
            Select New Room {errors.room && <span style={{ color: "#EF4444", fontWeight: 400, fontSize: 12 }}>— {errors.room}</span>}
          </p>
          {loadingRooms ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 24 }}><Spinner size="md" /></div>
          ) : rooms.length === 0 ? (
            <p style={{ fontSize: 13, color: "#8B7355", textAlign: "center", padding: "16px 0" }}>No available rooms at this time.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
              {rooms.map(r => (
                <RoomCard key={r.id} room={r}
                  selected={selectedRoom?.id === r.id}
                  onSelect={(room) => { setSelectedRoom(room); setErrors(p => ({ ...p, room: null })); }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Transfer date */}
        <Input label="Preferred Transfer Date" type="date" required
          min={today} value={transferDate}
          onChange={e => { setTransferDate(e.target.value); setErrors(p => ({ ...p, date: null })); }}
          error={errors.date}
        />

        {/* Reason */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#1A1412" }}>Reason for Transfer <span style={{ color: "#EF4444" }}>*</span></label>
          <textarea value={reason} onChange={e => { setReason(e.target.value); setErrors(p => ({ ...p, reason: null })); }}
            placeholder="e.g. Need a quieter room, current room has maintenance issues"
            rows={3}
            style={{ width: "100%", padding: "10px 14px", border: `1.5px solid ${errors.reason ? "#EF4444" : "#E8DDD4"}`, borderRadius: 12, fontSize: 14, fontFamily: "'DM Sans', system-ui", outline: "none", resize: "vertical", lineHeight: 1.6 }}
            onFocus={e => e.target.style.borderColor = errors.reason ? "#EF4444" : "#C5612C"}
            onBlur={e  => e.target.style.borderColor = errors.reason ? "#EF4444" : "#E8DDD4"}
          />
          {errors.reason && <span style={{ fontSize: 12, color: "#EF4444" }}>{errors.reason}</span>}
        </div>
      </div>
    </Modal>
  );
}

// =============================================================================
// ApproveTransferModal
//
// Manager reviews and approves a room transfer request.
//
// Props:
//   isOpen    — boolean
//   onClose   — fn
//   transfer  — room_transfer row (with from_room, to_room, tenancy, profiles joins)
//   onSuccess — fn(updatedTenancy)
// =============================================================================
export function ApproveTransferModal({ isOpen, onClose, transfer, onSuccess }) {
  const profile  = useAuthStore(s => s.profile);
  const toast    = useToast();
  const [loading, setLoading] = useState(false);

  if (!transfer) return null;

  const clientName = transfer.tenancy?.profiles?.full_name ?? "Resident";
  const fromRoom   = transfer.from_room;
  const toRoom     = transfer.to_room;

  const handleApprove = async () => {
    setLoading(true);
    try {
      const { data, error } = await approveTransfer(transfer.id, profile.id);
      if (error) throw new Error(error.message);
      toast.success(`${clientName} transferred to Room ${toRoom?.room_number}.`);
      onSuccess?.(data);
      onClose();
    } catch (err) {
      toast.error(err.message ?? "Failed to approve transfer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Approve Room Transfer" size="sm"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" loading={loading} onClick={handleApprove}>Approve Transfer</Button>
      </>}>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <p style={{ fontSize: 14, color: "#5C4A3A", margin: 0 }}>
          Confirm the following room transfer for <strong>{clientName}</strong>:
        </p>

        {/* From → To */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 12 }}>
          <div style={{ background: "#FAF7F2", border: "1px solid #EDE4D8", borderRadius: 12, padding: "12px 14px", textAlign: "center" }}>
            <p style={{ fontSize: 11, color: "#8B7355", margin: "0 0 4px" }}>From</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#1A1412", margin: 0 }}>Room {fromRoom?.room_number ?? "—"}</p>
            <p style={{ fontSize: 11, color: "#8B7355", margin: "2px 0 0" }}>{fromRoom?.buildings?.name ?? ""}</p>
          </div>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C5612C" strokeWidth="2" strokeLinecap="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
          <div style={{ background: "#FFF5EF", border: "1.5px solid rgba(197,97,44,0.3)", borderRadius: 12, padding: "12px 14px", textAlign: "center" }}>
            <p style={{ fontSize: 11, color: "#8B7355", margin: "0 0 4px" }}>To</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#C5612C", margin: 0 }}>Room {toRoom?.room_number ?? "—"}</p>
            <p style={{ fontSize: 11, color: "#8B7355", margin: "2px 0 0" }}>{toRoom?.buildings?.name ?? ""}</p>
          </div>
        </div>

        {/* Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: "#8B7355" }}>Transfer Date</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1412" }}>{formatDate(transfer.transfer_date)}</span>
          </div>
          {transfer.reason && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 13, color: "#8B7355" }}>Reason</span>
              <p style={{ fontSize: 13, color: "#5C4A3A", margin: 0, lineHeight: 1.5, background: "#FAF7F2", borderRadius: 8, padding: "8px 12px" }}>{transfer.reason}</p>
            </div>
          )}
        </div>

        <Alert type="info" compact message="Approving this transfer will update the tenancy record and mark the old room as available." />
      </div>
    </Modal>
  );
}

export default TransferRequestModal;
