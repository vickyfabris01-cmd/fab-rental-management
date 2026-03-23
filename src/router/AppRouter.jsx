import { useEffect, Suspense, lazy } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import RequireAuth from "./RequireAuth";
import RequireRole from "./RequireRole";
import { ROUTE_META } from "./routes";
import useAuthStore from "../store/authStore";
import { PageErrorBoundary, WidgetErrorBoundary } from "../components/feedback/ErrorBoundary.jsx";
import useTenantStore from "../store/tenantStore";
import useNotificationStore from "../store/notificationStore";
import { ROLES, ROLE_HOME } from "../config/constants";

// =============================================================================
// Lazy imports — every page is code-split.
// Grouped by role/section to keep this file readable.
// =============================================================================

// ── Public ────────────────────────────────────────────────────────────────────
const PublicPage        = lazy(() => import("../pages/public/PublicPage.jsx"));
const BrowsePage        = lazy(() => import("../pages/public/BrowsePage.jsx"));
const PropertyDetailPage= lazy(() => import("../pages/public/PropertyDetailPage.jsx"));

// ── Auth ──────────────────────────────────────────────────────────────────────
const LoginPage         = lazy(() => import("../pages/auth/LoginPage.jsx"));
const SignupPage         = lazy(() => import("../pages/auth/SignupPage.jsx"));
const AcceptInvitePage   = lazy(() => import("../pages/auth/AcceptInvitePage.jsx"));
const ResetPasswordPage  = lazy(() => import("../pages/auth/ResetPasswordPage.jsx"));
const ConfirmPage        = lazy(() => import("../pages/auth/ConfirmPage.jsx"));

// ── Client (resident) ─────────────────────────────────────────────────────────
const ClientDashboard       = lazy(() => import("../pages/client/ClientDashboard.jsx"));
const MyRoomPage             = lazy(() => import("../pages/client/MyRoomPage.jsx"));
const BillingPage            = lazy(() => import("../pages/client/BillingPage.jsx"));
const PaymentsPage           = lazy(() => import("../pages/client/PaymentsPage.jsx"));
const TransferRequestPage    = lazy(() => import("../pages/client/TransferRequestPage.jsx"));
const ClientComplaintsPage   = lazy(() => import("../pages/client/ClientComplaintsPage.jsx"));
const ComplaintDetailPage    = lazy(() => import("../pages/client/ComplaintDetailPage.jsx"));
const NotificationsPage      = lazy(() => import("../pages/client/NotificationsPage.jsx"));
const ClientProfilePage      = lazy(() => import("../pages/client/ClientProfilePage.jsx"));

// ── Manager ───────────────────────────────────────────────────────────────────
const ManagerDashboard    = lazy(() => import("../pages/manager/ManagerDashboard.jsx"));
const PropertiesPage      = lazy(() => import("../pages/manager/PropertiesPage.jsx"));
// ResidentsPage.jsx exports 4 components as named exports
const ResidentsPage       = lazy(() => import("../pages/manager/ResidentsPage.jsx").then(m => ({ default: m.ResidentsPage       })));
const ResidentDetailPage  = lazy(() => import("../pages/manager/ResidentsPage.jsx").then(m => ({ default: m.ResidentDetailPage  })));
const RentalRequestsPage  = lazy(() => import("../pages/manager/ResidentsPage.jsx").then(m => ({ default: m.RentalRequestsPage  })));
const TenanciesPage       = lazy(() => import("../pages/manager/ResidentsPage.jsx").then(m => ({ default: m.TenanciesPage       })));
const ManagerBillingPage  = lazy(() => import("../pages/manager/ManagerBillingPage.jsx"));
const ManagerPaymentsPage = lazy(() => import("../pages/manager/ManagerPaymentsPage.jsx"));
const InvoicesPage        = lazy(() => import("../pages/manager/InvoicesPage.jsx"));
const WorkforcePage       = lazy(() => import("../pages/manager/WorkforcePage.jsx"));
const WorkerSalariesPage  = lazy(() => import("../pages/manager/WorkerSalariesPage.jsx"));
const AttendancePage      = lazy(() => import("../pages/manager/AttendancePage.jsx"));
const ManagerComplaintsPage= lazy(() => import("../pages/manager/ManagerComplaintsPage.jsx"));
const AnnouncementsPage   = lazy(() => import("../pages/manager/AnnouncementsPage.jsx"));
const ManagerSettingsPage = lazy(() => import("../pages/manager/ManagerSettingsPage.jsx"));
const ManagerProfilePage  = lazy(() => import("../pages/manager/ManagerProfilePage.jsx"));

