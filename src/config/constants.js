// =============================================================================
// src/config/constants.js
// App-wide constants for fab-rental-management.
// Import what you need — nothing here has side effects.
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────────────────

/** Base URL of the FastAPI backend. Always use this — never hard-code URLs. */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

/** M-Pesa STK Push endpoint (relative to API_BASE_URL) */
export const MPESA_STK_ENDPOINT = "/payments/mpesa/stk-push";

// ─────────────────────────────────────────────────────────────────────────────
// Application identity
// ─────────────────────────────────────────────────────────────────────────────
export const APP_NAME        = "fabrentals";
export const APP_DISPLAY_NAME= "fabRentals";
export const APP_TAGLINE     = "Kenya's Rental Management Platform";
export const APP_SUPPORT_EMAIL = "support@fabrentals.co.ke";
export const APP_WEBSITE     = "https://fabrentals.co.ke";

// ─────────────────────────────────────────────────────────────────────────────
// User roles
// Must match the CHECK constraint in the `profiles` table.
// ─────────────────────────────────────────────────────────────────────────────
export const ROLES = {
  VISITOR:     "visitor",
  CLIENT:      "client",
  MANAGER:     "manager",
  OWNER:       "owner",
  WORKER:      "worker",
  SUPER_ADMIN: "super_admin",
};

/** Human-readable role labels */
export const ROLE_LABELS = {
  [ROLES.VISITOR]:     "Visitor",
  [ROLES.CLIENT]:      "Resident",
  [ROLES.MANAGER]:     "Property Manager",
  [ROLES.OWNER]:       "Property Owner",
  [ROLES.WORKER]:      "Worker / Staff",
  [ROLES.SUPER_ADMIN]: "Super Admin",
};

/** Badge colours for role chips (Tailwind classes) */
export const ROLE_COLORS = {
  [ROLES.VISITOR]:     { bg: "bg-stone-100",   text: "text-stone-600" },
  [ROLES.CLIENT]:      { bg: "bg-blue-50",     text: "text-blue-700"  },
  [ROLES.MANAGER]:     { bg: "bg-amber-50",    text: "text-amber-700" },
  [ROLES.OWNER]:       { bg: "bg-purple-50",   text: "text-purple-700"},
  [ROLES.WORKER]:      { bg: "bg-teal-50",     text: "text-teal-700"  },
  [ROLES.SUPER_ADMIN]: { bg: "bg-red-50",      text: "text-red-700"   },
};

// ─────────────────────────────────────────────────────────────────────────────
// Role → home route
// Mirrors the ROLE_HOME map in App.jsx — keep them in sync.
// ─────────────────────────────────────────────────────────────────────────────
export const ROLE_HOME = {
  [ROLES.VISITOR]:     "/browse",
  [ROLES.CLIENT]:      "/dashboard",
  [ROLES.MANAGER]:     "/manage",
  [ROLES.OWNER]:       "/owner",
  [ROLES.WORKER]:      "/worker",
  [ROLES.SUPER_ADMIN]: "/admin",
};

