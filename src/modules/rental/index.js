// src/modules/rental/index.js — MODIFIED FILE (Phase 2: the rental screens)
//
// The rental module's navigation. Phase 2 builds the owner and manager screens (dashboard,
// properties, requests, residents, tenancies, billing, payments, invoices, managers, settings).
// A resident gets their own menu; those screens are Phase 3 and open the ComingSoon page until then.
// Paths may repeat across roles ("" is the dashboard for staff and "My home" for residents):
// the shell picks the item whose roles include the person's role.

import { lazy } from "react";
import { registerModule } from "../registry.js";

const BOTH = ["owner", "manager"];
const OWNER = ["owner"];
const RESIDENT = ["resident"];
registerModule({
  type: "rental",
  label: "Rental",
  nav: [
    { id: "dashboard", label: "Dashboard", icon: "dashboard", path: "", end: true, phase: 1, roles: BOTH,
      element: lazy(() => import("../../pages/app/BusinessDashboard.jsx")) },
    { id: "properties", label: "Properties", icon: "building", path: "properties", phase: 2, roles: BOTH, element: lazy(() => import("../../pages/rental/PropertiesPage.jsx")) },
    { id: "rental-requests", label: "Rental requests", icon: "file", path: "rental-requests", phase: 2, roles: BOTH, element: lazy(() => import("../../pages/rental/RequestsPage.jsx")) },
    { id: "residents", label: "Residents", icon: "users", path: "residents", phase: 2, roles: BOTH, element: lazy(() => import("../../pages/rental/ResidentsPage.jsx")) },
    { id: "tenancies", label: "Tenancies", icon: "swap", path: "tenancies", phase: 2, roles: BOTH, element: lazy(() => import("../../pages/rental/TenanciesPage.jsx")) },
    { id: "billing", label: "Billing", icon: "card", path: "billing", phase: 2, roles: BOTH, element: lazy(() => import("../../pages/rental/BillingPage.jsx")) },
    { id: "payments", label: "Payments", icon: "card", path: "payments", phase: 2, roles: BOTH, element: lazy(() => import("../../pages/rental/PaymentsPage.jsx")) },
    { id: "invoices", label: "Invoices", icon: "file", path: "invoices", phase: 2, roles: BOTH, element: lazy(() => import("../../pages/rental/InvoicesPage.jsx")) },
    { id: "complaints", label: "Complaints", icon: "complaint", path: "complaints", phase: 3, roles: BOTH },
    { id: "workforce", label: "Workforce", icon: "user", path: "workforce", phase: 3, roles: BOTH },
    { id: "announcements", label: "Announcements", icon: "megaphone", path: "announcements", phase: 3, roles: BOTH },
    { id: "reports", label: "Reports", icon: "chart", path: "reports", phase: 4, roles: BOTH },
    { id: "managers", label: "Managers", icon: "users", path: "managers", phase: 2, roles: OWNER, element: lazy(() => import("../../pages/rental/ManagersPage.jsx")) },
    { id: "settings", label: "Settings", icon: "settings", path: "settings", phase: 2, roles: OWNER, element: lazy(() => import("../../pages/rental/SettingsPage.jsx")) },

    // Resident menu: built in Phase 3 (home, own invoices and M-Pesa payment, complaints, notices).
    { id: "resident-home", label: "My home", icon: "home", path: "", end: true, phase: 3, roles: RESIDENT },
    { id: "resident-invoices", label: "My invoices", icon: "file", path: "my-invoices", phase: 3, roles: RESIDENT },
    { id: "resident-complaints", label: "Complaints", icon: "complaint", path: "my-complaints", phase: 3, roles: RESIDENT },
    { id: "resident-notices", label: "Notices", icon: "megaphone", path: "notices", phase: 3, roles: RESIDENT },
  ],
});

// Business types that are listed in onboarding but not open yet.
registerModule({ type: "agriculture", label: "Agriculture", nav: [] });
registerModule({ type: "shop", label: "Shop", nav: [] });