// ── Owner ─────────────────────────────────────────────────────────────────────
const OwnerDashboard       = lazy(() => import("../pages/owner/OwnerDashboard.jsx"));
const OccupancyReportPage  = lazy(() => import("../pages/owner/OccupancyReportPage.jsx"));
const FinancialSummaryPage = lazy(() => import("../pages/owner/FinancialSummaryPage.jsx"));
const OwnerBillingPage     = lazy(() => import("../pages/owner/OwnerBillingPage.jsx"));
const WorkerCostsPage      = lazy(() => import("../pages/owner/WorkerCostsPage.jsx"));
const OwnerAnalyticsPage   = lazy(() => import("../pages/owner/AnalyticsPage.jsx"));

// ── Worker ────────────────────────────────────────────────────────────────────
const WorkerDashboard      = lazy(() => import("../pages/worker/WorkerDashboard.jsx"));
const WorkerPaymentsPage   = lazy(() => import("../pages/worker/WorkerPaymentsPage.jsx"));
const WorkerAttendancePage = lazy(() => import("../pages/worker/WorkerAttendancePage.jsx"));
const WorkerProfilePage    = lazy(() => import("../pages/worker/WorkerProfilePage.jsx"));

// ── Super Admin ───────────────────────────────────────────────────────────────
const SuperAdminDashboard  = lazy(() => import("../pages/admin/SuperAdminDashboard.jsx"));
const AdminTenantsPage     = lazy(() => import("../pages/admin/AdminTenantsPage.jsx"));
const TenantDetailPage     = lazy(() => import("../pages/admin/TenantDetailPage.jsx"));
const AdminUsersPage       = lazy(() => import("../pages/admin/AdminUsersPage.jsx"));
const AdminRevenuePage     = lazy(() => import("../pages/admin/AdminRevenuePage.jsx"));
const AdminAnalyticsPage   = lazy(() => import("../pages/admin/AdminAnalyticsPage.jsx"));
const AdminSettingsPage    = lazy(() => import("../pages/admin/AdminSettingsPage.jsx"));
const AdminAuditPage       = lazy(() => import("../pages/admin/AdminAuditPage.jsx"));

// =============================================================================
// Full-screen lazy fallback — same minimal spinner as RequireAuth
// =============================================================================
function PageSpinner() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
      height:"100dvh", background:"#FAF7F2" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:40, height:40, borderRadius:"50%", border:"3px solid #F5EDE0",
          borderTopColor:"#C5612C", animation:"spin 0.8s linear infinite", margin:"0 auto 14px" }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ fontSize:13, color:"#8B7355", margin:0 }}>Loading…</p>
      </div>
    </div>
  );
}

// =============================================================================
// Not Found page (inline — no lazy needed)
// =============================================================================
function NotFoundPage() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
      height:"100dvh", background:"#FAF7F2", fontFamily:"'DM Sans',system-ui,sans-serif",
      textAlign:"center", padding:24 }}>
      <div>
        <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:72,
          color:"#C5612C", margin:"0 0 8px", lineHeight:1 }}>404</p>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:24,
          color:"#1A1412", margin:"0 0 12px" }}>Page not found</h1>
        <p style={{ fontSize:14, color:"#8B7355", margin:"0 0 28px" }}>
          The page you're looking for doesn't exist or you don't have access to it.
        </p>
        <a href="/" style={{ display:"inline-block", background:"#C5612C", color:"#fff",
          textDecoration:"none", padding:"12px 28px", borderRadius:999, fontSize:14,
          fontWeight:600, transition:"background 0.15s" }}
          onMouseOver={e=>e.currentTarget.style.background="#A84E22"}
          onMouseOut={e=>e.currentTarget.style.background="#C5612C"}>
          Go home
        </a>
      </div>
    </div>
  );
}

