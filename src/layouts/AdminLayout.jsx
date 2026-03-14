import { useState, useEffect, useCallback } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useSignOutWithCleanup } from "../hooks/useAuth";
import { useMiniNotifications }  from "../hooks/useNotifications";
import useAuthStore               from "../store/authStore";

// =============================================================================
// AdminLayout
//
// Dark, dense shell for the super admin area (/admin/*).
//
// Design language: charcoal-black with precise grid lines and monospaced
// data density. No tenant branding — this is the platform control plane.
//
// Features:
//   - 280px fixed sidebar in #0D0B09 (darker than dashboard)
//   - Status bar at the very top: "PLATFORM ADMIN" + live indicator
//   - Dense topbar with breadcrumb trail
//   - Compact nav items with icon + label, no collapsible groups
//   - Keyboard: Escape closes mobile drawer
//   - Red badge on "Pending Tenants" when count > 0
// =============================================================================

// ─── Icon primitive ───────────────────────────────────────────────────────────
const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d}/>
  </svg>
);

const ICONS = {
  overview:   "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
  tenants:    "M19 21H5a2 2 0 01-2-2V9l7-7 7 7v11a2 2 0 01-2 2z",
  users:      "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M9 11a4 4 0 100-8 4 4 0 000 8z",
  revenue:    "M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6",
  analytics:  "M18 20V10M12 20V4M6 20v-6",
  settings:   "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
  audit:      "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  profile:    "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  signout:    "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
  chevron:    "M9 18l6-6-6-6",
  bell:       "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0",
  menu:       "M4 6h16M4 12h16M4 18h16",
  close:      "M6 18L18 6M6 6l12 12",
  lightning:  "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
};

const ADMIN_NAV = [
  { label: "Platform Overview", icon: "overview",  to: "/admin",         exact: true },
  { label: "Tenants",          icon: "tenants",   to: "/admin/tenants",             badge: "pending" },
  { label: "All Users",        icon: "users",     to: "/admin/users" },
  { label: "Platform Revenue", icon: "revenue",   to: "/admin/revenue" },
  { label: "System Analytics", icon: "analytics", to: "/admin/analytics" },
  { label: "System Settings",  icon: "settings",  to: "/admin/settings" },
  { label: "Audit Logs",       icon: "audit",     to: "/admin/audit" },
];

