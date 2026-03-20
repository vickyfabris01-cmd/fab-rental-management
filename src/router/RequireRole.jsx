import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuthStore                       from "../store/authStore";
import { ROLE_HOME }                      from "../config/constants";

// =============================================================================
// RequireRole
//
// Sits inside a <RequireAuth> outlet and enforces role-based access.
//
// Props:
//   allowedRoles  — string[]  Roles that MAY access the wrapped routes.
//                             If omitted or empty, any authenticated user passes.
//
// Behaviour:
//   • If the user's role is in allowedRoles → render <Outlet />.
//   • If not → redirect to ROLE_HOME[role] (their correct dashboard).
//     This is a silent "you're in the wrong place" redirect — no error page.
//   • If the profile hasn't loaded yet (rare race condition) → render nothing
//     briefly, wait for the profile, then evaluate.
//
// Usage (inside AppRouter):
//
//   // Single role
//   <Route element={<RequireRole allowedRoles={["manager"]} />}>
//     <Route path="/manage" element={<ManagerDashboard />} />
//   </Route>
//
//   // Multiple roles
//   <Route element={<RequireRole allowedRoles={["manager", "owner"]} />}>
//     <Route path="/shared-page" element={<SharedPage />} />
//   </Route>
//
//   // Any authenticated user (no role restriction)
//   <Route element={<RequireRole />}>
//     <Route path="/account" element={<AccountPage />} />
//   </Route>
// =============================================================================

export default function RequireRole({ allowedRoles = [] }) {
  const profile  = useAuthStore(s => s.profile);
  const loading  = useAuthStore(s => s.loading);
  const location = useLocation();

  // Profile is still loading — render nothing (RequireAuth's spinner already
  // handled the loading state before we got here, so this is a brief flash
  // only during role-change redirects).
  if (loading || !profile) return null;

  const role = profile.role;

  // No role restriction → pass through
  if (!allowedRoles.length) return <Outlet />;

  // Role is permitted → render the route
  if (allowedRoles.includes(role)) return <Outlet />;

  // Role is NOT permitted → redirect to their actual home dashboard.
  // Pass the current location so the home page knows where we came from
  // (useful for analytics or debugging, not used for redirect-back).
  const home = ROLE_HOME[role] ?? "/";
  return <Navigate to={home} state={{ from: location }} replace />;
}