// ─────────────────────────────────────────────────────────────────────────────
// Routes
// Central route registry — use these instead of typing strings everywhere.
// ─────────────────────────────────────────────────────────────────────────────
export const ROUTES = {
  // Public
  HOME:            "/",
  BROWSE:          "/browse",
  PROPERTY:        (slug) => `/property/${slug}`,

  // Auth
  LOGIN:           "/login",
  SIGNUP:          "/signup",
  ACCEPT_INVITE:   (token) => `/invite/${token}`,
  RESET_PASSWORD:  "/reset-password",

  // Client (resident)
  CLIENT_DASHBOARD:  "/dashboard",
  CLIENT_ROOM:       "/dashboard/room",
  CLIENT_BILLING:    "/dashboard/billing",
  CLIENT_PAYMENTS:   "/dashboard/payments",
  CLIENT_TRANSFER:   "/dashboard/transfer-request",
  CLIENT_COMPLAINTS: "/dashboard/complaints",
  CLIENT_COMPLAINT:  (id) => `/dashboard/complaints/${id}`,
  CLIENT_NOTIFS:     "/dashboard/notifications",
  CLIENT_PROFILE:    "/dashboard/profile",

  // Manager
  MANAGER_DASHBOARD:  "/manage",
  MANAGER_PROPERTIES: "/manage/properties",
  MANAGER_RESIDENTS:  "/manage/residents",
  MANAGER_RESIDENT:   (id) => `/manage/residents/${id}`,
  MANAGER_REQUESTS:   "/manage/residents/requests",
  MANAGER_TENANCIES:  "/manage/residents/tenancies",
  MANAGER_BILLING:    "/manage/billing/cycles",
  MANAGER_PAYMENTS:   "/manage/billing/payments",
  MANAGER_INVOICES:   "/manage/billing/invoices",
  MANAGER_WORKERS:    "/manage/workforce/workers",
  MANAGER_SALARIES:   "/manage/workforce/salaries",
  MANAGER_ATTENDANCE: "/manage/workforce/attendance",
  MANAGER_COMPLAINTS: "/manage/complaints",
  MANAGER_ANNOUNCEMENTS:"/manage/announcements",
  MANAGER_SETTINGS:   "/manage/settings",
  MANAGER_PROFILE:    "/manage/profile",

  // Owner
  OWNER_DASHBOARD:  "/owner",
  OWNER_OCCUPANCY:  "/owner/occupancy",
  OWNER_FINANCIALS: "/owner/financials",
  OWNER_BILLING:    "/owner/billing",
  OWNER_WORKFORCE:  "/owner/workforce",
  OWNER_ANALYTICS:  "/owner/analytics",

  // Super Admin
  ADMIN_DASHBOARD: "/admin",
  ADMIN_TENANTS:   "/admin/tenants",
  ADMIN_TENANT:    (id) => `/admin/tenants/${id}`,
  ADMIN_USERS:     "/admin/users",
  ADMIN_REVENUE:   "/admin/revenue",
  ADMIN_ANALYTICS: "/admin/analytics",
  ADMIN_SETTINGS:  "/admin/settings",
  ADMIN_AUDIT:     "/admin/audit",

  // Worker
  WORKER_DASHBOARD:  "/worker",
  WORKER_PAYMENTS:   "/worker/payments",
  WORKER_ATTENDANCE: "/worker/attendance",
  WORKER_PROFILE:    "/worker/profile",
};

// ─────────────────────────────────────────────────────────────────────────────
// Tenant status
// ─────────────────────────────────────────────────────────────────────────────
export const TENANT_STATUS = {
  PENDING:   "pending",
  ACTIVE:    "active",
  SUSPENDED: "suspended",
};

export const TENANT_STATUS_LABELS = {
  [TENANT_STATUS.PENDING]:   "Pending Review",
  [TENANT_STATUS.ACTIVE]:    "Active",
  [TENANT_STATUS.SUSPENDED]: "Suspended",
};

export const TENANT_STATUS_COLORS = {
  [TENANT_STATUS.PENDING]:   { bg: "bg-amber-50",   text: "text-amber-700",  dot: "bg-amber-400" },
  [TENANT_STATUS.ACTIVE]:    { bg: "bg-emerald-50", text: "text-emerald-700",dot: "bg-emerald-500"},
  [TENANT_STATUS.SUSPENDED]: { bg: "bg-red-50",     text: "text-red-700",    dot: "bg-red-400"   },
};

// ─────────────────────────────────────────────────────────────────────────────
// Property types
// ─────────────────────────────────────────────────────────────────────────────
export const PROPERTY_TYPES = [
  "Hostel",
  "Apartment",
  "Student Residence",
  "Farm Housing",
  "Bedsitter",
  "Single Room",
  "Service Apartment",
];

// ─────────────────────────────────────────────────────────────────────────────
// Room status
// ─────────────────────────────────────────────────────────────────────────────
export const ROOM_STATUS = {
  AVAILABLE:   "available",
  OCCUPIED:    "occupied",
  MAINTENANCE: "maintenance",
  RESERVED:    "reserved",
};

