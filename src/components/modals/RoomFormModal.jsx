import { useState, useEffect, useRef } from "react";
import { Modal } from "./Modal.jsx";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import SelectInput from "../ui/SelectInput.jsx";
import { Checkbox } from "../ui/TextArea.jsx";
import { createRoom, updateRoom } from "../../lib/api/rooms.js";
import { uploadFile, BUCKETS } from "../../config/supabase.js";
import useAuthStore from "../../store/authStore.js";
import { useToast } from "../../hooks/useNotifications.js";

// =============================================================================
// RoomFormModal
//
// Add a new room or edit an existing one.
// Building/Block selection is REQUIRED — every room must belong to a building.
//
// Props:
//   isOpen      — boolean
//   onClose     — fn
//   room        — room row | null  (null = create mode)
//   buildingId  — string | null   — pre-selects building (e.g. when opening
//                                   from inside a specific building card)
//   buildings   — { id, name }[]  — list of buildings to choose from
//   onSuccess   — fn(room)
// =============================================================================

const ROOM_TYPES = [
  { value: "single", label: "Single Room" },
  { value: "double", label: "Double Room" },
  { value: "dormitory", label: "Stalls" },
  { value: "studio", label: "1 Bedroom" },
  { value: "bedsitter", label: "Bedsitter" },
  { value: "suite", label: "2 Bedroom" },
];

const AMENITY_OPTIONS = [
  "WiFi",
  "Water",
  "Electricity",
  "Security",
  "Parking",
  "Gym",
  "Laundry",
  "CCTV",
  "Study Room",
  "Meals",
  "Canteen",
  "Rooftop",
  "Concierge",
  "Common Room",
];

const ROOM_STATUS = [
  { value: "available", label: "Available" },
  { value: "maintenance", label: "Maintenance" },
  { value: "reserved", label: "Reserved" },
];

