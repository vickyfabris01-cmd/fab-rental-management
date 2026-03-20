// =============================================================================
// router/routes.js
//
// Single source of truth for every route in the application.
//
// Two things live here:
//
//   1. ROUTES  — path string constants (re-exported from config/constants.js).
//                Import these everywhere instead of writing "/manage/billing"
//                inline — avoids magic strings and makes refactors trivial.
//
//   2. ROUTE_META — metadata map keyed by path pattern.
//                   AppRouter uses this to configure <RequireAuth> /
//                   <RequireRole> without duplicating role lists.
//                   Each entry describes: allowedRoles, pageTitle, isPublic.
//
// Usage:
//   import { ROUTES }      from "../router/routes";
//   import { ROUTE_META }  from "../router/routes";
//
//   <Link to={ROUTES.MANAGER_BILLING}>Billing</Link>
//   navigate(ROUTES.MANAGER_RESIDENT(residentId))
// =============================================================================

export { ROUTES } from "../config/constants";

import { ROLES } from "../config/constants";

// ─────────────────────────────────────────────────────────────────────────────
// Role shorthand sets
// ─────────────────────────────────────────────────────────────────────────────
const { VISITOR, CLIENT, MANAGER, OWNER, WORKER, SUPER_ADMIN } = ROLES;

const STAFF        = [MANAGER, OWNER];            // can see property management
const RESIDENTS    = [CLIENT];
const ALL_AUTHED   = [VISITOR, CLIENT, MANAGER, OWNER, WORKER, SUPER_ADMIN];
const ADMIN_ONLY   = [SUPER_ADMIN];

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE_META
//
// Keys must match the path patterns used in AppRouter exactly (with :param
// placeholders where needed).  The lookup in AppRouter strips the concrete id
// and re-uses the pattern key.
//
// Fields:
//   title        — document <title> set by AppRouter via useEffect
//   allowedRoles — array of role strings; empty array = any authenticated user
//   isPublic     — true means RequireAuth is NOT applied at all
// ─────────────────────────────────────────────────────────────────────────────
export const ROUTE_META = {
  // ── Public ────────────────────────────────────────────────────────────────
  "/":                          { title:"fabRentals — Rental Management",         isPublic:true  },
  "/browse":                    { title:"Browse Properties — fabRentals",         isPublic:true  },
  "/property/:slug":            { title:"Property — fabRentals",                  isPublic:true  },

  // ── Auth ──────────────────────────────────────────────────────────────────
  "/login":                     { title:"Sign In — fabRentals",                   isPublic:true  },
  "/signup":                    { title:"Create Account — fabRentals",            isPublic:true  },
  "/invite/:token":             { title:"Accept Invitation — fabRentals",         isPublic:true  },
  "/reset-password":            { title:"Reset Password — fabRentals",            isPublic:true  },

  // ── Client (resident) ─────────────────────────────────────────────────────
  "/dashboard":                 { title:"My Dashboard",        allowedRoles:[CLIENT]  },
  "/dashboard/room":            { title:"My Room",             allowedRoles:[CLIENT]  },
  "/dashboard/billing":         { title:"My Billing",          allowedRoles:[CLIENT]  },
  "/dashboard/payments":        { title:"My Payments",         allowedRoles:[CLIENT]  },
  "/dashboard/transfer-request":{ title:"Transfer Request",    allowedRoles:[CLIENT]  },
  "/dashboard/complaints":      { title:"My Complaints",       allowedRoles:[CLIENT]  },
  "/dashboard/complaints/:id":  { title:"Complaint",           allowedRoles:[CLIENT]  },
  "/dashboard/notifications":   { title:"Notifications",       allowedRoles:[CLIENT]  },
  "/dashboard/profile":         { title:"My Profile",          allowedRoles:[CLIENT]  },

  // ── Manager ───────────────────────────────────────────────────────────────
  "/manage":                        { title:"Manager Dashboard",    allowedRoles:[MANAGER] },
  "/manage/properties":             { title:"Properties",           allowedRoles:[MANAGER] },
  "/manage/residents":              { title:"Residents",            allowedRoles:[MANAGER] },
  "/manage/residents/:id":          { title:"Resident",             allowedRoles:[MANAGER] },
  "/manage/residents/requests":     { title:"Rental Requests",      allowedRoles:[MANAGER] },
  "/manage/residents/tenancies":    { title:"Tenancies",            allowedRoles:[MANAGER] },
  "/manage/billing/cycles":         { title:"Billing Cycles",       allowedRoles:[MANAGER] },
  "/manage/billing/payments":       { title:"Payment Records",      allowedRoles:[MANAGER] },
  "/manage/billing/invoices":       { title:"Invoices",             allowedRoles:[MANAGER] },
  "/manage/workforce/workers":      { title:"Workforce",            allowedRoles:[MANAGER] },
  "/manage/workforce/salaries":     { title:"Salaries",             allowedRoles:[MANAGER] },
  "/manage/workforce/attendance":   { title:"Attendance",           allowedRoles:[MANAGER] },
  "/manage/complaints":             { title:"Complaints",           allowedRoles:[MANAGER] },
  "/manage/announcements":          { title:"Announcements",        allowedRoles:[MANAGER] },
  "/manage/settings":               { title:"Settings",             allowedRoles:[MANAGER] },
  "/manage/profile":                { title:"My Profile",           allowedRoles:[MANAGER] },

  // ── Owner ─────────────────────────────────────────────────────────────────
  "/owner":             { title:"Owner Dashboard",     allowedRoles:[OWNER] },
  "/owner/occupancy":   { title:"Occupancy Report",    allowedRoles:[OWNER] },
  "/owner/financials":  { title:"Financial Summary",   allowedRoles:[OWNER] },
  "/owner/billing":     { title:"Billing Overview",    allowedRoles:[OWNER] },
  "/owner/workforce":   { title:"Worker Costs",        allowedRoles:[OWNER] },
  "/owner/analytics":   { title:"Analytics",           allowedRoles:[OWNER] },

  // ── Worker ────────────────────────────────────────────────────────────────
  "/worker":             { title:"My Dashboard",      allowedRoles:[WORKER] },
  "/worker/payments":    { title:"Salary History",    allowedRoles:[WORKER] },
  "/worker/attendance":  { title:"My Attendance",     allowedRoles:[WORKER] },
  "/worker/profile":     { title:"My Profile",        allowedRoles:[WORKER] },

  // ── Super Admin ───────────────────────────────────────────────────────────
  "/admin":              { title:"Platform Overview",    allowedRoles:ADMIN_ONLY },
  "/admin/tenants":      { title:"Tenants",              allowedRoles:ADMIN_ONLY },
  "/admin/tenants/:id":  { title:"Tenant Detail",        allowedRoles:ADMIN_ONLY },
  "/admin/users":        { title:"All Users",            allowedRoles:ADMIN_ONLY },
  "/admin/revenue":      { title:"Platform Revenue",     allowedRoles:ADMIN_ONLY },
  "/admin/analytics":    { title:"Platform Analytics",   allowedRoles:ADMIN_ONLY },
  "/admin/settings":     { title:"Platform Settings",    allowedRoles:ADMIN_ONLY },
  "/admin/audit":        { title:"Audit Logs",           allowedRoles:ADMIN_ONLY },
};
