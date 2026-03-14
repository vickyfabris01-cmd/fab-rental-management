import { useState, useEffect } from "react";
import { Modal }       from "./Modal.jsx";
import Button          from "../ui/Button.jsx";
import Input           from "../ui/Input.jsx";
import SelectInput     from "../ui/SelectInput.jsx";
import PhoneInput      from "../ui/PhoneInput.jsx";
import { createBuilding, updateBuilding } from "../../lib/api/rooms.js";
import { createWorker, updateWorker }     from "../../lib/api/workers.js";
import useAuthStore    from "../../store/authStore.js";
import { useToast }    from "../../hooks/useNotifications.js";

// =============================================================================
// BuildingFormModal
// =============================================================================

export function BuildingFormModal({ isOpen, onClose, building, onSuccess }) {
  const profile = useAuthStore(s => s.profile);
  const toast   = useToast();
  const isEdit  = !!building;

  const [form, setForm] = useState({ name: "", address: "", description: "", totalFloors: "1" });
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  useEffect(() => {
    if (isOpen && building) {
      setForm({
        name:        building.name           ?? "",
        address:     building.address        ?? "",
        description: building.description   ?? "",
        totalFloors: String(building.total_floors ?? 1),
      });
    } else if (isOpen) {
      setForm({ name: "", address: "", description: "", totalFloors: "1" });
    }
  }, [isOpen, building]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Building name is required";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      const payload = {
        name:         form.name.trim(),
        address:      form.address.trim()     || null,
        description:  form.description.trim() || null,
        total_floors: Number(form.totalFloors) || 1,
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
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "Edit Building" : "Add Building"} size="sm"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" loading={loading} onClick={handleSubmit}>{isEdit ? "Save Changes" : "Add Building"}</Button>
      </>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Input label="Building Name" required placeholder="e.g. Block A, Main House"
          value={form.name} onChange={e => { set("name", e.target.value); setErrors(p => ({ ...p, name: null })); }} error={errors.name} />
        <Input label="Address / Location" placeholder="e.g. Westlands, Nairobi"
          value={form.address} onChange={e => set("address", e.target.value)} />
        <Input label="Total Floors" type="number" min="1" max="50"
          value={form.totalFloors} onChange={e => set("totalFloors", e.target.value)} />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#1A1412" }}>Description <span style={{ color: "#8B7355", fontWeight: 400 }}>(optional)</span></label>
          <textarea value={form.description} onChange={e => set("description", e.target.value)}
            placeholder="Brief description…" rows={2}
            style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #E8DDD4", borderRadius: 12, fontSize: 14, fontFamily: "'DM Sans', system-ui", outline: "none", resize: "vertical", lineHeight: 1.6 }}
            onFocus={e => e.target.style.borderColor = "#C5612C"}
            onBlur={e  => e.target.style.borderColor = "#E8DDD4"}
          />
        </div>
      </div>
    </Modal>
  );
}

// =============================================================================
// WorkerFormModal
// =============================================================================

const WORKER_ROLES = [
  { value: "security",    label: "Security Guard" },
  { value: "cleaner",     label: "Cleaner"        },
  { value: "maintenance", label: "Maintenance"    },
  { value: "gardener",    label: "Gardener"       },
  { value: "receptionist",label: "Receptionist"   },
  { value: "driver",      label: "Driver"         },
  { value: "other",       label: "Other"          },
];

const PAY_CYCLES = [
  { value: "weekly",    label: "Weekly"    },
  { value: "biweekly",  label: "Biweekly"  },
  { value: "monthly",   label: "Monthly"   },
];

export function WorkerFormModal({ isOpen, onClose, worker, onSuccess }) {
  const profile = useAuthStore(s => s.profile);
  const toast   = useToast();
  const isEdit  = !!worker;

  const [form, setForm] = useState({
    fullName:   "",
    role:       "security",
    salary:     "",
    phone:      "",
    idNumber:   "",
    payCycle:   "monthly",
    startDate:  new Date().toISOString().slice(0, 10),
  });
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  useEffect(() => {
    if (isOpen && worker) {
      setForm({
        fullName:  worker.full_name  ?? "",
        role:      worker.role       ?? "security",
        salary:    String(worker.salary ?? ""),
        phone:     worker.phone      ?? "",
        idNumber:  worker.id_number  ?? "",
        payCycle:  worker.pay_cycle  ?? "monthly",
        startDate: worker.start_date ?? new Date().toISOString().slice(0, 10),
      });
    } else if (isOpen) {
      setForm({ fullName: "", role: "security", salary: "", phone: "", idNumber: "", payCycle: "monthly", startDate: new Date().toISOString().slice(0, 10) });
    }
  }, [isOpen, worker]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.fullName.trim())              e.fullName = "Full name is required";
    if (!form.salary || Number(form.salary) <= 0) e.salary = "Enter a valid salary amount";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      const payload = {
        fullName:   form.fullName.trim(),
        role:       form.role,
        salary:     Number(form.salary),
        phone:      form.phone     || null,
        idNumber:   form.idNumber  || null,
        payCycle:   form.payCycle,
        startDate:  form.startDate || null,
      };
      const { data, error } = isEdit
        ? await updateWorker(worker.id, { full_name: payload.fullName, role: payload.role, salary: payload.salary, phone: payload.phone, id_number: payload.idNumber, pay_cycle: payload.payCycle, start_date: payload.startDate })
        : await createWorker(profile.tenant_id, payload);
      if (error) throw new Error(error.message);
      toast.success(isEdit ? "Worker profile updated." : "Worker added successfully.");
      onSuccess?.(data);
      onClose();
    } catch (err) {
      toast.error(err.message ?? "Failed to save worker.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "Edit Worker" : "Add Worker"} size="md"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" loading={loading} onClick={handleSubmit}>{isEdit ? "Save Changes" : "Add Worker"}</Button>
      </>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Input label="Full Name" required placeholder="e.g. Samuel Oloo"
            value={form.fullName} onChange={e => { set("fullName", e.target.value); setErrors(p => ({ ...p, fullName: null })); }} error={errors.fullName} />
          <SelectInput label="Role" required options={WORKER_ROLES} value={form.role} onChange={v => set("role", v)} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Input label="Salary (KES)" type="number" min="1" required
            placeholder="e.g. 18000"
            value={form.salary} onChange={e => { set("salary", e.target.value); setErrors(p => ({ ...p, salary: null })); }}
            error={errors.salary}
            leftAdornment={<span style={{ fontSize: 12, fontWeight: 600, color: "#8B7355" }}>KES</span>}
          />
          <SelectInput label="Pay Cycle" options={PAY_CYCLES} value={form.payCycle} onChange={v => set("payCycle", v)} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <PhoneInput label="Phone Number" value={form.phone} onChange={v => set("phone", v)} />
          <Input label="ID Number" placeholder="National ID / Passport"
            value={form.idNumber} onChange={e => set("idNumber", e.target.value)} />
        </div>
        <Input label="Start Date" type="date"
          value={form.startDate} onChange={e => set("startDate", e.target.value)} />
      </div>
    </Modal>
  );
}

export default BuildingFormModal;
