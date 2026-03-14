import { formatCurrency, formatDate, formatRelativeTime } from "../../lib/formatters.js";
import Badge, { RoleBadge } from "../ui/Badge.jsx";
import Avatar                from "../ui/Avatar.jsx";

// =============================================================================
// Domain-specific data display cards and rows
// All exported individually. Each is self-contained with inline styles.
//
// Exports:
//   BillingCycleRow   — billing cycle list row with pay/view actions
//   PaymentRow        — payment history row (read-only)
//   ComplaintCard     — complaint list card with status/priority
//   NotificationItem  — notification list item with mark-read
//   WorkerCard        — worker management card with actions
//   RoomCard          — room picker / selection card
// =============================================================================

// ─── Shared helpers ───────────────────────────────────────────────────────────
function RowWrapper({ children, onClick, style: extra = {} }) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      style={{
        display:      "flex",
        alignItems:   "center",
        padding:      "14px 20px",
        gap:          14,
        cursor:       onClick ? "pointer" : "default",
        transition:   "background 0.12s",
        background:   "#fff",
        ...extra,
      }}
      onMouseOver={e => { if (onClick) e.currentTarget.style.background = "#FFFAF6"; }}
      onMouseOut={e  => { if (onClick) e.currentTarget.style.background = extra.background ?? "#fff"; }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BillingCycleRow
//
// Props:
//   cycle   — billing_cycle row from DB
//   onPay   — fn(cycle) — triggers MPesaPayModal
//   onView  — fn(cycle)
//   showClient — boolean — show client avatar/name (manager view)
// ─────────────────────────────────────────────────────────────────────────────
export function BillingCycleRow({ cycle, onPay, onView, showClient = false }) {
  const total      = Number(cycle.amount_due) + Number(cycle.late_fee ?? 0);
  const isOverdue  = cycle.due_date < new Date().toISOString().slice(0, 10);
  const isPaidOrWaived = ["paid", "waived", "cancelled"].includes(cycle.status);

  return (
    <RowWrapper onClick={() => onView?.(cycle)}>
      {/* Client avatar (manager view) */}
      {showClient && cycle.profiles && (
        <Avatar name={cycle.profiles.full_name} src={cycle.profiles.avatar_url} size="sm" />
      )}

      {/* Period + room */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#1A1412", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {showClient ? (cycle.profiles?.full_name ?? "—") : formatDate(cycle.period_start, { style: "long" })}
        </p>
        <p style={{ fontSize: 12, color: "#8B7355", margin: "2px 0 0" }}>
          {showClient ? formatDate(cycle.period_start, { style: "long" }) : cycle.rooms?.room_number ?? "—"}
          {cycle.billing_type === "semester" ? " · Semester" : " · Monthly"}
        </p>
      </div>

      {/* Due date */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p style={{ fontSize: 12, color: isOverdue && !isPaidOrWaived ? "#DC2626" : "#8B7355", margin: 0 }}>
          Due {formatDate(cycle.due_date)}
        </p>
      </div>

      {/* Amount */}
      <div style={{ textAlign: "right", flexShrink: 0, minWidth: 90 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: "#1A1412", margin: 0, fontFamily: "'Playfair Display', serif" }}>
          {formatCurrency(total)}
        </p>
        {Number(cycle.late_fee) > 0 && (
          <p style={{ fontSize: 10, color: "#DC2626", margin: "1px 0 0" }}>
            incl. {formatCurrency(cycle.late_fee)} late fee
          </p>
        )}
      </div>

      {/* Status badge */}
      <Badge variant={cycle.status} size="sm" style={{ flexShrink: 0 }} />

      {/* Pay button */}
      {!isPaidOrWaived && onPay && (
        <button
          onClick={e => { e.stopPropagation(); onPay(cycle); }}
          style={{
            background:   "#C5612C", color: "#fff",
            border:       "none", borderRadius: 999,
            padding:      "7px 14px", fontSize: 12, fontWeight: 600,
            cursor:       "pointer", flexShrink: 0, whiteSpace: "nowrap",
            transition:   "background 0.15s",
          }}
          onMouseOver={e => e.currentTarget.style.background = "#A84E22"}
          onMouseOut={e  => e.currentTarget.style.background = "#C5612C"}
        >
          Pay Now
        </button>
      )}
    </RowWrapper>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PaymentRow
//
// Props:
//   payment   — payment row from DB (with billing_cycles join)
//   showClient — boolean
// ─────────────────────────────────────────────────────────────────────────────
export function PaymentRow({ payment, showClient = false }) {
  const isConfirmed = payment.payment_status === "confirmed";

  return (
    <RowWrapper>
      {/* Icon */}
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: isConfirmed ? "#ECFDF5" : "#FEF2F2",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: isConfirmed ? "#059669" : "#DC2626",
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {isConfirmed
            ? <><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>
            : <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>
          }
        </svg>
      </div>

      {/* Method + client */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#1A1412", margin: 0 }}>
          {payment.payment_method === "mpesa" ? "M-Pesa" : payment.payment_method === "cash" ? "Cash" : payment.payment_method === "bank_transfer" ? "Bank Transfer" : "Other"}
          {payment.mpesa_receipt && <span style={{ fontSize: 11, color: "#8B7355", fontWeight: 400, marginLeft: 8 }}>{payment.mpesa_receipt}</span>}
        </p>
        <p style={{ fontSize: 12, color: "#8B7355", margin: "2px 0 0" }}>
          {showClient ? (payment.profiles?.full_name ?? "—") : formatRelativeTime(payment.created_at)}
          {payment.recorded_by && <span style={{ marginLeft: 6, color: "#C5612C" }}>· Manual</span>}
        </p>
      </div>

      {/* Amount */}
      <p style={{ fontSize: 15, fontWeight: 700, color: "#1A1412", margin: 0, fontFamily: "'Playfair Display', serif", flexShrink: 0 }}>
        {formatCurrency(payment.amount)}
      </p>

      {/* Status */}
      <Badge variant={payment.payment_status} size="sm" style={{ flexShrink: 0 }} />
    </RowWrapper>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ComplaintCard
//
// Props:
//   complaint — complaint row from DB
//   onView    — fn(complaint)
// ─────────────────────────────────────────────────────────────────────────────
export function ComplaintCard({ complaint, onView }) {
  const isUrgent = ["high", "urgent"].includes(complaint.priority);

  return (
    <div
      onClick={() => onView?.(complaint)}
      role="button"
      style={{
        background:   "#fff",
        borderRadius: 14,
        border:       `1px solid ${isUrgent ? "rgba(220,38,38,0.2)" : "#EDE4D8"}`,
        padding:      "14px 16px",
        cursor:       "pointer",
        transition:   "box-shadow 0.18s, transform 0.18s",
        boxShadow:    "0 2px 6px rgba(0,0,0,0.04)",
      }}
      onMouseOver={e => { e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.09)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseOut={e  => { e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.04)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: "#1A1412", margin: 0, lineHeight: 1.35, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {complaint.title}
        </p>
        <Badge variant={complaint.priority} size="sm" style={{ flexShrink: 0 }} />
      </div>

      {/* Description snippet */}
      <p style={{ fontSize: 13, color: "#5C4A3A", margin: "0 0 10px", lineHeight: 1.55, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
        {complaint.description}
      </p>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Avatar name={complaint.profiles?.full_name} src={complaint.profiles?.avatar_url} size="xs" />
          <span style={{ fontSize: 11, color: "#8B7355" }}>{complaint.profiles?.full_name ?? "Unknown"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: "#8B7355" }}>{formatRelativeTime(complaint.created_at)}</span>
          <Badge variant={complaint.status} size="sm" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NotificationItem
//
// Props:
//   notification — notification row from DB
//   onRead       — fn(id)
// ─────────────────────────────────────────────────────────────────────────────
const NOTIF_ICONS = {
  payment_confirmed: { path: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z", color: "#059669", bg: "#ECFDF5" },
  request_approved: { path: "M5 13l4 4L19 7", color: "#2563EB", bg: "#EFF6FF" },
  complaint_update: { path: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z", color: "#D97706", bg: "#FFFBEB" },
  payment_due:      { path: "M3 10h18M7 15h.01M11 15h2M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z", color: "#DC2626", bg: "#FEF2F2" },
  default:          { path: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9", color: "#C5612C", bg: "#FFF5EF" },
};

export function NotificationItem({ notification, onRead }) {
  const meta = NOTIF_ICONS[notification.type] ?? NOTIF_ICONS.default;

  return (
    <div
      style={{
        display:     "flex", alignItems: "flex-start", gap: 12,
        padding:     "12px 16px",
        background:  notification.is_read ? "#fff" : "#FFFDF9",
        borderLeft:  notification.is_read ? "2px solid transparent" : "2px solid #C5612C",
        transition:  "background 0.15s",
        cursor:      "default",
      }}
    >
      {/* Type icon */}
      <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", color: meta.color }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d={meta.path}/>
        </svg>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: notification.is_read ? 500 : 700, color: "#1A1412", margin: "0 0 2px", lineHeight: 1.4 }}>
          {notification.title}
        </p>
        {notification.body && (
          <p style={{ fontSize: 12, color: "#5C4A3A", margin: "0 0 4px", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {notification.body}
          </p>
        )}
        <p style={{ fontSize: 11, color: "#8B7355", margin: 0 }}>{formatRelativeTime(notification.created_at)}</p>
      </div>

      {/* Mark read button */}
      {!notification.is_read && onRead && (
        <button
          onClick={e => { e.stopPropagation(); onRead(notification.id); }}
          aria-label="Mark as read"
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#C5612C", flexShrink: 0, borderRadius: 6, transition: "background 0.15s" }}
          onMouseOver={e => e.currentTarget.style.background = "#FFF5EF"}
          onMouseOut={e  => e.currentTarget.style.background = "none"}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WorkerCard
//
// Props:
//   worker  — worker row from DB
//   onPay   — fn(worker)
//   onEdit  — fn(worker)
// ─────────────────────────────────────────────────────────────────────────────
export function WorkerCard({ worker, onPay, onEdit }) {
  const isActive = worker.status === "active";

  return (
    <div style={{
      background:   "#fff",
      borderRadius: 16,
      border:       "1px solid #EDE4D8",
      padding:      "16px 18px",
      display:      "flex",
      flexDirection:"column",
      gap:          12,
      boxShadow:    "0 1px 4px rgba(0,0,0,0.04)",
      transition:   "box-shadow 0.18s",
    }}
      onMouseOver={e => e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.08)"}
      onMouseOut={e  => e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar name={worker.full_name} size="md" />
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#1A1412", margin: 0 }}>{worker.full_name}</p>
            <p style={{ fontSize: 12, color: "#8B7355", margin: "2px 0 0", textTransform: "capitalize" }}>
              {worker.role.replace(/_/g, " ")}
            </p>
          </div>
        </div>
        <Badge variant={isActive ? "active" : worker.status} size="sm" />
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 16, paddingTop: 10, borderTop: "1px solid #F5EDE0" }}>
        <div>
          <p style={{ fontSize: 10, color: "#8B7355", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px" }}>Salary</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#1A1412", margin: 0, fontFamily: "'Playfair Display', serif" }}>
            {formatCurrency(worker.salary)}<span style={{ fontSize: 10, fontWeight: 400, color: "#8B7355" }}>/{worker.pay_cycle}</span>
          </p>
        </div>
        {worker.phone && (
          <div>
            <p style={{ fontSize: 10, color: "#8B7355", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px" }}>Phone</p>
            <p style={{ fontSize: 13, color: "#5C4A3A", margin: 0 }}>{worker.phone}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      {(onPay || onEdit) && (
        <div style={{ display: "flex", gap: 8 }}>
          {onEdit && (
            <button onClick={() => onEdit(worker)} style={{
              flex:1, padding:"8px", borderRadius:10, fontSize:12, fontWeight:600,
              background:"#fff", border:"1.5px solid #E8DDD4", color:"#5C4A3A", cursor:"pointer",
              transition:"all 0.15s",
            }}
              onMouseOver={e => { e.currentTarget.style.borderColor="#C5612C"; e.currentTarget.style.color="#C5612C"; }}
              onMouseOut={e  => { e.currentTarget.style.borderColor="#E8DDD4"; e.currentTarget.style.color="#5C4A3A"; }}
            >Edit</button>
          )}
          {onPay && isActive && (
            <button onClick={() => onPay(worker)} style={{
              flex:1, padding:"8px", borderRadius:10, fontSize:12, fontWeight:600,
              background:"#C5612C", border:"none", color:"#fff", cursor:"pointer",
              transition:"background 0.15s",
            }}
              onMouseOver={e => e.currentTarget.style.background="#A84E22"}
              onMouseOut={e  => e.currentTarget.style.background="#C5612C"}
            >Pay Salary</button>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RoomCard
//
// Compact room selection card used on request forms and manager room grids.
//
// Props:
//   room      — room row from DB
//   onSelect  — fn(room) — called on click
//   selected  — boolean
//   showBadge — boolean — show status badge (default true)
// ─────────────────────────────────────────────────────────────────────────────
export function RoomCard({ room, onSelect, selected = false, showBadge = true }) {
  const isAvailable = room.status === "available";

  return (
    <div
      onClick={() => isAvailable && onSelect?.(room)}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      style={{
        background:   "#fff",
        borderRadius: 14,
        border:       `2px solid ${selected ? "#C5612C" : isAvailable ? "#EDE4D8" : "#F0E8DE"}`,
        padding:      "14px 16px",
        cursor:       isAvailable ? "pointer" : "not-allowed",
        opacity:      isAvailable ? 1 : 0.55,
        transition:   "all 0.18s",
        boxShadow:    selected ? "0 4px 14px rgba(197,97,44,0.20)" : "0 1px 4px rgba(0,0,0,0.04)",
      }}
      onMouseOver={e => { if (isAvailable && !selected) e.currentTarget.style.borderColor = "#C5612C"; }}
      onMouseOut={e  => { if (!selected) e.currentTarget.style.borderColor = isAvailable ? "#EDE4D8" : "#F0E8DE"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: "#1A1412", margin: 0 }}>Room {room.room_number}</p>
        {showBadge && <Badge variant={room.status} size="sm" />}
      </div>
      <p style={{ fontSize: 12, color: "#8B7355", margin: "0 0 10px", textTransform: "capitalize" }}>
        {room.room_type?.replace(/_/g, " ")} · Capacity {room.capacity}
      </p>
      <p style={{ fontSize: 16, fontWeight: 700, color: "#C5612C", margin: 0, fontFamily: "'Playfair Display', serif" }}>
        {formatCurrency(room.monthly_price)}<span style={{ fontSize: 11, fontWeight: 400, color: "#8B7355" }}>/mo</span>
      </p>
    </div>
  );
}
