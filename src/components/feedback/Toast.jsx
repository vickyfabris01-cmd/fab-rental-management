import { useEffect, useRef } from "react";
import { createPortal }      from "react-dom";
import { useToasts }          from "../../hooks/useNotifications.js";

// =============================================================================
// Toast  ·  ToastContainer
//
// Toasts are driven by notificationStore — call useToast() anywhere to fire them.
//
// Toast shape (from notificationStore):
//   { id, type, title?, message, duration, createdAt }
//
// Types: success | error | warning | info
//   - error toasts are persistent (duration 0) — must be manually closed
//   - all others auto-dismiss after their duration (default 4s success, 5s others)
//
// ToastContainer mounts once in App.jsx — it reads from the store directly.
//
// Usage in a component / event handler:
//   import { useToast } from "../../hooks/useNotifications";
//   const toast = useToast();
//   toast.success("Payment recorded!");
//   toast.error("Something went wrong.", "Payment Failed");
//   toast.info("Sync in progress…");
// =============================================================================

const META = {
  success: {
    bg:     "#1A2E20",
    border: "rgba(16,185,129,0.25)",
    icon:   "#10B981",
    title:  "#ECFDF5",
    text:   "rgba(236,253,245,0.75)",
    iconPath: "M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3",
  },
  error: {
    bg:     "#2D1010",
    border: "rgba(239,68,68,0.3)",
    icon:   "#EF4444",
    title:  "#FEF2F2",
    text:   "rgba(254,242,242,0.7)",
    iconPath: "M12 8v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
  },
  warning: {
    bg:     "#2D2010",
    border: "rgba(245,158,11,0.25)",
    icon:   "#F59E0B",
    title:  "#FFFBEB",
    text:   "rgba(255,251,235,0.7)",
    iconPath: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
  },
  info: {
    bg:     "#101A2D",
    border: "rgba(59,130,246,0.25)",
    icon:   "#3B82F6",
    title:  "#EFF6FF",
    text:   "rgba(239,246,255,0.7)",
    iconPath: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
};

// ─── Single Toast ─────────────────────────────────────────────────────────────
function Toast({ toast, onRemove }) {
  const m            = META[toast.type] ?? META.info;
  const isPersistent = toast.duration === 0;
  const timerRef     = useRef(null);

  // Auto-dismiss
  useEffect(() => {
    if (isPersistent || !toast.duration) return;
    timerRef.current = setTimeout(() => onRemove(toast.id), toast.duration);
    return () => clearTimeout(timerRef.current);
  }, [toast.id, toast.duration, isPersistent, onRemove]);

  // Progress bar duration
  const progressDuration = toast.duration > 0 ? `${toast.duration}ms` : "0ms";

  return (
    <>
      <style>{`
        @keyframes toast-in  { from{opacity:0;transform:translateX(100%)} to{opacity:1;transform:translateX(0)} }
        @keyframes toast-out { from{opacity:1;transform:translateX(0)}    to{opacity:0;transform:translateX(110%)} }
        @keyframes toast-bar { from{width:100%} to{width:0%} }
      `}</style>

      <div
        role="alert"
        aria-live="polite"
        style={{
          position:     "relative",
          minWidth:     300, maxWidth: 380,
          background:   m.bg,
          border:       `1px solid ${m.border}`,
          borderRadius: 14,
          padding:      "14px 16px 16px",
          boxShadow:    "0 8px 28px rgba(0,0,0,0.28)",
          overflow:     "hidden",
          animation:    "toast-in 0.28s cubic-bezier(.22,.68,0,1.2) both",
          display:      "flex",
          gap:          12,
          alignItems:   "flex-start",
        }}
      >
        {/* Type icon */}
        <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, background: `${m.icon}18`, border: `1px solid ${m.icon}30`, display: "flex", alignItems: "center", justifyContent: "center", color: m.icon }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d={m.iconPath}/>
          </svg>
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {toast.title && (
            <p style={{ fontSize: 13, fontWeight: 700, color: m.title, margin: "0 0 3px", lineHeight: 1.3 }}>{toast.title}</p>
          )}
          {toast.message && (
            <p style={{ fontSize: 12, color: m.text, margin: 0, lineHeight: 1.55 }}>{toast.message}</p>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={() => onRemove(toast.id)}
          aria-label="Dismiss notification"
          style={{ background: "none", border: "none", cursor: "pointer", padding: 3, borderRadius: 6, color: m.text, display: "flex", flexShrink: 0, transition: "opacity 0.15s", opacity: 0.55 }}
          onMouseOver={e => e.currentTarget.style.opacity = "1"}
          onMouseOut={e  => e.currentTarget.style.opacity = "0.55"}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* Auto-dismiss progress bar */}
        {!isPersistent && (
          <div style={{
            position:   "absolute", bottom: 0, left: 0,
            height:     2,
            background: m.icon,
            opacity:    0.4,
            animation:  `toast-bar ${progressDuration} linear forwards`,
            animationDelay: "0.1s",
          }}/>
        )}
      </div>
    </>
  );
}

// ─── ToastContainer ───────────────────────────────────────────────────────────
export function ToastContainer() {
  const { toasts, removeToast } = useToasts();

  if (!toasts.length || typeof document === "undefined") return null;

  return createPortal(
    <div
      aria-live="polite"
      aria-atomic="false"
      style={{
        position:      "fixed",
        top:           20,
        right:         20,
        zIndex:        9999,
        display:       "flex",
        flexDirection: "column",
        gap:           10,
        pointerEvents: "none",
        maxWidth:      380,
        width:         "calc(100vw - 40px)",
      }}
    >
      {toasts.map(t => (
        <div key={t.id} style={{ pointerEvents: "auto" }}>
          <Toast toast={t} onRemove={removeToast} />
        </div>
      ))}
    </div>,
    document.body
  );
}

export default Toast;
