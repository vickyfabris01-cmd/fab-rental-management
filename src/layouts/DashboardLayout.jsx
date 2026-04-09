import { useState, useEffect, useCallback } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useSignOutWithCleanup } from "../hooks/useAuth";
import { useTenant } from "../hooks/useTenant";
import { useMiniNotifications } from "../hooks/useNotifications";
import useAuthStore from "../store/authStore";
import LogoSrc from "../assets/logo.svg";
import LogoIconSrc from "../assets/logo-icon.svg";
import BottomNav from "../components/layout/BottomNav.jsx";

// =============================================================================
// DashboardLayout
//
// Shared shell for: /dashboard (client), /manage (manager), /owner, /worker
//
// Features:
//   - Fixed 260px sidebar on desktop, slide-in drawer on mobile
//   - Collapsible NavGroup items with smooth height transition
//   - Sticky 64px topbar with page title slot, notifications bell, user avatar
//   - Tenant branding injection (CSS vars + logo swap) on mount
//   - Sign-out cleans up all stores in correct order
//   - Keyboard: Escape closes mobile drawer
//
// Usage:
//   <DashboardLayout>
//     <PageContent />
//   </DashboardLayout>
//
// The layout derives the correct nav tree from the authenticated user's role.
// =============================================================================

// ─── Icons (inline SVG, no icon library dependency) ─────────────────────────
const Icon = ({ d, size = 18, strokeWidth = 1.8 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

const ICONS = {
  dashboard: "M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z",
  room: "M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z M9 21V12h6v9",
  billing:
    "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
  payments:
    "M3 10h18 M7 15h.01 M11 15h2 M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z",
  transfer: "M7 16V4m0 0L3 8m4-4l4 4 M17 8v12m0 0l4-4m-4 4l-4-4",
  complaints: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  notifications:
    "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0",
  profile:
    "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z",
  properties: "M19 21H5a2 2 0 01-2-2V9l7-7 7 7v11a2 2 0 01-2 2z M9 21V12h6v9",
  residents:
    "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75",
  workforce:
    "M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z M10 13a2 2 0 104 0c0-1.1-.9-2-2-2a2 2 0 00-2 2z M8 17h.01 M12 17h.01 M16 17h.01",
  analytics: "M18 20V10 M12 20V4 M6 20v-6",
  settings:
    "M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
  signout:
    "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
  chevron: "M6 9l6 6 6-6",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "M6 18L18 6M6 6l12 12",
  bell: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0",
  salary:
    "M12 8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z M20.94 11A9 9 0 113 11",
  attendance:
    "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  announcements:
    "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z",
  overview:
    "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z M14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z M4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z M14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
  occupancy: "M3 3h7v9H3z M14 3h7v5h-7z M14 12h7v9h-7z M3 16h7v5H3z",
  financials: "M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6",
  requests:
    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  tenancies:
    "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  invoices:
    "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
};

// ─── Nav tree by role ────────────────────────────────────────────────────────
function getNavItems(role) {
  if (role === "client")
    return [
      { type: "item", label: "Dashboard", icon: "dashboard", to: "/dashboard" },
      { type: "item", label: "My Room", icon: "room", to: "/dashboard/room" },
      {
        type: "item",
        label: "Billing & Invoices",
        icon: "billing",
        to: "/dashboard/billing",
      },
      {
        type: "item",
        label: "Payments",
        icon: "payments",
        to: "/dashboard/payments",
      },
      {
        type: "item",
        label: "Room Transfer",
        icon: "transfer",
        to: "/dashboard/transfer-request",
      },
      {
        type: "item",
        label: "Complaints",
        icon: "complaints",
        to: "/dashboard/complaints",
      },
      {
        type: "item",
        label: "Notifications",
        icon: "notifications",
        to: "/dashboard/notifications",
      },
    ];

  if (role === "manager")
    return [
      { type: "item", label: "Dashboard", icon: "dashboard", to: "/manage" },
      {
        type: "group",
        label: "Properties",
        icon: "properties",
        children: [
          { label: "Buildings & Rooms", to: "/manage/properties" },
          { label: "Rental Requests", to: "/manage/residents/requests" },
        ],
      },
      {
        type: "group",
        label: "Residents",
        icon: "residents",
        children: [
          { label: "All Residents", to: "/manage/residents" },
          { label: "Move-In / Move-Out", to: "/manage/residents/tenancies" },
        ],
      },
      {
        type: "group",
        label: "Billing",
        icon: "billing",
        children: [
          { label: "Billing Cycles", to: "/manage/billing/cycles" },
          { label: "Payments", to: "/manage/billing/payments" },
          { label: "Invoices", to: "/manage/billing/invoices" },
        ],
      },
      {
        type: "group",
        label: "Workforce",
        icon: "workforce",
        children: [
          { label: "Workers", to: "/manage/workforce/workers" },
          { label: "Salaries", to: "/manage/workforce/salaries" },
          { label: "Attendance", to: "/manage/workforce/attendance" },
        ],
      },
      {
        type: "item",
        label: "Complaints",
        icon: "complaints",
        to: "/manage/complaints",
      },
      {
        type: "item",
        label: "Announcements",
        icon: "announcements",
        to: "/manage/announcements",
      },

      { type: "divider" },
      {
        type: "item",
        label: "Settings",
        icon: "settings",
        to: "/manage/settings",
      },
      {
        type: "item",
        label: "My Profile",
        icon: "profile",
        to: "/manage/profile",
      },
    ];

  if (role === "owner")
    return [
      { type: "item", label: "Overview", icon: "overview", to: "/owner" },
      {
        type: "item",
        label: "Occupancy Report",
        icon: "occupancy",
        to: "/owner/occupancy",
      },
      {
        type: "item",
        label: "Financials",
        icon: "financials",
        to: "/owner/financials",
      },
      { type: "item", label: "Billing", icon: "billing", to: "/owner/billing" },
      {
        type: "item",
        label: "Worker Costs",
        icon: "workforce",
        to: "/owner/workforce",
      },
      {
        type: "item",
        label: "Analytics",
        icon: "analytics",
        to: "/owner/analytics",
      },
      {
        type: "item",
        label: "Team & Managers",
        icon: "team",
        to: "/owner#team",
      },
    ];

  if (role === "worker")
    return [
      { type: "item", label: "My Overview", icon: "dashboard", to: "/worker" },
      {
        type: "item",
        label: "Pay History",
        icon: "salary",
        to: "/worker/payments",
      },
      {
        type: "item",
        label: "Attendance",
        icon: "attendance",
        to: "/worker/attendance",
      },
    ];

  return [];
}

// ─── NavGroup component ───────────────────────────────────────────────────────
function NavGroup({ item, collapsed }) {
  const location = useLocation();
  const hasActive = item.children?.some((c) =>
    location.pathname.startsWith(c.to),
  );
  const [open, setOpen] = useState(hasActive);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "9px 14px",
          borderRadius: 10,
          background: hasActive ? "rgba(197,97,44,0.10)" : "transparent",
          border: "none",
          cursor: "pointer",
          color: hasActive ? "#C5612C" : "rgba(255,255,255,0.65)",
          fontSize: 13.5,
          fontWeight: 500,
          transition: "all 0.15s",
        }}
        onMouseOver={(e) => {
          if (!hasActive)
            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
        }}
        onMouseOut={(e) => {
          if (!hasActive) e.currentTarget.style.background = "transparent";
        }}
      >
        <span style={{ flexShrink: 0, opacity: hasActive ? 1 : 0.7 }}>
          <Icon d={ICONS[item.icon]} size={17} />
        </span>
        {!collapsed && (
          <>
            <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>
            <span
              style={{
                transform: open ? "rotate(180deg)" : "rotate(0)",
                transition: "transform 0.2s",
                opacity: 0.5,
              }}
            >
              <Icon d={ICONS.chevron} size={13} />
            </span>
          </>
        )}
      </button>

      {/* Children */}
      {!collapsed && open && (
        <div style={{ paddingLeft: 16, marginTop: 2 }}>
          {item.children.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              end
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 14px 7px 22px",
                borderRadius: 8,
                marginBottom: 2,
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "#C5612C" : "rgba(255,255,255,0.5)",
                background: isActive ? "rgba(197,97,44,0.10)" : "transparent",
                textDecoration: "none",
                borderLeft: `2px solid ${isActive ? "#C5612C" : "rgba(255,255,255,0.08)"}`,
                transition: "all 0.15s",
              })}
            >
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Single NavItem ───────────────────────────────────────────────────────────
function NavItem({ item, collapsed }) {
  return (
    <NavLink
      to={item.to}
      end={item.to.split("/").length <= 2} // exact match for root routes
      title={collapsed ? item.label : undefined}
      style={({ isActive }) => ({
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 14px",
        borderRadius: 10,
        fontSize: 13.5,
        fontWeight: isActive ? 600 : 500,
        color: isActive ? "#C5612C" : "rgba(255,255,255,0.65)",
        background: isActive ? "rgba(197,97,44,0.12)" : "transparent",
        textDecoration: "none",
        transition: "all 0.15s",
        position: "relative",
      })}
      onMouseOver={(e) => {
        if (!e.currentTarget.style.background.includes("0.12"))
          e.currentTarget.style.background = "rgba(255,255,255,0.05)";
      }}
      onMouseOut={(e) => {
        if (!e.currentTarget.style.background.includes("0.12"))
          e.currentTarget.style.background = "transparent";
      }}
    >
      {({ isActive }) => (
        <>
          {/* Active indicator bar */}
          {isActive && (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: "20%",
                bottom: "20%",
                width: 3,
                borderRadius: "0 3px 3px 0",
                background: "#C5612C",
              }}
            />
          )}
          <span style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }}>
            <Icon d={ICONS[item.icon] ?? ICONS.dashboard} size={17} />
          </span>
          {!collapsed && <span>{item.label}</span>}
        </>
      )}
    </NavLink>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar({
  role,
  navItems,
  collapsed,
  onSignOut,
  profile,
  tenant,
  logoUrl,
}) {
  const displayName =
    profile?.full_name?.trim() || profile?.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      style={{
        width: collapsed ? 60 : 260,
        flexShrink: 0,
        background: "#1A1412",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        transition: "width 0.25s ease",
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: collapsed ? "20px 0" : "20px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          flexShrink: 0,
        }}
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="logo"
            style={{
              height: 28,
              width: "auto",
              maxWidth: 180,
              objectFit: "contain",
            }}
          />
        ) : collapsed ? (
          <img
            src={LogoIconSrc}
            alt="fabrentals"
            style={{ width: 28, height: 28 }}
          />
        ) : (
          <div>
            <img
              src={LogoIconSrc}
              alt=""
              style={{
                width: 24,
                height: 24,
                display: "inline",
                verticalAlign: "middle",
                marginRight: 8,
              }}
            />
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 900,
                fontSize: 17,
                color: "#fff",
                verticalAlign: "middle",
              }}
            >
              fab<span style={{ color: "#C5612C" }}>rentals</span>
            </span>
            {tenant?.name && (
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.35)",
                  marginTop: 2,
                  paddingLeft: 32,
                  letterSpacing: "0.02em",
                }}
              >
                {tenant.name}
              </div>
            )}
          </div>
        )}
      </div>

      <div
        style={{
          height: 1,
          background: "rgba(255,255,255,0.07)",
          margin: "0 16px",
          flexShrink: 0,
        }}
      />

      {/* Nav */}
      <nav
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "12px 10px",
        }}
      >
        {navItems.map((item, i) => {
          if (item.type === "divider")
            return (
              <div
                key={i}
                style={{
                  height: 1,
                  background: "rgba(255,255,255,0.07)",
                  margin: "8px 4px",
                }}
              />
            );
          if (item.type === "group")
            return (
              <NavGroup key={item.label} item={item} collapsed={collapsed} />
            );
          return <NavItem key={item.to} item={item} collapsed={collapsed} />;
        })}
      </nav>

      <div
        style={{
          height: 1,
          background: "rgba(255,255,255,0.07)",
          margin: "0 16px",
          flexShrink: 0,
        }}
      />

      {/* Profile + Sign out */}
      <div
        style={{ padding: collapsed ? "14px 0" : "14px 10px", flexShrink: 0 }}
      >
        <NavItem
          item={{
            label: "My Profile",
            icon: "profile",
            to: `/${role === "client" ? "dashboard" : role === "manager" ? "manage" : role}/profile`,
          }}
          collapsed={collapsed}
        />
        {/* P-8: View public site link */}
        <a
          href="/"
          title={collapsed ? "View public site" : undefined}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "9px 14px",
            borderRadius: 10,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.35)",
            fontSize: 13.5,
            fontWeight: 500,
            marginTop: 4,
            textDecoration: "none",
            transition: "all 0.15s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            e.currentTarget.style.color = "rgba(255,255,255,0.75)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "rgba(255,255,255,0.35)";
          }}
        >
          <span style={{ flexShrink: 0 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
            </svg>
          </span>
          {!collapsed && <span>Public Site</span>}
        </a>

        <button
          onClick={onSignOut}
          title={collapsed ? "Sign out" : undefined}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "9px 14px",
            borderRadius: 10,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.45)",
            fontSize: 13.5,
            fontWeight: 500,
            marginTop: 4,
            transition: "all 0.15s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,0.10)";
            e.currentTarget.style.color = "#EF4444";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "rgba(255,255,255,0.45)";
          }}
        >
          <span style={{ flexShrink: 0 }}>
            <Icon d={ICONS.signout} size={17} />
          </span>
          {!collapsed && <span>Sign Out</span>}
        </button>

        {/* User strip */}
        {!collapsed && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginTop: 16,
              padding: "10px 14px",
              background: "rgba(255,255,255,0.04)",
              borderRadius: 10,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(197,97,44,0.3)",
                border: "1.5px solid rgba(197,97,44,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <span
                  style={{ fontSize: 11, fontWeight: 700, color: "#C5612C" }}
                >
                  {initials}
                </span>
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#fff",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {displayName}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.35)",
                  textTransform: "capitalize",
                }}
              >
                {role}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────
