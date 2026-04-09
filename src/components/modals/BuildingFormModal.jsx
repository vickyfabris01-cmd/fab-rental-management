import { useState, useEffect, useRef } from "react";
import { Modal } from "./Modal.jsx";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import SelectInput from "../ui/SelectInput.jsx";
import PhoneInput from "../ui/PhoneInput.jsx";
import { createBuilding, updateBuilding } from "../../lib/api/rooms.js";
import { uploadFile, BUCKETS } from "../../config/supabase.js";
import { createWorker, updateWorker } from "../../lib/api/workers.js";
import useAuthStore from "../../store/authStore.js";
import { useToast } from "../../hooks/useNotifications.js";

// =============================================================================
// BuildingFormModal
// =============================================================================

export function BuildingFormModal({ isOpen, onClose, building, onSuccess }) {
  const profile = useAuthStore((s) => s.profile);
  const toast = useToast();
  const isEdit = !!building;
  const imgRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    address: "",
    description: "",
    totalFloors: "1",
  });
  const [images, setImages] = useState([]); // preview URLs (base64)
  const [imageFiles, setImageFiles] = useState([]); // File objects to upload
  const [uploadLoading, setUploadLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && building) {
      setForm({
        name: building.name ?? "",
        address: building.address ?? "",
        description: building.description ?? "",
        totalFloors: String(building.total_floors ?? 1),
      });
      setImages(
        (building.images ?? []).map((url) => ({ url, isExisting: true })),
      );
      setImageFiles([]);
    } else if (isOpen) {
      setForm({ name: "", address: "", description: "", totalFloors: "1" });
      setImages([]);
      setImageFiles([]);
    }
  }, [isOpen, building]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleImagePick = (e) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const newFiles = files.slice(0, 6 - images.length); // max 6 images
    setImageFiles((prev) => [...prev, ...newFiles]);
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setImages((prev) => [
          ...prev,
          { url: ev.target.result, isNew: true, file },
        ]);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeImage = (idx) => {
    const img = images[idx];
    setImages((prev) => prev.filter((_, i) => i !== idx));
    if (img.isNew) setImageFiles((prev) => prev.filter((f) => f !== img.file));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Building name is required";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setLoading(true);
    try {
      // Upload new images to Supabase Storage
      const existingUrls = images.filter((i) => i.isExisting).map((i) => i.url);
      const newUrls = [];

      if (imageFiles.length > 0) {
        setUploadLoading(true);
        for (const file of imageFiles) {
          const ext = file.name.split(".").pop();
          const path = `${profile.tenant_id}/buildings/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          try {
            const url = await uploadFile(BUCKETS.PROPERTY_IMGS, path, file, {
              upsert: true,
            });
            newUrls.push(url);
          } catch (uploadErr) {
            toast.error(`Failed to upload image: ${file.name}`);
          }
        }
        setUploadLoading(false);
      }

      const payload = {
        name: form.name.trim(),
        address: form.address.trim() || null,
        description: form.description.trim() || null,
        total_floors: Number(form.totalFloors) || 1,
        images: [...existingUrls, ...newUrls],
      };

      const { data, error } = isEdit
        ? await updateBuilding(building.id, payload)
        : await createBuilding(profile.tenant_id, payload);
      if (error) throw new Error(error.message);
      toast.success(isEdit ? "Building updated." : "Building added.");
      onSuccess?.(data);
      onClose();
    } catch (err) {
      toast.error(err.message ?? "Failed to save building.");
    } finally {
      setLoading(false);
      setUploadLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Building" : "Add Building"}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={loading || uploadLoading}
            onClick={handleSubmit}
          >
            {uploadLoading
              ? "Uploading images…"
              : isEdit
                ? "Save Changes"
                : "Add Building"}
          </Button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Input
          label="Building Name"
          required
          placeholder="e.g. Block A, Main House"
          value={form.name}
          onChange={(e) => {
            set("name", e.target.value);
            setErrors((p) => ({ ...p, name: null }));
          }}
          error={errors.name}
        />
        <Input
          label="Address / Location"
          placeholder="e.g. Westlands, Nairobi"
          value={form.address}
          onChange={(e) => set("address", e.target.value)}
        />
        <Input
          label="Total Floors"
          type="number"
          min="1"
          max="50"
          value={form.totalFloors}
          onChange={(e) => set("totalFloors", e.target.value)}
        />
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
            placeholder="Brief description…"
            rows={2}
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
            }}
            onFocus={(e) => (e.target.style.borderColor = "#C5612C")}
            onBlur={(e) => (e.target.style.borderColor = "#E8DDD4")}
          />
        </div>

        {/* Image Upload */}
        <div>
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#1A1412",
              display: "block",
              marginBottom: 8,
            }}
          >
            Building Photos{" "}
            <span style={{ color: "#8B7355", fontWeight: 400 }}>
              (up to 6 · JPEG/PNG/WebP)
            </span>
          </label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
            }}
          >
            {images.map((img, idx) => (
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
                  onClick={() => removeImage(idx)}
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "rgba(0,0,0,0.6)",
                    border: "none",
                    cursor: "pointer",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
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
                      padding: "2px 6px",
                      borderRadius: 999,
                    }}
                  >
                    COVER
                  </span>
                )}
              </div>
            ))}
            {images.length < 6 && (
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
                  gap: 6,
                  color: "#8B7355",
                  transition: "border-color 0.15s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.borderColor = "#C5612C")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.borderColor = "#E8DDD4")
                }
              >
                <svg
                  width="20"
                  height="20"
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
          <p style={{ fontSize: 11, color: "#8B7355", marginTop: 6 }}>
            First image will be the cover photo shown on the public listing.
          </p>
        </div>
      </div>
    </Modal>
  );
}

// =============================================================================
// WorkerFormModal
// =============================================================================

const WORKER_ROLES = [
  { value: "security", label: "Security Guard" },
  { value: "cleaner", label: "Cleaner" },
  { value: "maintenance", label: "Maintenance" },
  { value: "gardener", label: "Gardener" },
  { value: "receptionist", label: "Receptionist" },
  { value: "driver", label: "Driver" },
  { value: "other", label: "Other" },
];

const PAY_CYCLES = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Biweekly" },
  { value: "monthly", label: "Monthly" },
];

export function WorkerFormModal({ isOpen, onClose, worker, onSuccess }) {
  const profile = useAuthStore((s) => s.profile);
  const toast = useToast();
  const isEdit = !!worker;

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    role: "security",
    salary: "",
    phone: "",
    idNumber: "",
    payCycle: "monthly",
    startDate: new Date().toISOString().slice(0, 10),
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && worker) {
      setForm({
        fullName: worker.full_name ?? "",
        email: worker.email ?? "",
        role: worker.role ?? "security",
        salary: String(worker.salary ?? ""),
        phone: worker.phone ?? "",
        idNumber: worker.id_number ?? "",
        payCycle: worker.pay_cycle ?? "monthly",
        startDate: worker.start_date ?? new Date().toISOString().slice(0, 10),
      });
    } else if (isOpen) {
      setForm({
        fullName: "",
        email: "",
        role: "security",
        salary: "",
        phone: "",
        idNumber: "",
        payCycle: "monthly",
        startDate: new Date().toISOString().slice(0, 10),
      });
    }
  }, [isOpen, worker]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required for worker access";
    if (form.email && !form.email.includes("@"))
      e.email = "Enter a valid email";
    if (!form.salary || Number(form.salary) <= 0)
      e.salary = "Enter a valid salary amount";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setLoading(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        role: form.role,
        salary: Number(form.salary),
        phone: form.phone || null,
        idNumber: form.idNumber || null,
        payCycle: form.payCycle,
        startDate: form.startDate || null,
      };
      const { data, error } = isEdit
        ? await updateWorker(worker.id, {
            full_name: payload.fullName,
            email: payload.email,
            role: payload.role,
            salary: payload.salary,
            phone: payload.phone,
            id_number: payload.idNumber,
            pay_cycle: payload.payCycle,
            start_date: payload.startDate,
          })
        : await createWorker(profile.tenant_id, payload);
      if (error) throw new Error(error.message);
      toast.success(
        isEdit
          ? "Worker profile updated."
          : "Worker record saved. To give them dashboard access, ask them to create a fabRentals account, then assign the Worker role from the Workforce page.",
      );
      onSuccess?.(data);
      onClose();
    } catch (err) {
      toast.error(err.message ?? "Failed to save worker.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Worker" : "Add Worker"}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" loading={loading} onClick={handleSubmit}>
            {isEdit ? "Save Changes" : "Add Worker"}
          </Button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >
          <Input
            label="Full Name"
            required
            placeholder="e.g. Samuel Oloo"
            value={form.fullName}
            onChange={(e) => {
              set("fullName", e.target.value);
              setErrors((p) => ({ ...p, fullName: null }));
            }}
            error={errors.fullName}
          />
          <SelectInput
            label="Role"
            required
            options={WORKER_ROLES}
            value={form.role}
            onChange={(v) => set("role", v)}
          />
        </div>
        <Input
          label="Email"
          required
          type="email"
          placeholder="e.g. samuel@example.com"
          value={form.email}
          onChange={(e) => {
            set("email", e.target.value);
            setErrors((p) => ({ ...p, email: null }));
          }}
          error={errors.email}
          help="Workers use this email to access the dashboard"
        />
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >
          <Input
            label="Salary (KES)"
            type="number"
            min="1"
            required
            placeholder="e.g. 18000"
            value={form.salary}
            onChange={(e) => {
              set("salary", e.target.value);
              setErrors((p) => ({ ...p, salary: null }));
            }}
            error={errors.salary}
            leftAdornment={
              <span style={{ fontSize: 12, fontWeight: 600, color: "#8B7355" }}>
                KES
              </span>
            }
          />
          <SelectInput
            label="Pay Cycle"
            options={PAY_CYCLES}
            value={form.payCycle}
            onChange={(v) => set("payCycle", v)}
          />
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >
          <PhoneInput
            label="Phone Number"
            value={form.phone}
            onChange={(v) => set("phone", v)}
          />
          <Input
            label="ID Number"
            placeholder="National ID / Passport"
            value={form.idNumber}
            onChange={(e) => set("idNumber", e.target.value)}
          />
        </div>
        <Input
          label="Start Date"
          type="date"
          value={form.startDate}
          onChange={(e) => set("startDate", e.target.value)}
        />
      </div>
    </Modal>
  );
}

export default BuildingFormModal;
