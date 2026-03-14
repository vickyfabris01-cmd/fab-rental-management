// =============================================================================
// components/index.js
// Master barrel — import any component from "../../components"
//
// Usage:
//   import { Button, Badge, Modal, DataTable, StatsCard, TabBar } from "../../components";
// =============================================================================

// ── UI primitives ─────────────────────────────────────────────────────────────
export * from "./ui/index.js";

// ── Layout ────────────────────────────────────────────────────────────────────
export { default as PageHeader } from "./layout/PageHeader.jsx";

// ── Navigation ────────────────────────────────────────────────────────────────
export { TabBar, Pagination, Breadcrumb } from "./navigation/TabBar.jsx";

// ── Data display ─────────────────────────────────────────────────────────────
export { default as StatsCard }           from "./data/StatsCard.jsx";
export { default as DataTable }           from "./data/DataTable.jsx";
export {
  BillingCycleRow,
  PaymentRow,
  ComplaintCard,
  NotificationItem,
  WorkerCard,
  RoomCard,
}                                          from "./data/domain-cards.jsx";

// ── Modals & overlays ─────────────────────────────────────────────────────────
export { Modal, Drawer, ConfirmDialog }    from "./modals/Modal.jsx";

// ── Feedback ─────────────────────────────────────────────────────────────────
export { default as Toast, ToastContainer } from "./feedback/Toast.jsx";

// ── Charts (requires: npm install recharts) ───────────────────────────────────
export { RevenueChart, OccupancyChart, OccupancyTrendLine, PaymentMethodPie, BillingStatusDonut, GrowthLineChart, TrendSparkline, SparkBar } from "./charts/index.js";