function Topbar({ onMobileMenuOpen, title }) {
  const { unreadCount, hasUnread } = useMiniNotifications();
  const profile = useAuthStore((s) => s.profile);
  const role = useAuthStore((s) => s.profile?.role);

  const displayName =
    profile?.full_name?.trim() || profile?.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const notifPath =
    role === "client"
      ? "/dashboard/notifications"
      : role === "manager"
        ? "/manage/notifications"
        : `/${role}`;

  return (
    <div
      style={{
        height: 64,
        background: "#fff",
        borderBottom: "1px solid #EDE4D8",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Left: mobile burger + title */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button
          onClick={onMobileMenuOpen}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            color: "#5C4A3A",
            display: "flex",
          }}
          className="topbar-burger"
        >
          <Icon d={ICONS.menu} size={20} />
        </button>
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 700,
            fontSize: 18,
            color: "#1A1412",
            margin: 0,
          }}
        >
          {title}
        </h1>
      </div>

      {/* Right: notification bell + avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {/* Bell */}
        <Link
          to={notifPath}
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 38,
            height: 38,
            borderRadius: 10,
            background: hasUnread ? "rgba(197,97,44,0.08)" : "transparent",
            border: hasUnread
              ? "1px solid rgba(197,97,44,0.2)"
              : "1px solid transparent",
            color: "#5C4A3A",
            textDecoration: "none",
            transition: "all 0.18s",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.background = "rgba(197,97,44,0.08)")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.background = hasUnread
              ? "rgba(197,97,44,0.08)"
              : "transparent")
          }
        >
          <Icon d={ICONS.bell} size={18} />
          {hasUnread && (
            <span
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#C5612C",
                border: "1.5px solid #fff",
                fontSize: 9,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            />
          )}
        </Link>

        {/* Avatar */}
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "rgba(197,97,44,0.15)",
            border: "1.5px solid rgba(197,97,44,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "default",
            fontSize: 12,
            fontWeight: 700,
            color: "#C5612C",
          }}
        >
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          ) : (
            initials
          )}
        </div>
      </div>

      <style>{`
        @media (min-width: 900px) { .topbar-burger { display: none !important; } }
      `}</style>
    </div>
  );
}

