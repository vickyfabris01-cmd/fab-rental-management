// =============================================================================
// PageHeader
//
// Standardised heading block rendered at the top of every dashboard page.
// Handles: page title, subtitle, breadcrumb trail, right-side action buttons.
//
// Props:
//   title      — string (required)
//   subtitle   — string | null
//   breadcrumb — { label, to }[] — auto-built from React Router if omitted
//   actions    — ReactNode — buttons, dropdowns rendered on the right
//   back       — boolean | string — show back arrow; string = custom href
//   border     — boolean — bottom border (default true)
//
// Usage:
//   <PageHeader
//     title="Residents"
//     subtitle="Manage all current and past tenants"
//     actions={<Button variant="primary" leftIcon={<PlusIcon />}>Add Resident</Button>}
//   />
//
//   <PageHeader title="Room A4" back breadcrumb={[{label:"Properties",to:"/manage/properties"},{label:"Room A4"}]} />
// =============================================================================

import { useNavigate, useLocation, Link } from "react-router-dom";

function ChevronRight() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6"/>
    </svg>
  );
}

function ArrowLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7"/>
    </svg>
  );
}

// Auto-generate breadcrumb from pathname
function useBreadcrumb(crumbs) {
  const location = useLocation();
  if (crumbs) return crumbs;

  const segments = location.pathname.split("/").filter(Boolean);
  return segments.map((seg, i) => ({
    label: seg.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    to: "/" + segments.slice(0, i + 1).join("/"),
  }));
}

export default function PageHeader({
  title,
  subtitle,
  breadcrumb: crumbsProp,
  actions,
  back    = false,
  border  = true,
  style: extraStyle = {},
}) {
  const navigate = useNavigate();
  const crumbs   = useBreadcrumb(crumbsProp);
  const showCrumbs = crumbs.length > 1;

  return (
    <div style={{
      marginBottom:  24,
      paddingBottom: border ? 20 : 0,
      borderBottom:  border ? "1px solid #EDE4D8" : "none",
      ...extraStyle,
    }}>

      {/* Breadcrumb */}
      {showCrumbs && (
        <nav aria-label="Breadcrumb" style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
          {crumbs.map((crumb, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {i > 0 && <span style={{ color: "#C5C0B8" }}><ChevronRight /></span>}
              {i < crumbs.length - 1 ? (
                <Link to={crumb.to} style={{ fontSize: 12, color: "#8B7355", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseOver={e => e.currentTarget.style.color = "#C5612C"}
                  onMouseOut={e  => e.currentTarget.style.color = "#8B7355"}
                >
                  {crumb.label}
                </Link>
              ) : (
                <span style={{ fontSize: 12, color: "#5C4A3A", fontWeight: 600 }}>{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Main row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>

        {/* Left: back button + title */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, minWidth: 0 }}>
          {back && (
            <button
              onClick={() => typeof back === "string" ? navigate(back) : navigate(-1)}
              aria-label="Go back"
              style={{
                display:    "flex", alignItems: "center", justifyContent: "center",
                width:      32, height: 32, borderRadius: 8, flexShrink: 0,
                background: "#fff", border: "1.5px solid #E8DDD4",
                cursor:     "pointer", color: "#5C4A3A", marginTop: 2,
                transition: "all 0.15s",
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = "#C5612C"; e.currentTarget.style.color = "#C5612C"; }}
              onMouseOut={e  => { e.currentTarget.style.borderColor = "#E8DDD4"; e.currentTarget.style.color = "#5C4A3A"; }}
            >
              <ArrowLeft />
            </button>
          )}

          <div style={{ minWidth: 0 }}>
            <h1 style={{
              fontFamily:  "'Playfair Display', serif",
              fontWeight:  900,
              fontSize:    "clamp(22px, 3vw, 28px)",
              color:       "#1A1412",
              margin:      0,
              lineHeight:  1.2,
              overflow:    "hidden",
              textOverflow:"ellipsis",
              whiteSpace:  "nowrap",
            }}>
              {title}
            </h1>
            {subtitle && (
              <p style={{ fontSize: 14, color: "#8B7355", margin: "5px 0 0", lineHeight: 1.5, fontWeight: 400 }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: actions */}
        {actions && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