export default function RoomFormModal({
  isOpen,
  onClose,
  room,
  buildingId,
  buildings = [],
  onSuccess,
}) {
  const profile = useAuthStore((s) => s.profile);
  const toast = useToast();
  const isEdit = !!room;

  const defaultBuildingId = buildingId ?? buildings[0]?.id ?? "";

  const [form, setForm] = useState({
    roomNumber: "",
    roomType: "single",
    capacity: "1",
    monthlyPrice: "",
    semesterPrice: "",
    status: "available",
    buildingId: defaultBuildingId,
    description: "",
    amenities: [],
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [roomImages, setRoomImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const imgRef = useRef(null);

  // Reset / populate form whenever modal opens
  useEffect(() => {
    if (!isOpen) return;
    if (room) {
      setForm({
        roomNumber: room.room_number ?? "",
        roomType: room.room_type ?? "single",
        capacity: String(room.capacity) ?? "1",
        monthlyPrice: String(room.monthly_price) ?? "",
        semesterPrice: String(room.semester_price ?? ""),
        status: room.status ?? "available",
        buildingId: room.building_id ?? buildingId ?? buildings[0]?.id ?? "",
        description: room.description ?? "",
        amenities: room.amenities ?? [],
      });
      setRoomImages(
        (room.images ?? []).map((url) => ({ url, isExisting: true })),
      );
      setImageFiles([]);
    } else {
      setForm({
        roomNumber: "",
        roomType: "single",
        capacity: "1",
        monthlyPrice: "",
        semesterPrice: "",
        status: "available",
        buildingId: buildingId ?? buildings[0]?.id ?? "",
        description: "",
        amenities: [],
      });
      setRoomImages([]);
      setImageFiles([]);
    }
    setErrors({});
  }, [isOpen]);

  // If buildingId prop changes while open (e.g. parent updates), sync it
  useEffect(() => {
    if (isOpen && !room && buildingId) {
      setForm((f) => ({ ...f, buildingId }));
    }
  }, [buildingId]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const toggleAmenity = (a) => {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a)
        ? f.amenities.filter((x) => x !== a)
        : [...f.amenities, a],
    }));
  };

  const handleImagePick = (e) => {
    const files = Array.from(e.target.files ?? []).slice(
      0,
      6 - roomImages.length,
    );
    setImageFiles((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setRoomImages((prev) => [
          ...prev,
          { url: ev.target.result, isNew: true, file },
        ]);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeRoomImage = (idx) => {
    const img = roomImages[idx];
    setRoomImages((prev) => prev.filter((_, i) => i !== idx));
    if (img.isNew) setImageFiles((prev) => prev.filter((f) => f !== img.file));
  };

  const validate = () => {
    const e = {};
    if (!form.roomNumber.trim()) e.roomNumber = "Room number is required.";
    if (!form.buildingId) e.buildingId = "Please select a building or block.";
    if (!form.monthlyPrice || Number(form.monthlyPrice) <= 0)
      e.monthlyPrice = "Enter a valid monthly price.";
    if (!form.capacity || Number(form.capacity) < 1)
      e.capacity = "Capacity must be at least 1.";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      // Upload new room images
      const existingUrls = roomImages
        .filter((i) => i.isExisting)
        .map((i) => i.url);
      const newUrls = [];
      if (imageFiles.length > 0) {
        setUploadLoading(true);
        for (const file of imageFiles) {
          const ext = file.name.split(".").pop();
          const path = `${profile.tenant_id}/rooms/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          try {
            const url = await uploadFile(BUCKETS.PROPERTY_IMGS, path, file, {
              upsert: true,
            });
            newUrls.push(url);
          } catch {
            toast.error(`Failed to upload: ${file.name}`);
          }
        }
        setUploadLoading(false);
      }

      const payload = {
        room_number: form.roomNumber.trim(),
        room_type: form.roomType,
        capacity: Number(form.capacity),
        monthly_price: Number(form.monthlyPrice),
        semester_price: form.semesterPrice ? Number(form.semesterPrice) : null,
        status: form.status,
        building_id: form.buildingId,
        description: form.description.trim() || null,
        amenities: form.amenities,
        images: [...existingUrls, ...newUrls],
      };

      const { data, error } = isEdit
        ? await updateRoom(room.id, payload)
        : await createRoom(profile.tenant_id, payload);

      if (error) throw new Error(error.message ?? "Database error.");
      toast.success(isEdit ? "Room updated." : "Room created successfully.");
      onSuccess?.(data);
      handleClose();
    } catch (err) {
      toast.error(err.message ?? "Failed to save room.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const buildingOptions = buildings.map((b) => ({
    value: b.id,
    label: b.name,
  }));

  // If no buildings exist yet, block room creation with a clear message
  const noBuildingsYet = buildings.length === 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? "Edit Room" : "Add New Room"}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={loading}
            onClick={handleSubmit}
            disabled={noBuildingsYet}
          >
            {uploadLoading
              ? "Uploading images…"
              : isEdit
                ? "Save Changes"
                : "Create Room"}
          </Button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* No buildings warning */}
        {noBuildingsYet && (
          <div
            style={{
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              borderRadius: 10,
              padding: "12px 16px",
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="#DC2626"
              style={{ flexShrink: 0, marginTop: 1 }}
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <p
              style={{
                fontSize: 13,
                color: "#991B1B",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              You need to create a <strong>building or block</strong> first
              before adding rooms. Close this and click{" "}
              <strong>+ Building</strong>.
            </p>
          </div>
        )}

        {/* Building / Block selector — REQUIRED, always shown at top */}
        <div>
          <SelectInput
            label="Building / Block"
            required
            placeholder="Select a building or block…"
            options={buildingOptions}
            value={form.buildingId}
            onChange={(v) => {
              set("buildingId", v);
              setErrors((p) => ({ ...p, buildingId: null }));
            }}
            error={errors.buildingId}
            disabled={noBuildingsYet}
          />
          {!errors.buildingId && form.buildingId && (
            <p
              style={{
                fontSize: 11,
                color: "#10B981",
                marginTop: 5,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Room will be added to{" "}
              <strong>
                {buildings.find((b) => b.id === form.buildingId)?.name}
              </strong>
            </p>
          )}
        </div>

        {/* Row 1: Room Number + Type */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >
          <Input
            label="Room Number / Label"
            required
            placeholder="e.g. A4, Room 12, 3B"
            value={form.roomNumber}
            onChange={(e) => {
              set("roomNumber", e.target.value);
              setErrors((p) => ({ ...p, roomNumber: null }));
            }}
            error={errors.roomNumber}
            disabled={noBuildingsYet}
          />
          <SelectInput
            label="Room Type"
            required
            options={ROOM_TYPES}
            value={form.roomType}
            onChange={(e) => set("roomType", e.target.value)}
            disabled={noBuildingsYet}
          />
        </div>

        {/* Row 2: Capacity + Status */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >
          <Input
            label="Capacity (persons)"
            type="number"
            min="1"
            max="50"
            required
            value={form.capacity}
            onChange={(e) => {
              set("capacity", e.target.value);
              setErrors((p) => ({ ...p, capacity: null }));
            }}
            error={errors.capacity}
            disabled={noBuildingsYet}
          />
          <SelectInput
            label="Status"
            required
            options={ROOM_STATUS}
            value={form.status}
            onChange={(v) => set("status", v)}
            disabled={noBuildingsYet}
          />
        </div>

        {/* Row 3: Prices */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >
          <Input
            label="Monthly Rent (KES)"
            type="number"
            min="1"
            required
            placeholder="e.g. 8500"
            value={form.monthlyPrice}
            onChange={(e) => {
              set("monthlyPrice", e.target.value);
              setErrors((p) => ({ ...p, monthlyPrice: null }));
            }}
            error={errors.monthlyPrice}
            leftAdornment={
              <span style={{ fontSize: 12, fontWeight: 600, color: "#8B7355" }}>
                KES
              </span>
            }
            disabled={noBuildingsYet}
          />
          <Input
            label="Semester Price (KES)"
            type="number"
            min="1"
            placeholder="Optional"
            value={form.semesterPrice}
            onChange={(e) => set("semesterPrice", e.target.value)}
            helper="Leave blank if monthly only"
            leftAdornment={
              <span style={{ fontSize: 12, fontWeight: 600, color: "#8B7355" }}>
                KES
              </span>
            }
            disabled={noBuildingsYet}
          />
        </div>

        {/* Room Photos */}
        <div>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#1A1412",
              marginBottom: 8,
            }}
          >
            Room Photos{" "}
            <span style={{ fontSize: 11, fontWeight: 400, color: "#8B7355" }}>
              (up to 6)
            </span>
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
            }}
          >
            {roomImages.map((img, idx) => (
              <div
                key={idx}
                style={{
                  position: "relative",
                  aspectRatio: "4/3",
                  borderRadius: 10,
                  overflow: "hidden",
                  border: "1px solid #EDE4D8",
                }}
              >
                <img
                  src={img.url}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <button
                  type="button"
                  onClick={() => removeRoomImage(idx)}
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "rgba(0,0,0,0.6)",
                    border: "none",
                    cursor: "pointer",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                  }}
                >
                  ✕
                </button>
                {idx === 0 && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: 4,
                      left: 4,
                      fontSize: 9,
                      fontWeight: 700,
                      background: "#C5612C",
                      color: "#fff",
                      padding: "2px 5px",
                      borderRadius: 999,
                    }}
                  >
                    COVER
                  </span>
                )}
              </div>
            ))}
            {roomImages.length < 6 && !noBuildingsYet && (
              <button
                type="button"
                onClick={() => imgRef.current?.click()}
                style={{
                  aspectRatio: "4/3",
                  borderRadius: 10,
                  border: "2px dashed #E8DDD4",
                  background: "#FAF7F2",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  color: "#8B7355",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.borderColor = "#C5612C")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.borderColor = "#E8DDD4")
                }
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <span style={{ fontSize: 11 }}>Add photo</span>
              </button>
            )}
          </div>
          <input
            ref={imgRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleImagePick}
            style={{ display: "none" }}
          />
        </div>

        {/* Amenities */}
        <div>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#1A1412",
              marginBottom: 10,
            }}
          >
            Amenities{" "}
            <span style={{ fontSize: 11, fontWeight: 400, color: "#8B7355" }}>
              (select all that apply)
            </span>
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {AMENITY_OPTIONS.map((a) => (
              <Checkbox
                key={a}
                label={a}
                checked={form.amenities.includes(a)}
                onChange={() => toggleAmenity(a)}
                disabled={noBuildingsYet}
              />
            ))}
          </div>
        </div>

        {/* Description */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#1A1412" }}>
            Description{" "}
            <span style={{ color: "#8B7355", fontWeight: 400 }}>
              (optional)
            </span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Brief description of the room…"
            rows={2}
            disabled={noBuildingsYet}
            style={{
              width: "100%",
              padding: "10px 14px",
              border: "1.5px solid #E8DDD4",
              borderRadius: 12,
              fontSize: 14,
              fontFamily: "'DM Sans', system-ui",
              outline: "none",
              resize: "vertical",
              lineHeight: 1.6,
              opacity: noBuildingsYet ? 0.5 : 1,
            }}
            onFocus={(e) => (e.target.style.borderColor = "#C5612C")}
            onBlur={(e) => (e.target.style.borderColor = "#E8DDD4")}
          />
        </div>
      </div>
    </Modal>
  );
}