// ─── Main DashboardLayout ─────────────────────────────────────────────────────
export default function DashboardLayout({ children, pageTitle }) {
  const profile = useAuthStore((s) => s.profile);
  const role = profile?.role;
  const { tenant, branding, injectBranding } = useTenant();
  const signOut = useSignOutWithCleanup();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Inject tenant branding CSS variables
  useEffect(() => {
    if (branding) injectBranding();
  }, [branding, injectBranding]);

  // Close mobile drawer on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Keyboard: Escape closes drawer
  useEffect(() => {
    const fn = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate("/", { replace: true });
  }, [signOut, navigate]);

  const navItems = getNavItems(role);
  const logoUrl = branding?.logo_url ?? null;

  // Derive page title from location if not provided
  const derivedTitle = (() => {
    if (pageTitle) return pageTitle;
    const parts = location.pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    if (!last) return "Dashboard";
    return last.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  })();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', system-ui, sans-serif; background: #FAF7F2; }

        /* Sidebar scrollbar */
        nav::-webkit-scrollbar { width: 3px; }
        nav::-webkit-scrollbar-track { background: transparent; }
        nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }

        /* Content scrollbar */
        .dash-content::-webkit-scrollbar { width: 5px; }
        .dash-content::-webkit-scrollbar-track { background: #FAF7F2; }
        .dash-content::-webkit-scrollbar-thumb { background: #E8DDD4; border-radius: 99px; }

        @keyframes drawerIn { from{transform:translateX(-100%)} to{transform:translateX(0)} }
        .drawer-enter { animation: drawerIn 0.22s ease both; }

        @media (min-width: 900px) { .dash-overlay { display: none !important; } .dash-mobile-sidebar { display: none !important; } }
        @media (max-width: 899px) { .dash-desktop-sidebar { display: none !important; } }
      `}</style>

      <div style={{ display: "flex", height: "100dvh", overflow: "hidden" }}>
        {/* Desktop sidebar */}
        <div className="dash-desktop-sidebar">
          <Sidebar
            role={role}
            navItems={navItems}
            collapsed={sidebarCollapsed}
            onSignOut={handleSignOut}
            profile={profile}
            tenant={tenant}
            logoUrl={logoUrl}
          />
        </div>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="dash-overlay"
            onClick={() => setMobileOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 200,
              backdropFilter: "blur(2px)",
            }}
          />
        )}

        {/* Mobile sidebar drawer */}
        {mobileOpen && (
          <div
            className="dash-mobile-sidebar drawer-enter"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              bottom: 0,
              zIndex: 210,
              display: "flex",
            }}
          >
            <Sidebar
              role={role}
              navItems={navItems}
              collapsed={false}
              onSignOut={handleSignOut}
              profile={profile}
              tenant={tenant}
              logoUrl={logoUrl}
            />
            <button
              onClick={() => setMobileOpen(false)}
              style={{
                position: "absolute",
                top: 16,
                right: -40,
                background: "rgba(255,255,255,0.15)",
                border: "none",
                borderRadius: "50%",
                width: 32,
                height: 32,
                cursor: "pointer",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon d={ICONS.close} size={16} />
            </button>
          </div>
        )}

        {/* Main content area */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          {/* Topbar */}
          <Topbar
            onMobileMenuOpen={() => setMobileOpen(true)}
            title={derivedTitle}
          />

          {/* Scrollable page content */}
          <div
            className="dash-content"
            style={{ flex: 1, overflowY: "auto", padding: "32px 28px 48px" }}
          >
            {children}
          </div>
        </div>

        {/* Desktop sidebar collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed((v) => !v)}
          className="dash-desktop-sidebar"
          style={{
            position: "fixed",
            bottom: 24,
            left: sidebarCollapsed ? 68 : 268,
            zIndex: 50,
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "#1A1412",
            border: "1.5px solid rgba(255,255,255,0.15)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(255,255,255,0.6)",
            transition: "left 0.25s ease",
          }}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d={sidebarCollapsed ? "M9 18l6-6-6-6" : "M15 18l-6-6 6-6"} />
          </svg>
        </button>
      </div>

      {/* Mobile bottom navigation — renders its own fixed bar + spacer */}
      <BottomNav />
    </>
  );
}
