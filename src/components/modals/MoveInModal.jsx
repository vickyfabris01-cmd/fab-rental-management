import { useState }     from "react";
import { Modal }         from "./Modal.jsx";
import Button            from "../ui/Button.jsx";
import Input             from "../ui/Input.jsx";
import SelectInput       from "../ui/SelectInput.jsx";
import { Alert }         from "../ui/Alert.jsx";
import { formatCurrency, formatDate } from "../../lib/formatters.js";
import { createTenancy } from "../../lib/api/tenancies.js";
import { moveOut }       from "../../lib/api/tenancies.js";
import useAuthStore      from "../../store/authStore.js";
import { useToast }      from "../../hooks/useNotifications.js";

// =============================================================================
// MoveInModal
//
// Manager confirms move-in for an approved rental request.
// Creates the tenancy row which triggers billing cycle generation.
//
// Props:
//   isOpen     — boolean
//   onClose    — fn
//   request    — rental_request row (with room + profile joins)
//   onSuccess  — fn(tenancy)
// =============================================================================
export function MoveInModal({ isOpen, onClose, request, onSuccess }) {
  const profile  = useAuthStore(s => s.profile);
  const toast    = useToast();

  const [moveInDate,   setMoveInDate]   = useState(new Date().toISOString().slice(0, 10));
  const [billingType,  setBillingType]  = useState("monthly");
  const [agreedPrice,  setAgreedPrice]  = useState("");
  const [loading,      setLoading]      = useState(false);
  const [errors,       setErrors]       = useState({});

  if (!request) return null;

  const room   = request.rooms;
  const client = request.profiles;
  const today  = new Date().toISOString().slice(0, 10);

  // Pre-fill agreed price from room when modal opens
  const defaultPrice = room?.monthly_price ?? "";

  const validate = () => {
    const e = {};
    if (!moveInDate)           e.moveInDate  = "Move-in date is required";
    if (moveInDate > today)    {} // future dates are fine
    const p = Number(agreedPrice || defaultPrice);
    if (!p || p <= 0)          e.agreedPrice = "Enter a valid agreed rent amount";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      const { data, error } = await createTenancy({
        tenantId:         profile.tenant_id,
        roomId:           room.id,
        clientId:         request.requester_id,
        rentalRequestId:  request.id,
        moveInDate,
        billingType,
        agreedPrice:      Number(agreedPrice || defaultPrice),
        approvedBy:       profile.id,
      });
      if (error) throw new Error(error.message);
      toast.success(`${client?.full_name ?? "Resident"} successfully moved in to Room ${room?.room_number}.`);
      onSuccess?.(data);
      onClose();
    } catch (err) {
      toast.error(err.message ?? "Failed to create tenancy.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Move-In" size="sm"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" loading={loading} onClick={handleSubmit}>Confirm Move-In</Button>
      </>}>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Resident + room summary */}
        <div style={{ background: "#FAF7F2", border: "1px solid #EDE4D8", borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div>
              <p style={{ fontSize: 12, color: "#8B7355", margin: "0 0 3px" }}>Resident</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1A1412", margin: 0 }}>{client?.full_name ?? "—"}</p>
              <p style={{ fontSize: 12, color: "#8B7355", margin: "2px 0 0" }}>{client?.phone ?? client?.email ?? ""}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 12, color: "#8B7355", margin: "0 0 3px" }}>Room</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1A1412", margin: 0 }}>Room {room?.room_number ?? "—"}</p>
              <p style={{ fontSize: 12, color: "#8B7355", margin: "2px 0 0", textTransform: "capitalize" }}>{room?.room_type?.replace(/_/g," ")}</p>
            </div>
          </div>
        </div>

        {/* Move-in date */}
        <Input label="Move-In Date" type="date" required
          value={moveInDate} onChange={e => { setMoveInDate(e.target.value); setErrors(p => ({ ...p, moveInDate: null })); }}
          error={errors.moveInDate}
        />

        {/* Billing type */}
        <SelectInput label="Billing Cycle Type" required
          options={[{ value: "monthly", label: "Monthly" }, { value: "semester", label: "Semester (2× per year)" }]}
          value={billingType} onChange={setBillingType}
        />

        {/* Agreed rent */}
        <Input label="Agreed Monthly Rent (KES)" type="number" min="1" required
          placeholder={String(defaultPrice)}
          value={agreedPrice}
          onChange={e => { setAgreedPrice(e.target.value); setErrors(p => ({ ...p, agreedPrice: null })); }}
          error={errors.agreedPrice}
          helper={`Room listed at ${formatCurrency(room?.monthly_price ?? 0)}/mo`}
          leftAdornment={<span style={{ fontSize: 12, fontWeight: 600, color: "#8B7355" }}>KES</span>}
        />

        <Alert type="info" compact
          message="Billing cycles will be generated automatically when you confirm move-in." />
      </div>
    </Modal>
  );
}

