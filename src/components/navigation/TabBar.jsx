import { Link, useLocation } from "react-router-dom";

// =============================================================================
// TabBar
//
// Horizontal pill/underline tab strip for filtering data or switching views.
// Renders either as router NavLinks (mode="router") or as controlled state (mode="state").
//
// Props:
//   tabs       — { value, label, count? }[]
//   active     — string — currently active tab value (mode="state")
//   onChange   — fn(value) (mode="state")
//   mode       — "state" | "router" (default "state")
//   variant    — "pill" | "underline" (default "pill")
//   size       — "sm" | "md" (default "md")
//
// Usage (controlled):
//   const [tab, setTab] = useState("all");
//   <TabBar tabs={[{value:"all",label:"All"},{value:"pending",label:"Pending",count:3}]}
//           active={tab} onChange={setTab} />
//
// Usage (router):
//   <TabBar mode="router" tabs={[{value:"/manage",label:"Overview"},{value:"/manage/properties",label:"Properties"}]} />
// =============================================================================

const SIZES = {
  sm: { fontSize: 12, padding: "5px 12px",  gap: 4 },
  md: { fontSize: 13, padding: "7px 16px",  gap: 5 },
};

export function TabBar({ tabs = [], active, onChange, mode = "state", variant = "pill", size = "md" }) {
  const location = useLocation();
  const s        = SIZES[size] ?? SIZES.md;

  if (variant === "underline") {
    return (
      <div style={{
        display: "flex", gap: 0,
        borderBottom: "1.5px solid #EDE4D8",
        overflowX: "auto",
        scrollbarWidth: "none",
      }}>
        {tabs.map(tab => {
          const isActive = mode === "router"
            ? location.pathname.startsWith(tab.value)
            : active === tab.value;

          const el = (
            <button
              key={tab.value}
              onClick={() => mode === "state" && onChange?.(tab.value)}
              style={{
                display:     "flex", alignItems: "center", gap: s.gap,
                padding:     `${parseInt(s.padding)} 16px`,
                fontSize:    s.fontSize, fontWeight: isActive ? 700 : 500,
                color:       isActive ? "#C5612C" : "#8B7355",
                background:  "transparent", border: "none",
                borderBottom:`2px solid ${isActive ? "#C5612C" : "transparent"}`,
                marginBottom:"-1.5px",
                cursor:      "pointer", whiteSpace: "nowrap",
                transition:  "all 0.15s",
                fontFamily:  "'DM Sans', system-ui, sans-serif",
              }}
              onMouseOver={e => { if (!isActive) e.currentTarget.style.color = "#5C4A3A"; }}
              onMouseOut={e  => { if (!isActive) e.currentTarget.style.color = "#8B7355"; }}
            >
              {tab.label}
              {tab.count != null && (
                <span style={{
                  background:  isActive ? "#C5612C" : "#E8DDD4",
                  color:       isActive ? "#fff"    : "#5C4A3A",
                  borderRadius: 999, fontSize: 10, fontWeight: 700,
                  padding: "1px 6px", lineHeight: 1.6,
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          );

          return mode === "router" ? (
            <Link key={tab.value} to={tab.value} style={{ textDecoration: "none" }}>
              {el}
            </Link>
          ) : el;
        })}
      </div>
    );
  }

  // Pill variant (default)
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {tabs.map(tab => {
        const isActive = mode === "router"
          ? location.pathname.startsWith(tab.value)
          : active === tab.value;

        const btn = (
          <button
            key={tab.value}
            onClick={() => mode === "state" && onChange?.(tab.value)}
            style={{
              display:      "flex", alignItems: "center", gap: s.gap,
              padding:      s.padding,
              fontSize:     s.fontSize, fontWeight: isActive ? 600 : 500,
              color:        isActive ? "#fff"    : "#5C4A3A",
              background:   isActive ? "#C5612C" : "#fff",
              border:       `1.5px solid ${isActive ? "#C5612C" : "#E8DDD4"}`,
              borderRadius: 999,
              cursor:       "pointer", whiteSpace: "nowrap",
              transition:   "all 0.18s",
              boxShadow:    isActive ? "0 3px 10px rgba(197,97,44,0.22)" : "none",
              fontFamily:   "'DM Sans', system-ui, sans-serif",
            }}
            onMouseOver={e => { if (!isActive) { e.currentTarget.style.borderColor = "#C5612C"; e.currentTarget.style.color = "#C5612C"; } }}
            onMouseOut={e  => { if (!isActive) { e.currentTarget.style.borderColor = "#E8DDD4"; e.currentTarget.style.color = "#5C4A3A"; } }}
          >
            {tab.label}
            {tab.count != null && (
              <span style={{
                background:   isActive ? "rgba(255,255,255,0.25)" : "#F0E8DE",
                color:        isActive ? "#fff" : "#8B7355",
                borderRadius: 999, fontSize: 10, fontWeight: 700,
                padding: "1px 6px", lineHeight: 1.6,
              }}>
                {tab.count}
              </span>
            )}
          </button>
        );

        return mode === "router" ? (
          <Link key={tab.value} to={tab.value} style={{ textDecoration: "none" }}>{btn}</Link>
        ) : <span key={tab.value}>{btn}</span>;
      })}
    </div>
  );
}

// =============================================================================
// Pagination
//
// Props:
//   page      — number (1-based current page)
//   total     — number (total item count)
//   pageSize  — number (items per page, default 20)
//   onChange  — fn(page)
//   showInfo  — boolean — "Showing 1–20 of 84" text (default true)
// =============================================================================
export function Pagination({ page = 1, total = 0, pageSize = 20, onChange, showInfo = true }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1 && total <= pageSize) return null;

  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);

  // Build page number array with ellipsis
  function pageNumbers() {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [];
    pages.push(1);
    if (page > 3)           pages.push("…");
    for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) {
      pages.push(p);
    }
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
    return pages;
  }

  const PageBtn = ({ p, label, disabled: dis }) => {
    const isActive = p === page;
    return (
      <button
        onClick={() => !dis && p !== "…" && onChange?.(p)}
        disabled={dis || p === "…"}
        style={{
          minWidth:     32, height: 32, borderRadius: 8,
          padding:      "0 6px",
          background:   isActive ? "#C5612C" : "#fff",
          color:        isActive ? "#fff" : dis ? "#C5C0B8" : "#5C4A3A",
          border:       `1.5px solid ${isActive ? "#C5612C" : "#E8DDD4"}`,
          fontSize:     13, fontWeight: isActive ? 700 : 500,
          cursor:       dis || p === "…" ? "default" : "pointer",
          transition:   "all 0.15s",
          fontFamily:   "'DM Sans', system-ui, sans-serif",
          display:      "flex", alignItems: "center", justifyContent: "center",
        }}
        onMouseOver={e => { if (!isActive && !dis && p !== "…") { e.currentTarget.style.borderColor = "#C5612C"; e.currentTarget.style.color = "#C5612C"; } }}
        onMouseOut={e  => { if (!isActive && !dis && p !== "…") { e.currentTarget.style.borderColor = "#E8DDD4"; e.currentTarget.style.color = "#5C4A3A"; } }}
      >
        {label ?? p}
      </button>
    );
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, paddingTop: 16 }}>
      {showInfo && (
        <p style={{ fontSize: 13, color: "#8B7355", margin: 0 }}>
          Showing <strong style={{ color: "#1A1412" }}>{from}–{to}</strong> of <strong style={{ color: "#1A1412" }}>{total}</strong>
        </p>
      )}

      <div style={{ display: "flex", gap: 4, alignItems: "center", marginLeft: "auto" }}>
        <PageBtn p={page - 1} label={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        } disabled={page === 1} />

        {pageNumbers().map((p, i) => (
          <PageBtn key={`${p}-${i}`} p={p} />
        ))}

        <PageBtn p={page + 1} label={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        } disabled={page === totalPages} />
      </div>
    </div>
  );
}

// =============================================================================
// Breadcrumb
// Standalone breadcrumb — used in topbar or inline.
// Auto-builds from pathname if crumbs not provided.
// =============================================================================
export function Breadcrumb({ crumbs, style: extra = {} }) {
  const location = useLocation();
  const items    = crumbs ?? location.pathname
    .split("/").filter(Boolean)
    .map((seg, i, arr) => ({
      label: seg.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
      to:    "/" + arr.slice(0, i + 1).join("/"),
    }));

  return (
    <nav aria-label="Breadcrumb" style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap", ...extra }}>
      {items.map((item, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {i > 0 && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#C5C0B8" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          )}
          {i < items.length - 1 ? (
            <Link to={item.to} style={{ fontSize: 12, color: "#8B7355", textDecoration: "none" }}
              onMouseOver={e => e.currentTarget.style.color = "#C5612C"}
              onMouseOut={e  => e.currentTarget.style.color = "#8B7355"}
            >
              {item.label}
            </Link>
          ) : (
            <span style={{ fontSize: 12, color: "#5C4A3A", fontWeight: 600 }}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export default TabBar;