// =============================================================================
// TitleSync
// Reads the current pathname, matches it to ROUTE_META, and sets document.title.
// Parametric paths like "/dashboard/complaints/abc-123" are matched by stripping
// the last segment and checking again.
// =============================================================================
function TitleSync() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;

    // Exact match first
    let meta = ROUTE_META[path];

    // Try replacing the last path segment with ":id" or ":slug"
    if (!meta) {
      const paramPatterns = [":id", ":slug", ":token"];
      for (const param of paramPatterns) {
        const stripped = path.replace(/\/[^/]+$/, `/${param}`);
        if (ROUTE_META[stripped]) { meta = ROUTE_META[stripped]; break; }
      }
    }

    document.title = meta?.title
      ? `${meta.title} — fabRentals`
      : "fabRentals";
  }, [location.pathname]);

  return null;
}

// =============================================================================
// AppLoader
//
// Called ONCE at the top of the component tree.
// Bootstraps the auth store (session check + listener), then loads tenant
// branding and notifications for authenticated users.
//
// We don't render a spinner here — RequireAuth handles loading state on
// protected routes.  Public pages (landing, browse) render immediately.
// =============================================================================
function AppLoader() {
  const init              = useAuthStore(s => s.init);
  const user              = useAuthStore(s => s.user);
  const profile           = useAuthStore(s => s.profile);
  const fetchTenant       = useTenantStore(s => s.fetchTenantData);
  const fetchNotifs       = useNotificationStore(s => s.fetchNotifications);
  const subscribeNotifs   = useNotificationStore(s => s.subscribeToNotifications);
  const unsubscribeNotifs = useNotificationStore(s => s.unsubscribeFromNotifications);

  // Bootstrap auth once — init() returns an unsubscribe cleanup fn
  useEffect(() => {
    let cleanup;
    init().then(fn => { cleanup = fn; });
    return () => { cleanup?.(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Once profile is available, hydrate tenant branding + notifications
  useEffect(() => {
    if (!user || !profile) return;

    // Hydrate tenant branding/settings (needed for DashboardLayout theming)
    if (profile.tenant_id) {
      fetchTenant(profile.tenant_id);
    }

    // Load existing notifications then subscribe to realtime new ones
    fetchNotifs(profile.id);
    subscribeNotifs(profile.id);

    // On unmount (sign-out / role change) clean up the realtime subscription
    return () => { unsubscribeNotifs(); };
  }, [user?.id, profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

// =============================================================================
// RoleRedirect
//
// Shown at "/" when a user IS authenticated — forwards them to their
// role-appropriate home dashboard instead of the public landing page.
// =============================================================================
function RoleRedirect() {
  const user    = useAuthStore(s => s.user);
  const profile = useAuthStore(s => s.profile);
  const loading = useAuthStore(s => s.loading);

  if (loading) return <PageSpinner />;

  if (user && profile) {
    const home = ROLE_HOME[profile.role] ?? "/browse";
    return <Navigate to={home} replace />;
  }

  // Not logged in — show the public landing page
  return <PublicPage />;
}

// =============================================================================
// AppRouter — the main route tree
// =============================================================================
export default function AppRouter() {
  return (
    <BrowserRouter>
      {/* Bootstrap + title sync — render before everything */}
      <AppLoader />

      <PageErrorBoundary route="application">
      <Suspense fallback={<PageSpinner />}>
        <Routes>
          {/* ── Title tracker ─────────────────────────────────────────── */}
          <Route path="*" element={<TitleSync />} />

          {/* ── Root: redirect logged-in users, show landing for guests ── */}
          <Route path="/" element={<RoleRedirect />} />

          {/* ── Public (no auth required) ─────────────────────────────── */}
          <Route path="/browse"            element={<BrowsePage />} />
          <Route path="/property/:slug"    element={<PropertyDetailPage />} />

          {/* ── Auth pages (redirect away if already logged in) ────────── */}
          <Route path="/login"             element={<LoginPage />} />
          <Route path="/signup"            element={<SignupPage />} />
          <Route path="/invite/:token"     element={<AcceptInvitePage />} />
          <Route path="/reset-password"    element={<ResetPasswordPage />} />
          <Route path="/confirm"           element={<ConfirmPage />} />

          {/* ────────────────────────────────────────────────────────────── */}
          {/* All routes below require a session                             */}
          {/* ────────────────────────────────────────────────────────────── */}
          <Route element={<RequireAuth />}>

            {/* ── Client / Resident ───────────────────────────────────── */}
            <Route element={<RequireRole allowedRoles={[ROLES.CLIENT]} />}>
              <Route path="/dashboard"                    element={<ClientDashboard />} />
              <Route path="/dashboard/room"               element={<MyRoomPage />} />
              <Route path="/dashboard/billing"            element={<BillingPage />} />
              <Route path="/dashboard/payments"           element={<PaymentsPage />} />
              <Route path="/dashboard/transfer-request"   element={<TransferRequestPage />} />
              <Route path="/dashboard/complaints"         element={<ClientComplaintsPage />} />
              <Route path="/dashboard/complaints/:id"     element={<ComplaintDetailPage />} />
              <Route path="/dashboard/notifications"      element={<NotificationsPage />} />
              <Route path="/dashboard/profile"            element={<ClientProfilePage />} />
            </Route>

            {/* ── Manager ─────────────────────────────────────────────── */}
            <Route element={<RequireRole allowedRoles={[ROLES.MANAGER]} />}>
              <Route path="/manage"                        element={<ManagerDashboard />} />
              <Route path="/manage/properties"             element={<PropertiesPage />} />
              <Route path="/manage/residents"              element={<ResidentsPage />} />
              <Route path="/manage/residents/requests"     element={<RentalRequestsPage />} />
              <Route path="/manage/residents/tenancies"    element={<TenanciesPage />} />
              <Route path="/manage/residents/:id"          element={<ResidentDetailPage />} />
              <Route path="/manage/billing/cycles"         element={<ManagerBillingPage />} />
              <Route path="/manage/billing/payments"       element={<ManagerPaymentsPage />} />
              <Route path="/manage/billing/invoices"       element={<InvoicesPage />} />
              <Route path="/manage/workforce/workers"      element={<WorkforcePage />} />
              <Route path="/manage/workforce/salaries"     element={<WorkerSalariesPage />} />
              <Route path="/manage/workforce/attendance"   element={<AttendancePage />} />
              <Route path="/manage/complaints"             element={<ManagerComplaintsPage />} />
              <Route path="/manage/announcements"          element={<AnnouncementsPage />} />
              <Route path="/manage/settings"               element={<ManagerSettingsPage />} />
              <Route path="/manage/profile"                element={<ManagerProfilePage />} />
            </Route>

            {/* ── Owner ───────────────────────────────────────────────── */}
            <Route element={<RequireRole allowedRoles={[ROLES.OWNER]} />}>
              <Route path="/owner"              element={<OwnerDashboard />} />
              <Route path="/owner/occupancy"    element={<OccupancyReportPage />} />
              <Route path="/owner/financials"   element={<FinancialSummaryPage />} />
              <Route path="/owner/billing"      element={<OwnerBillingPage />} />
              <Route path="/owner/workforce"    element={<WorkerCostsPage />} />
              <Route path="/owner/analytics"    element={<OwnerAnalyticsPage />} />
            </Route>

            {/* ── Worker / Staff ──────────────────────────────────────── */}
            <Route element={<RequireRole allowedRoles={[ROLES.WORKER]} />}>
              <Route path="/worker"              element={<WorkerDashboard />} />
              <Route path="/worker/payments"     element={<WorkerPaymentsPage />} />
              <Route path="/worker/attendance"   element={<WorkerAttendancePage />} />
              <Route path="/worker/profile"      element={<WorkerProfilePage />} />
            </Route>

            {/* ── Super Admin ─────────────────────────────────────────── */}
            <Route element={<RequireRole allowedRoles={[ROLES.SUPER_ADMIN]} />}>
              <Route path="/admin"                element={<SuperAdminDashboard />} />
              <Route path="/admin/tenants"        element={<AdminTenantsPage />} />
              <Route path="/admin/tenants/:id"    element={<TenantDetailPage />} />
              <Route path="/admin/users"          element={<AdminUsersPage />} />
              <Route path="/admin/revenue"        element={<AdminRevenuePage />} />
              <Route path="/admin/analytics"      element={<AdminAnalyticsPage />} />
              <Route path="/admin/settings"       element={<AdminSettingsPage />} />
              <Route path="/admin/audit"          element={<AdminAuditPage />} />
            </Route>

            {/* ── Visitor fallback: any authenticated visitor → browse ── */}
            <Route element={<RequireRole allowedRoles={[ROLES.VISITOR]} />}>
              <Route path="/visitor" element={<Navigate to="/browse" replace />} />
            </Route>

          </Route>{/* end RequireAuth */}

          {/* ── 404 catch-all ───────────────────────────────────────────── */}
          <Route path="*" element={<NotFoundPage />} />

        </Routes>
      </Suspense>
      </PageErrorBoundary>
    </BrowserRouter>
  );
}