// =============================================================================
// MoveOutModal
//
// Manager records a resident moving out. Shows outstanding balance summary.
//
// Props:
//   isOpen     — boolean
//   onClose    — fn
//   tenancy    — tenancy row (with room + client profile + billing_cycles?)
//   outstanding— number — total unpaid balance (passed from parent page)
//   onSuccess  — fn(tenancy)
// =============================================================================
export function MoveOutModal({ isOpen, onClose, tenancy, outstanding = 0, onSuccess }) {
  const profile  = useAuthStore(s => s.profile);
  const toast    = useToast();

  const [moveOutDate, setMoveOutDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes,       setNotes]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [confirmed,   setConfirmed]   = useState(false);

  if (!tenancy) return null;

  const client  = tenancy.profiles;
  const room    = tenancy.rooms;
  const hasDebt = outstanding > 0;

  const handleSubmit = async () => {
    if (hasDebt && !confirmed) { setConfirmed(true); return; }
    setLoading(true);
    try {
      const { data, error } = await moveOut(tenancy.id, moveOutDate, notes.trim() || null);
      if (error) throw new Error(error.message);
      toast.success(`${client?.full_name ?? "Resident"} successfully moved out from Room ${room?.room_number}.`);
      onSuccess?.(data);
      onClose();
    } catch (err) {
      toast.error(err.message ?? "Failed to record move-out.");
    } finally {
      setLoading(false);
    }
  };

  const confirmLabel = hasDebt && !confirmed ? "Review Outstanding Balance →" : "Confirm Move-Out";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Move-Out" size="sm"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant={hasDebt && !confirmed ? "warning" : "danger"} loading={loading} onClick={handleSubmit}>
          {confirmLabel}
        </Button>
      </>}>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Resident info */}
        <div style={{ background: "#FAF7F2", border: "1px solid #EDE4D8", borderRadius: 12, padding: "14px 16px", display: "flex", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 12, color: "#8B7355", margin: "0 0 3px" }}>Resident</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#1A1412", margin: 0 }}>{client?.full_name ?? "—"}</p>
            <p style={{ fontSize: 12, color: "#8B7355", margin: "2px 0 0" }}>
              Room {room?.room_number} · Moved in {formatDate(tenancy.move_in_date)}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 11, color: "#8B7355", margin: "0 0 3px" }}>Outstanding</p>
            <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 18, color: hasDebt ? "#EF4444" : "#10B981", margin: 0 }}>
              {hasDebt ? formatCurrency(outstanding) : "Nil"}
            </p>
          </div>
        </div>

        {/* Outstanding balance warning */}
        {hasDebt && (
          <Alert type="warning"
            title="Outstanding Balance"
            message={`This resident has ${formatCurrency(outstanding)} in unpaid rent. Confirm only after ensuring settlement arrangements are in place.`}
          />
        )}

        {/* Move-out date */}
        <Input label="Move-Out Date" type="date" required
          value={moveOutDate} onChange={e => setMoveOutDate(e.target.value)}
        />

        {/* Notes */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#1A1412" }}>Notes <span style={{ color: "#8B7355", fontWeight: 400 }}>(optional)</span></label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Room cleaned and keys returned"
            rows={2}
            style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #E8DDD4", borderRadius: 12, fontSize: 14, fontFamily: "'DM Sans', system-ui", outline: "none", resize: "vertical", lineHeight: 1.6 }}
            onFocus={e => e.target.style.borderColor = "#C5612C"}
            onBlur={e  => e.target.style.borderColor = "#E8DDD4"}
          />
        </div>
      </div>
    </Modal>
  );
}

export default MoveInModal;
