// src/modules/rental/index.js — NEW FILE
//
// The rental module's navigation. Phase 1 builds only the dashboard (getting-started
// checklist); every other item opens the ComingSoon page naming its phase. Phase 2 owners
// replace `element` for their items — nothing else in the app has to change.

import { lazy } from "react";
import { registerModule } from "../registry.js";

const BOTH = ["owner", "manager"];
const OWNER = ["owner"];

registerModule({
  type: "rental",
  label: "Rental",
  nav: [
    { id: "dashboard", label: "Dashboard", icon: "dashboard", path: "", end: true, phase: 1, roles: BOTH,
      element: lazy(() => import("../../pages/app/BusinessDashboard.jsx")) },
    { id: "properties", label: "Properties", icon: "building", path: "properties", phase: 2, roles: BOTH },
    { id: "rental-requests", label: "Rental requests", icon: "file", path: "rental-requests", phase: 2, roles: BOTH },
    { id: "residents", label: "Residents", icon: "users", path: "residents", phase: 2, roles: BOTH },
    { id: "tenancies", label: "Tenancies", icon: "swap", path: "tenancies", phase: 2, roles: BOTH },
    { id: "billing", label: "Billing", icon: "card", path: "billing", phase: 2, roles: BOTH },
    { id: "payments", label: "Payments", icon: "card", path: "payments", phase: 2, roles: BOTH },
    { id: "invoices", label: "Invoices", icon: "file", path: "invoices", phase: 2, roles: BOTH },
    { id: "complaints", label: "Complaints", icon: "complaint", path: "complaints", phase: 3, roles: BOTH },
    { id: "workforce", label: "Workforce", icon: "user", path: "workforce", phase: 3, roles: BOTH },
    { id: "announcements", label: "Announcements", icon: "megaphone", path: "announcements", phase: 3, roles: BOTH },
    { id: "reports", label: "Reports", icon: "chart", path: "reports", phase: 4, roles: BOTH },
    { id: "managers", label: "Managers", icon: "users", path: "managers", phase: 2, roles: OWNER },
    { id: "settings", label: "Settings", icon: "settings", path: "settings", phase: 2, roles: OWNER },
  ],
});

// Business types that are listed in onboarding but not open yet.
registerModule({ type: "agriculture", label: "Agriculture", nav: [] });
registerModule({ type: "shop", label: "Shop", nav: [] });
