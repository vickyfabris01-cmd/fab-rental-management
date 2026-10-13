// src/router/guards.jsx — NEW FILE
//
// AIM
// The route guards. Each one is a layout route: it renders <Outlet/> when the person may
// enter, otherwise redirects to a page that explains what to do (never a blank screen).
//
//   RequireAuth         signed in, else /login?next=…
//   RequireSuperAdmin   super admin, else the 404 page
//   RequireMember       loads the business from :slug, checks the person belongs to it (or is
//                       super admin) and that the business is active; fills BusinessContext
//   RoleRoute           ONE path, a different screen per role:
//                         <RoleRoute screens={{ owner: <A/>, manager: <B/> }} />

import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../config/supabase.js";
import Spinner from "../components/ui/Spinner.jsx";
import { useSession } from "../store/sessionStore.js";
import { useBusinessStore } from "../store/businessStore.js";
import { BusinessContext, useBusinessContext } from "./BusinessContext.jsx";
import { Card, EmptyState, Button } from "../components/ui";
import { Link } from "react-router-dom";

export function FullPageLoader() {
  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "60dvh" }}>
      <Spinner size="lg" label="Loading" />
    </div>
  );
}

export function RequireAuth() {
  const user = useSession((s) => s.user);
  const loading = useSession((s) => s.loading);
  const location = useLocation();
  if (loading) return <FullPageLoader />;
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return <Outlet />;
}

export function RequireSuperAdmin() {
  const loading = useSession((s) => s.loading);
  const profile = useSession((s) => s.profile);
  const user = useSession((s) => s.user);
  const location = useLocation();
  if (loading || (user && !profile)) return <FullPageLoader />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  if (profile?.role !== "super_admin") return <Navigate to="/not-found" replace />;
  return <Outlet />;
}

export function RequireMember() {
  const { slug } = useParams();
  const user = useSession((s) => s.user);
  const profile = useSession((s) => s.profile);
  const memberships = useBusinessStore((s) => s.memberships);
  const loadedFor = useBusinessStore((s) => s.loadedFor);
  const [admin, setAdmin] = useState({ slug: null, business: null });

  const isAdmin = profile?.role === "super_admin";
  const own = memberships.find((m) => m.business.slug === slug) || null;

  // Super admin opening a business they do not belong to: load it directly.
  useEffect(() => {
    if (!isAdmin || own || !supabase) return;
    let alive = true;
    supabase.from("businesses").select("*").eq("slug", slug).maybeSingle().then(({ data }) => {
      if (alive) setAdmin({ slug, business: data || false });
    });
    return () => { alive = false; };
  }, [isAdmin, own, slug]);

  if (!user || !profile || loadedFor !== user.id) return <FullPageLoader />;

  let business = own?.business || null;
  let role = own?.role || null;
  if (!business && isAdmin) {
    if (admin.slug !== slug) return <FullPageLoader />;
    business = admin.business || null;
    role = "super_admin";
  }

  if (!business) {
    return (
      <Card style={{ margin: "var(--space-8) auto", maxWidth: 520 }}>
        <EmptyState
          icon="search"
          title="Business not found"
          description="This business does not exist, or you are not a member of it."
          action={<Button as={Link} to="/businesses">My businesses</Button>}
        />
      </Card>
    );
  }

  if (business.status !== "active" && role !== "super_admin") {
    return <Navigate to={`/start/status?business=${business.slug}`} replace />;
  }

  return (
    <BusinessContext.Provider value={{ business, role }}>
      <Outlet />
    </BusinessContext.Provider>
  );
}

/** One path, a different screen for each role. `fallback` shows for any other role. */
export function RoleRoute({ screens = {}, fallback = null }) {
  const ctx = useBusinessContext();
  const role = ctx?.role;
  const screen = screens[role] ?? (role === "super_admin" ? screens.owner : null) ?? fallback;
  if (screen) return screen;
  return (
    <Card style={{ margin: "var(--space-8) auto", maxWidth: 520 }}>
      <EmptyState icon="user" title="Owners only" description="This screen is only for the business owner." />
    </Card>
  );
}
