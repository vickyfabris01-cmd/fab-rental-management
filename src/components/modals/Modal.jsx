import { useEffect, useRef, useCallback } from "react";
import { createPortal }                    from "react-dom";

// =============================================================================
// Modal  ·  Drawer  ·  ConfirmDialog
//
// All built on a shared portal + focus-trap foundation.
// =============================================================================

// ─── Shared: lock body scroll while open ─────────────────────────────────────
function useLockScroll(active) {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [active]);
}

// ─── Shared: Escape key close ─────────────────────────────────────────────────
function useEscClose(active, onClose) {
  useEffect(() => {
    if (!active) return;
    const fn = e => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [active, onClose]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal
//
// Props:
//   isOpen     — boolean
//   onClose    — fn
//   title      — string
//   children   — ReactNode — modal body
//   footer     — ReactNode — optional footer (action buttons)
//   size       — "sm"(400) | "md"(560) | "lg"(720) | "xl"(900) | "full"
//   closable   — boolean — show X button and allow backdrop click (default true)
//   scrollable — boolean — make body scroll if tall (default true)
//
// Usage:
//   <Modal isOpen={open} onClose={close} title="New Complaint" size="md"
//          footer={<><Button variant="secondary" onClick={close}>Cancel</Button><Button variant="primary">Submit</Button></>}>
//     <NewComplaintForm />
//   </Modal>
// ─────────────────────────────────────────────────────────────────────────────

const SIZES = { sm: 400, md: 560, lg: 720, xl: 900, full: "100%" };

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size       = "md",
  closable   = true,
  scrollable = true,
}) {
  const dialogRef = useRef(null);
  useLockScroll(isOpen);
  useEscClose(isOpen && closable, onClose);

  // Focus first focusable element on open
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;
    const focusable = dialogRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    requestAnimationFrame(() => first?.focus());
  }, [isOpen]);

  if (!isOpen || typeof document === "undefined") return null;

  const maxW = SIZES[size] ?? 560;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      style={{
        position:   "fixed", inset: 0, zIndex: 1000,
        display:    "flex", alignItems: "center", justifyContent: "center",
        padding:    16,
        background: "rgba(26,20,18,0.55)",
        backdropFilter: "blur(4px)",
        animation: "modal-fade 0.18s ease both",
      }}
      onClick={e => { if (closable && e.target === e.currentTarget) onClose?.(); }}
    >
      <style>{`
        @keyframes modal-fade { from{opacity:0} to{opacity:1} }
        @keyframes modal-slide { from{opacity:0;transform:translateY(16px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }
      `}</style>

      <div
        ref={dialogRef}
        style={{
          width:        "100%",
          maxWidth:     maxW,
          maxHeight:    "90dvh",
          background:   "#fff",
          borderRadius: 20,
          boxShadow:    "0 24px 64px rgba(0,0,0,0.20)",
          display:      "flex",
          flexDirection:"column",
          animation:    "modal-slide 0.22s cubic-bezier(.22,.68,0,1.2) both",
          overflow:     "hidden",
        }}
      >
        {/* Header */}
        {(title || closable) && (
          <div style={{
            display:     "flex", alignItems: "center", justifyContent: "space-between",
            padding:     "20px 24px 18px",
            borderBottom:"1px solid #EDE4D8",
            flexShrink:  0,
          }}>
            {title && (
              <h2 id="modal-title" style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 900, fontSize: 20,
                color: "#1A1412", margin: 0,
              }}>
                {title}
              </h2>
            )}
            {closable && (
              <button
                onClick={onClose}
                aria-label="Close"
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: 6, borderRadius: 8, color: "#8B7355",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s", marginLeft: "auto",
                }}
                onMouseOver={e => { e.currentTarget.style.background = "#F5EDE0"; e.currentTarget.style.color = "#1A1412"; }}
                onMouseOut={e  => { e.currentTarget.style.background = "none";     e.currentTarget.style.color = "#8B7355"; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div style={{
          flex:       1,
          overflowY:  scrollable ? "auto" : "visible",
          padding:    "20px 24px",
        }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            padding:    "16px 24px",
            borderTop:  "1px solid #EDE4D8",
            display:    "flex", gap: 10, justifyContent: "flex-end",
            flexShrink: 0,
            flexWrap:   "wrap",
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Drawer
//
// Slide-in panel from the right (or left) side.
//
// Props:
//   isOpen  — boolean
//   onClose — fn
//   title   — string
//   side    — "right" | "left" (default "right")
//   width   — number px (default 400)
//   children, footer — same as Modal
// ─────────────────────────────────────────────────────────────────────────────
export function Drawer({ isOpen, onClose, title, children, footer, side = "right", width = 400 }) {
  useLockScroll(isOpen);
  useEscClose(isOpen, onClose);

  if (!isOpen || typeof document === "undefined") return null;

  const fromX = side === "right" ? "100%" : "-100%";

  return createPortal(
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", justifyContent: side === "right" ? "flex-end" : "flex-start" }}
    >
      <style>{`
        @keyframes drawer-in-r { from{transform:translateX(100%)} to{transform:translateX(0)} }
        @keyframes drawer-in-l { from{transform:translateX(-100%)} to{transform:translateX(0)} }
        @keyframes drawer-bg   { from{opacity:0} to{opacity:1} }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(26,20,18,0.45)", backdropFilter: "blur(3px)", animation: "drawer-bg 0.2s ease" }}
      />

      {/* Panel */}
      <div style={{
        position:     "relative",
        width:        Math.min(width, window.innerWidth - 32),
        height:       "100%",
        background:   "#fff",
        display:      "flex", flexDirection: "column",
        boxShadow:    side === "right" ? "-8px 0 32px rgba(0,0,0,0.15)" : "8px 0 32px rgba(0,0,0,0.15)",
        animation:    side === "right" ? "drawer-in-r 0.25s cubic-bezier(.22,.68,0,1.2)" : "drawer-in-l 0.25s cubic-bezier(.22,.68,0,1.2)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 18px", borderBottom: "1px solid #EDE4D8", flexShrink: 0 }}>
          {title && <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 19, color: "#1A1412", margin: 0 }}>{title}</h2>}
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 8, color: "#8B7355", display: "flex", transition: "all 0.15s", marginLeft: "auto" }}
            onMouseOver={e => { e.currentTarget.style.background = "#F5EDE0"; e.currentTarget.style.color = "#1A1412"; }}
            onMouseOut={e  => { e.currentTarget.style.background = "none";     e.currentTarget.style.color = "#8B7355"; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>{children}</div>
        {/* Footer */}
        {footer && <div style={{ padding: "16px 24px", borderTop: "1px solid #EDE4D8", display: "flex", gap: 10, justifyContent: "flex-end", flexShrink: 0 }}>{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ConfirmDialog
//
// Lightweight destructive-action confirmation dialog.
//
// Props:
//   isOpen       — boolean
//   title        — string (default "Are you sure?")
//   message      — string | ReactNode
//   confirmLabel — string (default "Confirm")
//   cancelLabel  — string (default "Cancel")
//   variant      — "danger" | "warning" | "info" (default "danger")
//   onConfirm    — fn
//   onCancel     — fn
//   loading      — boolean — disables confirm button while action runs
// ─────────────────────────────────────────────────────────────────────────────
export function ConfirmDialog({
  isOpen,
  title        = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel  = "Cancel",
  variant      = "danger",
  onConfirm,
  onCancel,
  loading      = false,
}) {
  useEscClose(isOpen, onCancel);
  useLockScroll(isOpen);

  if (!isOpen || typeof document === "undefined") return null;

  const COLORS = {
    danger:  { icon: "#DC2626", iconBg: "#FEF2F2", btn: "#EF4444", btnHover: "#DC2626" },
    warning: { icon: "#D97706", iconBg: "#FFFBEB", btn: "#F59E0B", btnHover: "#D97706" },
    info:    { icon: "#2563EB", iconBg: "#EFF6FF", btn: "#2563EB", btnHover: "#1D4ED8" },
  };
  const c = COLORS[variant] ?? COLORS.danger;

  const ICON_PATHS = {
    danger:  "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
    warning: "M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
    info:    "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  };

  return createPortal(
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(26,20,18,0.60)", backdropFilter: "blur(4px)", animation: "modal-fade 0.15s ease" }}
      onClick={e => { if (e.target === e.currentTarget) onCancel?.(); }}
    >
      <style>{`@keyframes modal-fade{from{opacity:0}to{opacity:1}} @keyframes modal-slide{from{opacity:0;transform:translateY(12px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
      <div style={{ width: "100%", maxWidth: 420, background: "#fff", borderRadius: 20, boxShadow: "0 24px 64px rgba(0,0,0,0.20)", padding: "28px 28px 24px", animation: "modal-slide 0.2s cubic-bezier(.22,.68,0,1.2)" }}>
        {/* Icon */}
        <div style={{ width: 48, height: 48, borderRadius: 14, background: c.iconBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, color: c.icon }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d={ICON_PATHS[variant] ?? ICON_PATHS.danger}/>
          </svg>
        </div>
        {/* Text */}
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 19, color: "#1A1412", margin: "0 0 8px" }}>{title}</h3>
        {message && <p style={{ fontSize: 14, color: "#5C4A3A", lineHeight: 1.6, margin: "0 0 24px" }}>{message}</p>}
        {/* Actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ padding: "10px 20px", borderRadius: 999, border: "1.5px solid #E8DDD4", background: "#fff", color: "#5C4A3A", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.15s", fontFamily: "'DM Sans', system-ui" }}
            onMouseOver={e => { e.currentTarget.style.borderColor = "#C5612C"; e.currentTarget.style.color = "#C5612C"; }}
            onMouseOut={e  => { e.currentTarget.style.borderColor = "#E8DDD4"; e.currentTarget.style.color = "#5C4A3A"; }}
          >
            {cancelLabel}
          </button>
          <button onClick={onConfirm} disabled={loading} style={{ padding: "10px 20px", borderRadius: 999, border: "none", background: c.btn, color: "#fff", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, transition: "background 0.15s", fontFamily: "'DM Sans', system-ui", display: "flex", alignItems: "center", gap: 6 }}
            onMouseOver={e => { if (!loading) e.currentTarget.style.background = c.btnHover; }}
            onMouseOut={e  => { e.currentTarget.style.background = c.btn; }}
          >
            {loading && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "modal-fade 0.3s infinite alternate" }}>
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0110 10" strokeLinecap="round" style={{ animation: "spin-cd 0.7s linear infinite" }}/>
              </svg>
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default Modal;
