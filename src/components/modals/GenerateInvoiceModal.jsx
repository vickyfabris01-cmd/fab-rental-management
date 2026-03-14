import { useState, useEffect } from "react";
import { Modal }      from "./Modal.jsx";
import Button         from "../ui/Button.jsx";
import SelectInput    from "../ui/SelectInput.jsx";
import { Spinner }    from "../ui/Spinner.jsx";
import { Alert }      from "../ui/Alert.jsx";
import { formatCurrency, formatDate, formatBillingPeriod } from "../../lib/formatters.js";
import { getBillingCycles } from "../../lib/api/billing.js";
import useAuthStore   from "../../store/authStore.js";
import { useToast }   from "../../hooks/useNotifications.js";

// =============================================================================
// GenerateInvoiceModal
//
// Manager selects a billing cycle and triggers PDF invoice generation via
// FastAPI (POST /invoices). The generated PDF URL is then stored in Supabase.
//
// Props:
//   isOpen      — boolean
//   onClose     — fn
//   cycle       — billing_cycle | null — pre-select a specific cycle
//   tenancyId   — string | null — pre-filter cycles to a tenancy
//   onSuccess   — fn(invoice)
// =============================================================================

export default function GenerateInvoiceModal({ isOpen, onClose, cycle: initialCycle, tenancyId, onSuccess }) {
  const profile  = useAuthStore(s => s.profile);
  const toast    = useToast();

  const [cycles,     setCycles]    = useState([]);
  const [loading,    setLoading]   = useState(false);
  const [generating, setGenerating]= useState(false);
  const [selected,   setSelected]  = useState(initialCycle?.id ?? "");
  const [invoice,    setInvoice]   = useState(null); // generated invoice result

  // Load unpaid/partial cycles for dropdown
  useEffect(() => {
    if (!isOpen) return;
    if (initialCycle) { setCycles([initialCycle]); setSelected(initialCycle.id); return; }
    setLoading(true);
    getBillingCycles(profile.tenant_id, { tenancyId })
      .then(({ data }) => setCycles(data ?? []))
      .finally(() => setLoading(false));
  }, [isOpen, initialCycle, tenancyId, profile?.tenant_id]);

  const selectedCycle = cycles.find(c => c.id === selected);

  const handleGenerate = async () => {
    if (!selectedCycle) return;
    setGenerating(true);
    try {
      // Call FastAPI invoice generation endpoint
      const { data: session } = await import("../../config/supabase.js").then(m => m.supabase.auth.getSession());
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/invoices`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.session.access_token}` },
        body:    JSON.stringify({ billing_cycle_id: selectedCycle.id }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail ?? "Invoice generation failed"); }
      const data = await res.json();
      setInvoice(data);
      onSuccess?.(data);
    } catch (err) {
      toast.error(err.message ?? "Failed to generate invoice.");
    } finally {
      setGenerating(false);
    }
  };

  const handleClose = () => { setSelected(initialCycle?.id ?? ""); setInvoice(null); onClose(); };

  const cycleOptions = cycles.map(c => ({
    value: c.id,
    label: `${c.profiles?.full_name ?? "Unknown"} — ${formatBillingPeriod(c.period_start, c.period_end, c.billing_type)} (${formatCurrency(c.amount_due)})`,
  }));

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Generate Invoice" size="sm"
      footer={invoice ? (
        <div style={{ display: "flex", gap: 8, width: "100%" }}>
          <Button variant="secondary" onClick={handleClose} style={{ flex: 1 }}>Close</Button>
          {invoice.pdf_url && (
            <Button variant="primary" as="a" href={invoice.pdf_url} target="_blank" rel="noopener" style={{ flex: 1 }}>
              Download PDF ↗
            </Button>
          )}
        </div>
      ) : (
        <>
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" loading={generating} onClick={handleGenerate} disabled={!selected}>
            Generate Invoice
          </Button>
        </>
      )}>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 32 }}><Spinner size="md" /></div>
      ) : invoice ? (
        // Success preview
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 12 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
              <polyline points="16 13 12 17 8 13"/><line x1="12" y1="17" x2="12" y2="9"/>
            </svg>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#065F46", margin: "0 0 2px" }}>Invoice Generated</p>
              <p style={{ fontSize: 12, color: "#059669", margin: 0 }}>{invoice.invoice_number}</p>
            </div>
          </div>

          {/* Invoice details */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "14px 16px", background: "#FAF7F2", border: "1px solid #EDE4D8", borderRadius: 12 }}>
            {[
              ["Invoice No.",    invoice.invoice_number],
              ["Client",        invoice.profiles?.full_name ?? "—"],
              ["Period",        selectedCycle ? formatBillingPeriod(selectedCycle.period_start, selectedCycle.period_end, selectedCycle.billing_type) : "—"],
              ["Amount",        formatCurrency(invoice.total_amount)],
              ["Issued",        formatDate(invoice.issued_at)],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "#8B7355" }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1412" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Selection form
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <p style={{ fontSize: 14, color: "#5C4A3A", margin: 0 }}>
            Select a billing cycle to generate a PDF invoice for the resident.
          </p>

          {cycles.length === 0 ? (
            <Alert type="info" message="No billing cycles found. Cycles are created automatically when a resident moves in." />
          ) : (
            <SelectInput
              label="Billing Cycle"
              required
              placeholder="Select a cycle…"
              options={cycleOptions}
              value={selected}
              onChange={setSelected}
            />
          )}

          {/* Preview of selected cycle */}
          {selectedCycle && (
            <div style={{ background: "#FAF7F2", border: "1px solid #EDE4D8", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#1A1412", margin: 0 }}>
                  {selectedCycle.profiles?.full_name ?? "Resident"}
                </p>
                <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 16, color: "#C5612C", margin: 0 }}>
                  {formatCurrency(Number(selectedCycle.amount_due) + Number(selectedCycle.late_fee ?? 0))}
                </p>
              </div>
              <p style={{ fontSize: 12, color: "#8B7355", margin: 0 }}>
                {formatBillingPeriod(selectedCycle.period_start, selectedCycle.period_end, selectedCycle.billing_type)}
                {" · "}Due {formatDate(selectedCycle.due_date)}
              </p>
            </div>
          )}

          <Alert type="info" compact message="The invoice PDF will be stored and downloadable by the resident from their billing page." />
        </div>
      )}
    </Modal>
  );
}
