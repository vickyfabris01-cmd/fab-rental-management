import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";

// ── Pages (built) ─────────────────────────────────────────────────────────────
import PublicPage        from "./pages/public/PublicPage";
import LoginPage         from "./pages/auth/LoginPage";
import SignupPage        from "./pages/auth/SignupPage";
import ClientDashboard   from "./pages/client/ClientDashboard";
import ManagerDashboard  from "./pages/manager/ManagerDashboard";
import OwnerDashboard    from "./pages/owner/OwnerDashboard";
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";
import WorkerDashboard   from "./pages/worker/WorkerDashboard";

// ── Supabase client ───────────────────────────────────────────────────────────
// Swap this import for your actual supabase.js path once configured
// import { supabase } from "./config/supabase";
//
// For now we use a lightweight mock so the router works without a live backend.
const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: (_event, _cb) => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
  },
  from: () => ({
    select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
  }),
};

// ── Role → home route map ─────────────────────────────────────────────────────
const ROLE_HOME = {
  client:      "/dashboard",
  manager:     "/manage",
  owner:       "/owner",
  super_admin: "/admin",
  worker:      "/worker",
  visitor:     "/browse",
};

// ── Auth context (very thin — replace with a real context/store later) ────────
// In production use your Zustand authStore here.
let _session = null;
let _profile = null;

