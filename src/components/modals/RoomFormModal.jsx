import { useState, useEffect } from "react";
import { Modal }     from "./Modal.jsx";
import Button        from "../ui/Button.jsx";
import Input         from "../ui/Input.jsx";
import SelectInput   from "../ui/SelectInput.jsx";
import { Checkbox }  from "../ui/TextArea.jsx";
import { createRoom, updateRoom } from "../../lib/api/rooms.js";
import useAuthStore  from "../../store/authStore.js";
import { useToast }  from "../../hooks/useNotifications.js";

// =============================================================================
// RoomFormModal
//
// Add a new room or edit an existing one.
// isEdit is derived automatically — if `room` prop is provided, it's edit mode.
//
// Props:
//   isOpen      — boolean
//   onClose     — fn
//   room        — room row | null (null = create mode)
//   buildingId  — string | null — pre-select building in create mode
//   buildings   — { id, name }[] — for building select dropdown
//   onSuccess   — fn(room)
// =============================================================================

const ROOM_TYPES = [
  { value: "single",    label: "Single Room"   },
  { value: "double",    label: "Double Room"   },
  { value: "dormitory", label: "Dormitory"     },
  { value: "studio",    label: "Studio"        },
  { value: "bedsitter", label: "Bedsitter"     },
  { value: "apartment", label: "Apartment"     },
];

const AMENITY_OPTIONS = [
  "WiFi", "Water", "Electricity", "Security", "Parking",
  "Gym", "Laundry", "CCTV", "Study Room", "Meals",
  "Canteen", "Rooftop", "Concierge", "Common Room",
];

const ROOM_STATUS = [
  { value: "available",   label: "Available"   },
  { value: "maintenance", label: "Maintenance" },
  { value: "reserved",    label: "Reserved"    },
];

export default function RoomFormModal({ isOpen, onClose, room, buildingId, buildings = [], onSuccess }) {
  const profile  = useAuthStore(s => s.profile);
  const toast    = useToast();
  const isEdit   = !!room;

  const [form, setForm] = useState({
    roomNumber:    "",
    roomType:      "single",
    capacity:      "1",
    monthlyPrice:  "",
    semesterPrice: "",
    status:        "available",
    buildingId:    buildingId ?? "",
    description:   "",
    amenities:     [],
  });
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  // Populate form when editing
  useEffect(() => {
    if (isOpen && room) {
      setForm({
        roomNumber:    room.room_number      ?? "",
        roomType:      room.room_type        ?? "single",
        capacity:      String(room.capacity) ?? "1",
        monthlyPrice:  String(room.monthly_price)  ?? "",
        semesterPrice: String(room.semester_price ?? ""),
        status:        room.status           ?? "available",
        buildingId:    room.building_id      ?? buildingId ?? "",
        description:   room.description     ?? "",
        amenities:     room.amenities        ?? [],
      });
    } else if (isOpen) {
      setForm(f => ({ ...f, buildingId: buildingId ?? "" }));
    }
  }, [isOpen, room, buildingId]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const toggleAmenity = (a) => {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a],
    }));
  };

  const validate = () => {
    const e = {};
    if (!form.roomNumber.trim())              e.roomNumber   = "Room number is required";
    if (!form.monthlyPrice || Number(form.monthlyPrice) <= 0) e.monthlyPrice = "Enter a valid monthly price";
    if (!form.capacity || Number(form.capacity) < 1)          e.capacity     = "Capacity must be at least 1";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      const payload = {
        room_number:    form.roomNumber.trim(),
        room_type:      form.roomType,
        capacity:       Number(form.capacity),
        monthly_price:  Number(form.monthlyPrice),
        semester_price: form.semesterPrice ? Number(form.semesterPrice) : null,
        status:         form.status,
        building_id:    form.buildingId || null,
        description:    form.description.trim() || null,
        amenities:      form.amenities,
      };

      const { data, error } = isEdit
        ? await updateRoom(room.id, payload)
        : await createRoom(profile.tenant_id, payload);

      if (error) throw new Error(error.message);
      toast.success(isEdit ? "Room updated." : "Room created successfully.");
      onSuccess?.(data);
      handleClose();
    } catch (err) {
      toast.error(err.message ?? "Failed to save room.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => { setErrors({}); onClose(); };

  const buildingOptions = buildings.map(b => ({ value: b.id, label: b.name }));

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEdit ? "Edit Room" : "Add New Room"} size="md"
      footer={<>
        <Button variant="secondary" onClick={handleClose}>Cancel</Button>
        <Button variant="primary" loading={loading} onClick={handleSubmit}>
          {isEdit ? "Save Changes" : "Create Room"}
        </Button>
      </>}>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Row 1: Number + Type */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Input label="Room Number / Label" required placeholder="e.g. A4, Room 12, Suite 3"
            value={form.roomNumber}
            onChange={e => { set("roomNumber", e.target.value); setErrors(p => ({ ...p, roomNumber: null })); }}
            error={errors.roomNumber}
          />
          <SelectInput label="Room Type" required options={ROOM_TYPES} value={form.roomType} onChange={v => set("roomType", v)} />
        </div>

        {/* Row 2: Capacity + Status */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Input label="Capacity (persons)" type="number" min="1" max="50" required
            value={form.capacity}
            onChange={e => { set("capacity", e.target.value); setErrors(p => ({ ...p, capacity: null })); }}
            error={errors.capacity}
          />
          <SelectInput label="Status" required options={ROOM_STATUS} value={form.status} onChange={v => set("status", v)} />
        </div>

        {/* Row 3: Prices */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Input label="Monthly Rent (KES)" type="number" min="1" required
            placeholder="e.g. 8500"
            value={form.monthlyPrice}
            onChange={e => { set("monthlyPrice", e.target.value); setErrors(p => ({ ...p, monthlyPrice: null })); }}
            error={errors.monthlyPrice}
            leftAdornment={<span style={{ fontSize: 12, fontWeight: 600, color: "#8B7355" }}>KES</span>}
          />
          <Input label="Semester Price (KES)" type="number" min="1"
            placeholder="Optional"
            value={form.semesterPrice}
            onChange={e => set("semesterPrice", e.target.value)}
            helper="Leave blank if monthly only"
            leftAdornment={<span style={{ fontSize: 12, fontWeight: 600, color: "#8B7355" }}>KES</span>}
          />
        </div>

        {/* Building */}
        {buildings.length > 0 && (
          <SelectInput label="Building" placeholder="Select building (optional)"
            options={buildingOptions} value={form.buildingId} onChange={v => set("buildingId", v)} />
        )}

        {/* Amenities */}
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#1A1412", marginBottom: 10 }}>Amenities</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {AMENITY_OPTIONS.map(a => (
              <Checkbox key={a} label={a} checked={form.amenities.includes(a)} onChange={() => toggleAmenity(a)} />
            ))}
          </div>
        </div>

        {/* Description */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#1A1412" }}>Description <span style={{ color: "#8B7355", fontWeight: 400 }}>(optional)</span></label>
          <textarea value={form.description} onChange={e => set("description", e.target.value)}
            placeholder="Brief description of the room…" rows={2}
            style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #E8DDD4", borderRadius: 12, fontSize: 14, fontFamily: "'DM Sans', system-ui", outline: "none", resize: "vertical", lineHeight: 1.6 }}
            onFocus={e => e.target.style.borderColor = "#C5612C"}
            onBlur={e  => e.target.style.borderColor = "#E8DDD4"}
          />
        </div>
      </div>
    </Modal>
  );
}