export const ROOM_STATUS_LABELS = {
  [ROOM_STATUS.AVAILABLE]:   "Available",
  [ROOM_STATUS.OCCUPIED]:    "Occupied",
  [ROOM_STATUS.MAINTENANCE]: "Under Maintenance",
  [ROOM_STATUS.RESERVED]:    "Reserved",
};

export const ROOM_STATUS_COLORS = {
  [ROOM_STATUS.AVAILABLE]:   { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  [ROOM_STATUS.OCCUPIED]:    { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500"    },
  [ROOM_STATUS.MAINTENANCE]: { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400"   },
  [ROOM_STATUS.RESERVED]:    { bg: "bg-purple-50",  text: "text-purple-700",  dot: "bg-purple-400"  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Rental request status
// ─────────────────────────────────────────────────────────────────────────────
export const REQUEST_STATUS = {
  PENDING:  "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  EXPIRED:  "expired",
};

export const REQUEST_STATUS_LABELS = {
  [REQUEST_STATUS.PENDING]:  "Pending",
  [REQUEST_STATUS.APPROVED]: "Approved",
  [REQUEST_STATUS.REJECTED]: "Rejected",
  [REQUEST_STATUS.EXPIRED]:  "Expired",
};

export const REQUEST_STATUS_COLORS = {
  [REQUEST_STATUS.PENDING]:  { bg: "bg-amber-50",   text: "text-amber-700"   },
  [REQUEST_STATUS.APPROVED]: { bg: "bg-emerald-50", text: "text-emerald-700" },
  [REQUEST_STATUS.REJECTED]: { bg: "bg-red-50",     text: "text-red-700"     },
  [REQUEST_STATUS.EXPIRED]:  { bg: "bg-stone-100",  text: "text-stone-500"   },
};

// ─────────────────────────────────────────────────────────────────────────────
// Tenancy status
// ─────────────────────────────────────────────────────────────────────────────
export const TENANCY_STATUS = {
  ACTIVE:      "active",
  COMPLETED:   "completed",
  TERMINATED:  "terminated",
  PENDING:     "pending",
};

export const TENANCY_STATUS_LABELS = {
  [TENANCY_STATUS.ACTIVE]:     "Active",
  [TENANCY_STATUS.COMPLETED]:  "Completed",
  [TENANCY_STATUS.TERMINATED]: "Terminated",
  [TENANCY_STATUS.PENDING]:    "Pending Move-in",
};

export const TENANCY_STATUS_COLORS = {
  [TENANCY_STATUS.ACTIVE]:     { bg: "bg-emerald-50", text: "text-emerald-700" },
  [TENANCY_STATUS.COMPLETED]:  { bg: "bg-stone-100",  text: "text-stone-600"   },
  [TENANCY_STATUS.TERMINATED]: { bg: "bg-red-50",     text: "text-red-700"     },
  [TENANCY_STATUS.PENDING]:    { bg: "bg-amber-50",   text: "text-amber-700"   },
};

// ─────────────────────────────────────────────────────────────────────────────
// Billing cycle status
// ─────────────────────────────────────────────────────────────────────────────
export const BILLING_STATUS = {
  UNPAID:    "unpaid",
  PARTIAL:   "partial",
  PAID:      "paid",
  OVERDUE:   "overdue",
  WAIVED:    "waived",
  CANCELLED: "cancelled",
};

export const BILLING_STATUS_LABELS = {
  [BILLING_STATUS.UNPAID]:    "Unpaid",
  [BILLING_STATUS.PARTIAL]:   "Partially Paid",
  [BILLING_STATUS.PAID]:      "Paid",
  [BILLING_STATUS.OVERDUE]:   "Overdue",
  [BILLING_STATUS.WAIVED]:    "Waived",
  [BILLING_STATUS.CANCELLED]: "Cancelled",
};

export const BILLING_STATUS_COLORS = {
  [BILLING_STATUS.UNPAID]:    { bg: "bg-amber-50",   text: "text-amber-700"   },
  [BILLING_STATUS.PARTIAL]:   { bg: "bg-blue-50",    text: "text-blue-700"    },
  [BILLING_STATUS.PAID]:      { bg: "bg-emerald-50", text: "text-emerald-700" },
  [BILLING_STATUS.OVERDUE]:   { bg: "bg-red-50",     text: "text-red-700"     },
  [BILLING_STATUS.WAIVED]:    { bg: "bg-purple-50",  text: "text-purple-700"  },
  [BILLING_STATUS.CANCELLED]: { bg: "bg-stone-100",  text: "text-stone-500"   },
};

// ─────────────────────────────────────────────────────────────────────────────
// Payment methods & status
// ─────────────────────────────────────────────────────────────────────────────
export const PAYMENT_METHODS = {
  MPESA:         "mpesa",
  CASH:          "cash",
  BANK_TRANSFER: "bank_transfer",
  OTHER:         "other",
};

export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHODS.MPESA]:         "M-Pesa",
  [PAYMENT_METHODS.CASH]:          "Cash",
  [PAYMENT_METHODS.BANK_TRANSFER]: "Bank Transfer",
  [PAYMENT_METHODS.OTHER]:         "Other",
};

export const PAYMENT_METHOD_ICONS = {
  [PAYMENT_METHODS.MPESA]:         "📱",
  [PAYMENT_METHODS.CASH]:          "💵",
  [PAYMENT_METHODS.BANK_TRANSFER]: "🏦",
  [PAYMENT_METHODS.OTHER]:         "💳",
};

export const PAYMENT_STATUS = {
  PENDING:   "pending",
  CONFIRMED: "confirmed",
  FAILED:    "failed",
  REVERSED:  "reversed",
};

export const PAYMENT_STATUS_LABELS = {
  [PAYMENT_STATUS.PENDING]:   "Pending",
  [PAYMENT_STATUS.CONFIRMED]: "Confirmed",
  [PAYMENT_STATUS.FAILED]:    "Failed",
  [PAYMENT_STATUS.REVERSED]:  "Reversed",
};

export const PAYMENT_STATUS_COLORS = {
  [PAYMENT_STATUS.PENDING]:   { bg: "bg-amber-50",   text: "text-amber-700"   },
  [PAYMENT_STATUS.CONFIRMED]: { bg: "bg-emerald-50", text: "text-emerald-700" },
  [PAYMENT_STATUS.FAILED]:    { bg: "bg-red-50",     text: "text-red-700"     },
  [PAYMENT_STATUS.REVERSED]:  { bg: "bg-stone-100",  text: "text-stone-500"   },
};

// ─────────────────────────────────────────────────────────────────────────────
// Billing type
// ─────────────────────────────────────────────────────────────────────────────
export const BILLING_TYPES = {
  MONTHLY:  "monthly",
  SEMESTER: "semester",
};

export const BILLING_TYPE_LABELS = {
  [BILLING_TYPES.MONTHLY]:  "Monthly",
  [BILLING_TYPES.SEMESTER]: "Semester (6 months)",
};

// ─────────────────────────────────────────────────────────────────────────────
// Complaint status & priority
// ─────────────────────────────────────────────────────────────────────────────
export const COMPLAINT_STATUS = {
  OPEN:        "open",
  IN_PROGRESS: "in_progress",
  RESOLVED:    "resolved",
  CLOSED:      "closed",
};

export const COMPLAINT_STATUS_LABELS = {
  [COMPLAINT_STATUS.OPEN]:        "Open",
  [COMPLAINT_STATUS.IN_PROGRESS]: "In Progress",
  [COMPLAINT_STATUS.RESOLVED]:    "Resolved",
  [COMPLAINT_STATUS.CLOSED]:      "Closed",
};

export const COMPLAINT_STATUS_COLORS = {
  [COMPLAINT_STATUS.OPEN]:        { bg: "bg-red-50",     text: "text-red-700"     },
  [COMPLAINT_STATUS.IN_PROGRESS]: { bg: "bg-amber-50",   text: "text-amber-700"   },
  [COMPLAINT_STATUS.RESOLVED]:    { bg: "bg-emerald-50", text: "text-emerald-700" },
  [COMPLAINT_STATUS.CLOSED]:      { bg: "bg-stone-100",  text: "text-stone-500"   },
};

export const COMPLAINT_PRIORITY = {
  LOW:    "low",
  NORMAL: "normal",
  HIGH:   "high",
  URGENT: "urgent",
};

export const COMPLAINT_PRIORITY_LABELS = {
  [COMPLAINT_PRIORITY.LOW]:    "Low",
  [COMPLAINT_PRIORITY.NORMAL]: "Normal",
  [COMPLAINT_PRIORITY.HIGH]:   "High",
  [COMPLAINT_PRIORITY.URGENT]: "Urgent",
};

export const COMPLAINT_PRIORITY_COLORS = {
  [COMPLAINT_PRIORITY.LOW]:    { bg: "bg-stone-100",  text: "text-stone-600"   },
  [COMPLAINT_PRIORITY.NORMAL]: { bg: "bg-blue-50",    text: "text-blue-700"    },
  [COMPLAINT_PRIORITY.HIGH]:   { bg: "bg-amber-50",   text: "text-amber-700"   },
  [COMPLAINT_PRIORITY.URGENT]: { bg: "bg-red-50",     text: "text-red-700"     },
};

// ─────────────────────────────────────────────────────────────────────────────
// Worker status & attendance
// ─────────────────────────────────────────────────────────────────────────────
export const WORKER_STATUS = {
  ACTIVE:     "active",
  INACTIVE:   "inactive",
  TERMINATED: "terminated",
};

export const WORKER_STATUS_LABELS = {
  [WORKER_STATUS.ACTIVE]:     "Active",
  [WORKER_STATUS.INACTIVE]:   "Inactive",
  [WORKER_STATUS.TERMINATED]: "Terminated",
};

export const ATTENDANCE_STATUS = {
  PRESENT:  "present",
  ABSENT:   "absent",
  HALF_DAY: "half_day",
  LEAVE:    "leave",
};

export const ATTENDANCE_STATUS_LABELS = {
  [ATTENDANCE_STATUS.PRESENT]:  "Present",
  [ATTENDANCE_STATUS.ABSENT]:   "Absent",
  [ATTENDANCE_STATUS.HALF_DAY]: "Half Day",
  [ATTENDANCE_STATUS.LEAVE]:    "On Leave",
};

export const ATTENDANCE_STATUS_COLORS = {
  [ATTENDANCE_STATUS.PRESENT]:  { bg: "bg-emerald-100", text: "text-emerald-700" },
  [ATTENDANCE_STATUS.ABSENT]:   { bg: "bg-red-100",     text: "text-red-700"     },
  [ATTENDANCE_STATUS.HALF_DAY]: { bg: "bg-amber-100",   text: "text-amber-700"   },
  [ATTENDANCE_STATUS.LEAVE]:    { bg: "bg-blue-100",    text: "text-blue-700"    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────────────────────────────────────
export const PAGE_SIZES = {
  DEFAULT:  20,
  COMPACT:  10,
  LARGE:    50,
};

// ─────────────────────────────────────────────────────────────────────────────
// Currency & locale
// ─────────────────────────────────────────────────────────────────────────────
export const CURRENCY      = "KES";
export const CURRENCY_LOCALE= "en-KE";
export const PHONE_PREFIX  = "+254";
export const COUNTRY_CODE  = "KE";

/** Format a number as KES — e.g. formatKES(8500) → "KES 8,500" */
export function formatKES(amount) {
  if (amount == null) return "—";
  return `${CURRENCY} ${Number(amount).toLocaleString(CURRENCY_LOCALE)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Kenyan counties — used in address / location forms
// ─────────────────────────────────────────────────────────────────────────────
export const KE_COUNTIES = [
  "Baringo","Bomet","Bungoma","Busia","Elgeyo-Marakwet","Embu",
  "Garissa","Homa Bay","Isiolo","Kajiado","Kakamega","Kericho",
  "Kiambu","Kilifi","Kirinyaga","Kisii","Kisumu","Kitui","Kwale",
  "Laikipia","Lamu","Machakos","Makueni","Mandera","Marsabit",
  "Meru","Migori","Mombasa","Murang'a","Nairobi","Nakuru","Nandi",
  "Narok","Nyamira","Nyandarua","Nyeri","Samburu","Siaya",
  "Taita-Taveta","Tana River","Tharaka-Nithi","Trans Nzoia",
  "Turkana","Uasin Gishu","Vihiga","Wajir","West Pokot",
];

// ─────────────────────────────────────────────────────────────────────────────
// Nairobi sub-locations — shortlist for property search
// ─────────────────────────────────────────────────────────────────────────────
export const NAIROBI_AREAS = [
  "Westlands","Kilimani","Lavington","Karen","Langata",
  "South B","South C","Eastleigh","Kasarani","Ruaka",
  "Kahawa","Ngara","Upperhill","Hurlingham","Kileleshwa",
  "Parklands","Spring Valley","Runda","Muthaiga","Gigiri",
  "Mlolongo","Rongai","Thika Road","Syokimau","Embakasi",
];

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens (JS mirror of Tailwind config)
// Use these in inline styles or Recharts where Tailwind classes don't apply.
// ─────────────────────────────────────────────────────────────────────────────
export const COLORS = {
  brand:       "#C5612C",
  brandDark:   "#A84E22",
  brandLight:  "#FFF5EF",
  surface:     "#FAF7F2",
  card:        "#FFFFFF",
  muted:       "#F5EDE0",
  border:      "#E8DDD4",
  ink:         "#1A1412",
  inkMuted:    "#5C4A3A",
  inkSubtle:   "#8B7355",
  darkBg:      "#1A1412",
  darkSurface: "#2D1E16",
  success:     "#10B981",
  warning:     "#F59E0B",
  error:       "#EF4444",
  info:        "#3B82F6",
};

/** Chart colour palette — used in Recharts / D3 across all dashboards */
export const CHART_COLORS = [
  COLORS.brand,
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
];

// ─────────────────────────────────────────────────────────────────────────────
// M-Pesa
// ─────────────────────────────────────────────────────────────────────────────
export const MPESA_PAYBILL   = import.meta.env.VITE_MPESA_PAYBILL ?? "000000";
export const MPESA_SHORTCODE = import.meta.env.VITE_MPESA_SHORTCODE ?? "000000";

// ─────────────────────────────────────────────────────────────────────────────
// Invite expiry
// ─────────────────────────────────────────────────────────────────────────────
/** Manager invite link lifetime in hours */
export const INVITE_EXPIRY_HOURS = 48;

/** Password reset link lifetime in minutes */
export const RESET_LINK_EXPIRY_MINUTES = 60;

// ─────────────────────────────────────────────────────────────────────────────
// Realtime subscription table names
// Use these with realtimeChannel() in useRealtime hook
// ─────────────────────────────────────────────────────────────────────────────
export const REALTIME_TABLES = {
  PAYMENTS:        "payments",
  NOTIFICATIONS:   "notifications",
  RENTAL_REQUESTS: "rental_requests",
  COMPLAINT_MSGS:  "complaint_messages",
  BILLING_CYCLES:  "billing_cycles",
  TENANCIES:       "tenancies",
};

// ─────────────────────────────────────────────────────────────────────────────
// Local storage keys
// Centralised to avoid key collisions between stores.
// ─────────────────────────────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  THEME:           "fabrentals_theme",
  SIDEBAR_OPEN:    "fabrentals_sidebar",
  LAST_ROLE:       "fabrentals_last_role",
  NOTIFICATION_SEEN:"fabrentals_notif_seen",
};

// ─────────────────────────────────────────────────────────────────────────────
// Notification channels
// ─────────────────────────────────────────────────────────────────────────────
export const NOTIF_CHANNELS = {
  SMS:   "sms",
  EMAIL: "email",
  PUSH:  "push",
};

// ─────────────────────────────────────────────────────────────────────────────
// Date / time formats
// Used with date-fns or Intl.DateTimeFormat.
// ─────────────────────────────────────────────────────────────────────────────
export const DATE_FORMAT        = "dd MMM yyyy";          // 01 Jan 2025
export const DATE_FORMAT_SHORT  = "dd/MM/yyyy";           // 01/01/2025
export const DATETIME_FORMAT    = "dd MMM yyyy, HH:mm";   // 01 Jan 2025, 14:30
export const MONTH_FORMAT       = "MMMM yyyy";            // January 2025
export const TIME_FORMAT        = "HH:mm";                // 14:30