// ─────────────────────────────────────────────────────────────────────────────
// RequireAuth  — redirects to /login if there is no active session
// ─────────────────────────────────────────────────────────────────────────────
function RequireAuth({ children }) {
  const location = useLocation();

  // During development with no Supabase configured, _session is always null.
  // Flip the condition below to `if (!_session)` once Supabase is wired up.
  const isAuthenticated = _session !== null;

  if (!isAuthenticated) {
    // Pass the attempted URL so LoginPage can redirect back after sign-in
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// ─────────────────────────────────────────────────────────────────────────────
// RequireRole  — redirects to the user's correct home if their role doesn't match
// ─────────────────────────────────────────────────────────────────────────────
function RequireRole({ roles, children }) {
  const role = _profile?.role;

  if (!role) {
    // Profile not loaded yet — render nothing (loading handled by AppLoader)
    return null;
  }

  if (!roles.includes(role)) {
    const home = ROLE_HOME[role] || "/";
    return <Navigate to={home} replace />;
  }

  return children;
}

// ─────────────────────────────────────────────────────────────────────────────
// RoleRedirect  — after login, sends the user to their role's home page
// ─────────────────────────────────────────────────────────────────────────────
function RoleRedirect() {
  const role = _profile?.role;
  const home = ROLE_HOME[role] || "/";
  return <Navigate to={home} replace />;
}

// ─────────────────────────────────────────────────────────────────────────────
// AppLoader  — waits for session + profile before rendering routes
// ─────────────────────────────────────────────────────────────────────────────
function AppLoader() {
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      // 1. Get current session
      const { data: { session } } = await supabase.auth.getSession();
      _session = session;

      // 2. If logged in, fetch the user's profile (role + tenant_id)
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, role, tenant_id, full_name, avatar_url")
          .eq("id", session.user.id)
          .single();

        _profile = profile;
      }

      if (mounted) setReady(true);
    }

    bootstrap();

    // 3. Listen for auth changes (sign-in / sign-out from any tab)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        _session = session;

        if (event === "SIGNED_IN" && session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, role, tenant_id, full_name, avatar_url")
            .eq("id", session.user.id)
            .single();

          _profile = profile;

          // Redirect to the role's home unless already there
          const home = ROLE_HOME[profile?.role] || "/";
          const intendedFrom = location.state?.from?.pathname;
          navigate(intendedFrom || home, { replace: true });
        }

        if (event === "SIGNED_OUT") {
          _profile = null;
          navigate("/login", { replace: true });
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Splash screen while session loads ──────────────────────────────────────
  if (!ready) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center gap-4"
        style={{ background: "#FAF7F2", fontFamily: "'DM Sans', sans-serif" }}
      >
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@900&family=DM+Sans:wght@400;600&display=swap');`}</style>
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "#C5612C" }}
          >
            <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
            </svg>
          </div>
          <span
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 900,
              fontSize: 22,
              color: "#1A1412",
            }}
          >
            fabrentals
          </span>
        </div>
        <div
          className="w-8 h-8 rounded-full border-4"
          style={{
            borderColor: "rgba(197,97,44,0.2)",
            borderTopColor: "#C5612C",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return <AppRoutes />;
}

// ─────────────────────────────────────────────────────────────────────────────
// AppRoutes  — all route definitions
// ─────────────────────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* ── Public ─────────────────────────────────────────────────────────── */}
      <Route path="/"       element={<PublicPage />} />
      <Route path="/login"  element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* ── Auth redirects (stubs — add pages when built) ─────────────────── */}
      <Route path="/invite/:token"   element={<ComingSoon title="Accept Invitation" />} />
      <Route path="/reset-password"  element={<ComingSoon title="Reset Password" />} />
      <Route path="/browse"          element={<ComingSoon title="Browse Properties" />} />

      {/* ── After sign-in: figure out where to send the user ─────────────── */}
      <Route
        path="/redirect"
        element={
          <RequireAuth>
            <RoleRedirect />
          </RequireAuth>
        }
      />

      {/* ── Client (resident) ────────────────────────────────────────────── */}
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <RequireRole roles={["client"]}>
              <ClientDashboard />
            </RequireRole>
          </RequireAuth>
        }
      />
      {/* Subroutes — add pages as they are built */}
      <Route path="/dashboard/room"            element={<RequireAuth><RequireRole roles={["client"]}><ComingSoon title="My Room" /></RequireRole></RequireAuth>} />
      <Route path="/dashboard/billing"         element={<RequireAuth><RequireRole roles={["client"]}><ComingSoon title="Billing & Invoices" /></RequireRole></RequireAuth>} />
      <Route path="/dashboard/payments"        element={<RequireAuth><RequireRole roles={["client"]}><ComingSoon title="Payments" /></RequireRole></RequireAuth>} />
      <Route path="/dashboard/transfer-request"element={<RequireAuth><RequireRole roles={["client"]}><ComingSoon title="Room Transfer" /></RequireRole></RequireAuth>} />
      <Route path="/dashboard/complaints"      element={<RequireAuth><RequireRole roles={["client"]}><ComingSoon title="Complaints" /></RequireRole></RequireAuth>} />
      <Route path="/dashboard/complaints/:id"  element={<RequireAuth><RequireRole roles={["client"]}><ComingSoon title="Complaint Detail" /></RequireRole></RequireAuth>} />
      <Route path="/dashboard/notifications"   element={<RequireAuth><RequireRole roles={["client"]}><ComingSoon title="Notifications" /></RequireRole></RequireAuth>} />
      <Route path="/dashboard/profile"         element={<RequireAuth><RequireRole roles={["client"]}><ComingSoon title="My Profile" /></RequireRole></RequireAuth>} />

      {/* ── Manager ──────────────────────────────────────────────────────── */}
      <Route
        path="/manage"
        element={
          <RequireAuth>
            <RequireRole roles={["manager"]}>
              <ManagerDashboard />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route path="/manage/properties"              element={<RequireAuth><RequireRole roles={["manager"]}><ComingSoon title="Rooms & Buildings" /></RequireRole></RequireAuth>} />
      <Route path="/manage/residents"               element={<RequireAuth><RequireRole roles={["manager"]}><ComingSoon title="All Residents" /></RequireRole></RequireAuth>} />
      <Route path="/manage/residents/:id"           element={<RequireAuth><RequireRole roles={["manager"]}><ComingSoon title="Resident Detail" /></RequireRole></RequireAuth>} />
      <Route path="/manage/residents/requests"      element={<RequireAuth><RequireRole roles={["manager"]}><ComingSoon title="Rental Requests" /></RequireRole></RequireAuth>} />
      <Route path="/manage/residents/tenancies"     element={<RequireAuth><RequireRole roles={["manager"]}><ComingSoon title="Tenancies" /></RequireRole></RequireAuth>} />
      <Route path="/manage/billing/cycles"          element={<RequireAuth><RequireRole roles={["manager"]}><ComingSoon title="Billing Cycles" /></RequireRole></RequireAuth>} />
      <Route path="/manage/billing/payments"        element={<RequireAuth><RequireRole roles={["manager"]}><ComingSoon title="Payments" /></RequireRole></RequireAuth>} />
      <Route path="/manage/billing/invoices"        element={<RequireAuth><RequireRole roles={["manager"]}><ComingSoon title="Invoices" /></RequireRole></RequireAuth>} />
      <Route path="/manage/workforce/workers"       element={<RequireAuth><RequireRole roles={["manager"]}><ComingSoon title="Workers" /></RequireRole></RequireAuth>} />
      <Route path="/manage/workforce/salaries"      element={<RequireAuth><RequireRole roles={["manager"]}><ComingSoon title="Salaries" /></RequireRole></RequireAuth>} />
      <Route path="/manage/workforce/attendance"    element={<RequireAuth><RequireRole roles={["manager"]}><ComingSoon title="Attendance" /></RequireRole></RequireAuth>} />
      <Route path="/manage/complaints"              element={<RequireAuth><RequireRole roles={["manager"]}><ComingSoon title="Complaints" /></RequireRole></RequireAuth>} />
      <Route path="/manage/announcements"           element={<RequireAuth><RequireRole roles={["manager"]}><ComingSoon title="Announcements" /></RequireRole></RequireAuth>} />
      <Route path="/manage/settings"                element={<RequireAuth><RequireRole roles={["manager"]}><ComingSoon title="Settings" /></RequireRole></RequireAuth>} />
      <Route path="/manage/profile"                 element={<RequireAuth><RequireRole roles={["manager"]}><ComingSoon title="My Profile" /></RequireRole></RequireAuth>} />

      {/* ── Owner ─────────────────────────────────────────────────────────── */}
      <Route
        path="/owner"
        element={
          <RequireAuth>
            <RequireRole roles={["owner"]}>
              <OwnerDashboard />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route path="/owner/occupancy"   element={<RequireAuth><RequireRole roles={["owner"]}><ComingSoon title="Occupancy Report" /></RequireRole></RequireAuth>} />
      <Route path="/owner/financials"  element={<RequireAuth><RequireRole roles={["owner"]}><ComingSoon title="Financial Summary" /></RequireRole></RequireAuth>} />
      <Route path="/owner/billing"     element={<RequireAuth><RequireRole roles={["owner"]}><ComingSoon title="Billing" /></RequireRole></RequireAuth>} />
      <Route path="/owner/workforce"   element={<RequireAuth><RequireRole roles={["owner"]}><ComingSoon title="Worker Costs" /></RequireRole></RequireAuth>} />
      <Route path="/owner/analytics"   element={<RequireAuth><RequireRole roles={["owner"]}><ComingSoon title="Analytics" /></RequireRole></RequireAuth>} />

      {/* ── Super Admin ───────────────────────────────────────────────────── */}
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <RequireRole roles={["super_admin"]}>
              <SuperAdminDashboard />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route path="/admin/tenants"        element={<RequireAuth><RequireRole roles={["super_admin"]}><ComingSoon title="Tenants" /></RequireRole></RequireAuth>} />
      <Route path="/admin/tenants/:id"    element={<RequireAuth><RequireRole roles={["super_admin"]}><ComingSoon title="Tenant Detail" /></RequireRole></RequireAuth>} />
      <Route path="/admin/users"          element={<RequireAuth><RequireRole roles={["super_admin"]}><ComingSoon title="All Users" /></RequireRole></RequireAuth>} />
      <Route path="/admin/revenue"        element={<RequireAuth><RequireRole roles={["super_admin"]}><ComingSoon title="Platform Revenue" /></RequireRole></RequireAuth>} />
      <Route path="/admin/analytics"      element={<RequireAuth><RequireRole roles={["super_admin"]}><ComingSoon title="Analytics" /></RequireRole></RequireAuth>} />
      <Route path="/admin/settings"       element={<RequireAuth><RequireRole roles={["super_admin"]}><ComingSoon title="Settings" /></RequireRole></RequireAuth>} />
      <Route path="/admin/audit"          element={<RequireAuth><RequireRole roles={["super_admin"]}><ComingSoon title="Audit Log" /></RequireRole></RequireAuth>} />

      {/* ── Worker ───────────────────────────────────────────────────────── */}
      <Route
        path="/worker"
        element={
          <RequireAuth>
            <RequireRole roles={["worker"]}>
              <WorkerDashboard />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route path="/worker/payments"   element={<RequireAuth><RequireRole roles={["worker"]}><ComingSoon title="Pay History" /></RequireRole></RequireAuth>} />
      <Route path="/worker/attendance" element={<RequireAuth><RequireRole roles={["worker"]}><ComingSoon title="Attendance" /></RequireRole></RequireAuth>} />
      <Route path="/worker/profile"    element={<RequireAuth><RequireRole roles={["worker"]}><ComingSoon title="My Profile" /></RequireRole></RequireAuth>} />

      {/* ── Catch-all 404 ────────────────────────────────────────────────── */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ComingSoon  — placeholder for pages not yet built
// ─────────────────────────────────────────────────────────────────────────────
function ComingSoon({ title }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ background: "#FAF7F2", fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@900&family=DM+Sans:wght@400;600&display=swap');`}</style>
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2"
        style={{ background: "rgba(197,97,44,0.1)" }}
      >
        <svg
          width={28}
          height={28}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#C5612C"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </div>
      <h1
        style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 900,
          fontSize: 28,
          color: "#1A1412",
        }}
      >
        {title}
      </h1>
      <p style={{ color: "#8B7355", fontSize: 14 }}>This page is coming soon.</p>
      <a
        href="/"
        style={{
          marginTop: 8,
          background: "#C5612C",
          color: "white",
          borderRadius: 999,
          padding: "10px 24px",
          fontSize: 13,
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        ← Back to Home
      </a>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NotFound  — 404 page
// ─────────────────────────────────────────────────────────────────────────────
function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-3"
      style={{ background: "#FAF7F2", fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@900&family=DM+Sans:wght@400;600&display=swap');`}</style>
      <p style={{ fontSize: 72, fontFamily: "'Playfair Display', serif", fontWeight: 900, color: "#E8DDD4", lineHeight: 1 }}>404</p>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 22, color: "#1A1412" }}>Page not found</h2>
      <p style={{ color: "#8B7355", fontSize: 14 }}>The page you're looking for doesn't exist.</p>
      <a
        href="/"
        style={{
          marginTop: 8,
          background: "#C5612C",
          color: "white",
          borderRadius: 999,
          padding: "10px 24px",
          fontSize: 13,
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        ← Back to Home
      </a>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root export
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AppLoader />
    </BrowserRouter>
  );
}