// ─── Admin NavItem ────────────────────────────────────────────────────────────
function AdminNavItem({ item, pendingCount }) {
  const showBadge = item.badge === "pending" && pendingCount > 0;
  return (
    <NavLink
      to={item.to}
      end={item.exact}
      style={({ isActive }) => ({
        display: "flex", alignItems: "center", gap: 10,
        padding: "8px 12px",
        borderRadius: 7,
        fontSize: 12.5,
        fontWeight: isActive ? 600 : 400,
        color: isActive ? "#E8DDD4" : "rgba(255,255,255,0.42)",
        background: isActive ? "rgba(255,255,255,0.06)" : "transparent",
        textDecoration: "none",
        borderLeft: `2px solid ${isActive ? "rgba(197,97,44,0.7)" : "transparent"}`,
        transition: "all 0.12s",
        marginBottom: 2,
        letterSpacing: "0.01em",
      })}
      onMouseOver={e => { if (!e.currentTarget.style.background.includes("0.06")) { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; } }}
      onMouseOut={e  => { if (!e.currentTarget.style.background.includes("0.06")) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.42)"; } }}
    >
      {({ isActive }) => (
        <>
          <span style={{ flexShrink: 0, opacity: isActive ? 0.9 : 0.55 }}>
            <Icon d={ICONS[item.icon]} size={15}/>
          </span>
          <span style={{ flex: 1 }}>{item.label}</span>
          {showBadge && (
            <span style={{ fontSize: 10, fontWeight: 700, background: "#EF4444", color: "#fff", borderRadius: 99, padding: "1px 6px", minWidth: 18, textAlign: "center" }}>
              {pendingCount > 99 ? "99+" : pendingCount}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

// ─── Admin Sidebar ────────────────────────────────────────────────────────────
function AdminSidebar({ onSignOut, profile, pendingCount }) {
  const displayName = profile?.full_name?.trim() || profile?.email?.split("@")[0] || "Admin";
  const initials    = displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div style={{
      width: 280, flexShrink: 0,
      background: "#0D0B09",
      display: "flex", flexDirection: "column",
      height: "100%",
      borderRight: "1px solid rgba(255,255,255,0.06)",
    }}>

      {/* Header */}
      <div style={{ padding: "18px 16px 14px", flexShrink: 0 }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: "rgba(197,97,44,0.25)", border: "1px solid rgba(197,97,44,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon d={ICONS.lightning} size={13}/>
          </div>
          <span style={{ fontFamily: "'DM Mono', 'Courier New', monospace", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.75)", letterSpacing: "0.08em" }}>
            FABRENTALS
          </span>
        </div>
        <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.22)", letterSpacing: "0.12em", paddingLeft: 32, textTransform: "uppercase" }}>
          Platform Admin Console
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "0 16px 4px", flexShrink: 0 }}/>

      {/* Nav section label */}
      <div style={{ padding: "10px 12px 4px" }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.2)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
          Navigation
        </span>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "4px 10px" }}>
        {ADMIN_NAV.map(item => (
          <AdminNavItem key={item.to} item={item} pendingCount={pendingCount} />
        ))}
      </nav>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "0 16px 4px", flexShrink: 0 }}/>

      {/* Footer section */}
      <div style={{ padding: "8px 10px 16px", flexShrink: 0 }}>
        <AdminNavItem item={{ label: "Admin Profile", icon: "profile", to: "/admin/profile" }} pendingCount={0} />
        <button
          onClick={onSignOut}
          style={{
            width: "100%", display: "flex", alignItems: "center",
            gap: 10, padding: "8px 12px", borderRadius: 7,
            background: "transparent", border: "none", cursor: "pointer",
            color: "rgba(255,255,255,0.3)", fontSize: 12.5, fontWeight: 400,
            marginTop: 2, transition: "all 0.12s",
            letterSpacing: "0.01em",
          }}
          onMouseOver={e => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; e.currentTarget.style.color = "#EF4444"; }}
          onMouseOut={e  => { e.currentTarget.style.background = "transparent";            e.currentTarget.style.color = "rgba(255,255,255,0.3)"; }}
        >
          <span style={{ flexShrink: 0, opacity: 0.5 }}><Icon d={ICONS.signout} size={15}/></span>
          <span>Sign Out</span>
        </button>

        {/* Admin identity strip */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, padding: "8px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 7, border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(197,97,44,0.2)", border: "1.5px solid rgba(197,97,44,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
              : <span style={{ fontSize: 10, fontWeight: 700, color: "#C5612C" }}>{initials}</span>
            }
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Super Admin</div>
          </div>
          {/* Live dot */}
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", flexShrink: 0 }} className="admin-pulse"/>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Topbar ─────────────────────────────────────────────────────────────
function AdminTopbar({ onMobileMenu }) {
  const location               = useLocation();
  const { unreadCount }        = useMiniNotifications();
  const [time, setTime]        = useState(new Date());

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Build breadcrumb from pathname
  const crumbs = location.pathname
    .split("/")
    .filter(Boolean)
    .map((seg, i, arr) => ({
      label: seg.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
      to:    "/" + arr.slice(0, i + 1).join("/"),
    }));

  const timeStr = time.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const dateStr = time.toLocaleDateString("en-KE", { weekday: "short", month: "short", day: "numeric" });

  return (
    <div style={{
      height: 52,
      background: "#0F0D0C",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 20px", flexShrink: 0,
      position: "sticky", top: 0, zIndex: 40,
    }}>

      {/* Left: mobile burger + breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={onMobileMenu}
          className="admin-burger"
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "rgba(255,255,255,0.4)", display: "flex" }}
        >
          <Icon d={ICONS.menu} size={18}/>
        </button>

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" style={{ display: "flex", alignItems: "center", gap: 0 }}>
          {crumbs.map((crumb, i) => (
            <span key={crumb.to} style={{ display: "flex", alignItems: "center" }}>
              {i > 0 && <span style={{ margin: "0 6px", color: "rgba(255,255,255,0.18)", fontSize: 12 }}>/</span>}
              {i === crumbs.length - 1 ? (
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>{crumb.label}</span>
              ) : (
                <Link to={crumb.to} style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textDecoration: "none", fontWeight: 400 }}
                  onMouseOver={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
                  onMouseOut={e  => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* Right: clock + notifications */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* Live clock */}
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", letterSpacing: "0.06em", fontFamily: "'DM Mono','Courier New',monospace", display: "flex", gap: 6 }}>
          <span>{dateStr}</span>
          <span style={{ color: "rgba(255,255,255,0.12)" }}>·</span>
          <span>{timeStr}</span>
        </div>

        {/* Notification bell */}
        <Link to="/admin" style={{
          position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
          width: 30, height: 30, borderRadius: 6,
          color: "rgba(255,255,255,0.4)", textDecoration: "none",
          transition: "all 0.15s",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
          onMouseOver={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }}
          onMouseOut={e  => { e.currentTarget.style.background = "transparent";             e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
        >
          <Icon d={ICONS.bell} size={15}/>
          {unreadCount > 0 && (
            <span style={{ position:"absolute",top:4,right:4,width:6,height:6,borderRadius:"50%",background:"#EF4444",border:"1px solid #0F0D0C" }}/>
          )}
        </Link>
      </div>

      <style>{`
        @media (min-width: 900px) { .admin-burger { display: none !important; } }
      `}</style>
    </div>
  );
}

// ─── Platform Status Bar ──────────────────────────────────────────────────────
function StatusBar() {
  return (
    <div style={{
      height: 28,
      background: "#0A0806",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
      display: "flex", alignItems: "center",
      padding: "0 20px",
      gap: 20,
      flexShrink: 0,
    }}>
      {/* Live indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div className="admin-pulse" style={{ width: 5, height: 5, borderRadius: "50%", background: "#10B981" }}/>
        <span style={{ fontSize: 9.5, fontWeight: 700, color: "#10B981", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Systems Operational
        </span>
      </div>

      <div style={{ width: 1, height: 12, background: "rgba(255,255,255,0.08)" }}/>

      {/* Platform label */}
      <span style={{ fontSize: 9.5, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        fabrentals · Platform Admin Console
      </span>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Version */}
      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.15)", fontFamily: "'DM Mono','Courier New',monospace" }}>
        v0.2.0
      </span>
    </div>
  );
}

// ─── Main AdminLayout ─────────────────────────────────────────────────────────
export default function AdminLayout({ children }) {
  const profile  = useAuthStore(s => s.profile);
  const signOut  = useSignOutWithCleanup();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [pendingCount /* from future API */] = useState(0); // wire to getPendingTenantCount

  // Close drawer on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Escape closes drawer
  useEffect(() => {
    const fn = e => { if (e.key === "Escape") setMobileOpen(false); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate("/login", { replace: true });
  }, [signOut, navigate]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', system-ui, sans-serif; background: #0F0D0C; }

        @keyframes adminPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.2)} }
        .admin-pulse { animation: adminPulse 2.5s ease-in-out infinite; }

        /* Admin content scrollbar */
        .admin-content::-webkit-scrollbar { width: 4px; }
        .admin-content::-webkit-scrollbar-track { background: #0F0D0C; }
        .admin-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }

        /* Admin sidebar scrollbar */
        nav::-webkit-scrollbar { width: 2px; }
        nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); }

        @keyframes adminDrawerIn { from{transform:translateX(-100%)} to{transform:translateX(0)} }
        .admin-drawer-enter { animation: adminDrawerIn 0.2s ease both; }

        @media (min-width: 900px) { .admin-overlay-el { display:none !important; } .admin-mob-sidebar { display:none !important; } }
        @media (max-width: 899px) { .admin-desk-sidebar { display:none !important; } }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", height: "100dvh", overflow: "hidden", background: "#0F0D0C" }}>

        {/* Platform status bar */}
        <StatusBar />

        {/* Main row */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* Desktop sidebar */}
          <div className="admin-desk-sidebar">
            <AdminSidebar onSignOut={handleSignOut} profile={profile} pendingCount={pendingCount} />
          </div>

          {/* Mobile overlay */}
          {mobileOpen && (
            <div
              className="admin-overlay-el"
              onClick={() => setMobileOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, backdropFilter: "blur(3px)" }}
            />
          )}

          {/* Mobile sidebar drawer */}
          {mobileOpen && (
            <div className="admin-mob-sidebar admin-drawer-enter" style={{ position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 210 }}>
              <AdminSidebar onSignOut={handleSignOut} profile={profile} pendingCount={pendingCount} />
            </div>
          )}

          {/* Right content column */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

            {/* Admin topbar */}
            <AdminTopbar onMobileMenu={() => setMobileOpen(true)} />

            {/* Scrollable content */}
            <div
              className="admin-content"
              style={{ flex: 1, overflowY: "auto", padding: "28px 24px 48px", color: "rgba(255,255,255,0.85)" }}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
