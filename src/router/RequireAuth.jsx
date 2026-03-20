import { Navigate, useLocation } from "react-router-dom";
import useAuthStore               from "../store/authStore";

// =============================================================================
// RequireAuth
//
// Wraps any route that needs a confirmed Supabase session.
// If there is no authenticated user, redirects to /login while preserving the
// original URL in location.state.from so LoginPage can redirect back after
// a successful sign-in.
//
// Usage (inside AppRouter):
//   <Route element={<RequireAuth />}>
//     <Route path="/dashboard" element={<ClientDashboard />} />
//     ...
//   </Route>
//
// While the auth store is still initialising (loading === true) we render a
// blank full-screen div rather than flashing the login page, which would cause
// a redirect loop on hard refresh.
// =============================================================================

import { Outlet } from "react-router-dom";

export default function RequireAuth() {
  const user    = useAuthStore(s => s.user);
  const loading = useAuthStore(s => s.loading);
  const location = useLocation();

  // ── Still bootstrapping — show nothing until session is known ────────────
  if (loading) {
    return (
      <div style={{
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        height:          "100dvh",
        background:      "#FAF7F2",
        fontFamily:      "'DM Sans', system-ui, sans-serif",
      }}>
        {/* Minimal brand spinner — no component imports to avoid circular deps */}
        <div style={{ textAlign:"center" }}>
          <div style={{
            width:         40,
            height:        40,
            borderRadius:  "50%",
            border:        "3px solid #F5EDE0",
            borderTopColor:"#C5612C",
            animation:     "spin 0.8s linear infinite",
            margin:        "0 auto 14px",
          }}/>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <p style={{ fontSize:13, color:"#8B7355", margin:0 }}>Loading…</p>
        </div>
      </div>
    );
  }

  // ── No session → send to login, remembering where we wanted to go ────────
  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // ── Authenticated → render the protected route ───────────────────────────
  return <Outlet />;
}
