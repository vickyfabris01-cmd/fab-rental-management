// src/modules/adminNav.js — MODIFIED (Phase 3: Support inbox)
// The platform admin menu. Items without `element` open the ComingSoon page naming the phase.
import { lazy } from "react";

export const ADMIN_NAV = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard", path: "", end: true, phase: 1, element: lazy(() => import("../pages/admin/AdminDashboard.jsx")) },
  { id: "businesses", label: "Businesses", icon: "building", path: "businesses", phase: 1, element: lazy(() => import("../pages/admin/AdminBusinesses.jsx")) },
  { id: "users", label: "Users", icon: "users", path: "users", phase: 1, element: lazy(() => import("../pages/admin/AdminUsers.jsx")) },
  { id: "transactions", label: "Transactions", icon: "card", path: "transactions", phase: 5 },
  { id: "reports", label: "Reports", icon: "chart", path: "reports", phase: 5 },
  { id: "audit", label: "Audit log", icon: "file", path: "audit", phase: 5 },
  { id: "support", label: "Support", icon: "help", path: "support", phase: 3, element: lazy(() => import("../pages/help/AdminSupportPage.jsx")) },
  { id: "settings", label: "Settings", icon: "settings", path: "settings", phase: 1, element: lazy(() => import("../pages/admin/AdminSettings.jsx")) },
];
