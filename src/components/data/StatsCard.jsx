// =============================================================================
// StatsCard
//
// Dashboard KPI tile. Used in the 2–6 column stats row at the top of every
// dashboard. Compact, data-dense, with clear visual hierarchy.
//
// Props:
//   label     — string           e.g. "Total Rooms"
//   value     — string | number  e.g. "48" or "KES 124,500"
//   icon      — ReactNode        SVG icon (18×18 recommended)
//   trend     — { value: number, label: string } — e.g. {value: 12, label: "vs last month"}
//   color     — "brand" | "success" | "warning" | "error" | "info" | "neutral"
//   loading   — boolean — show skeleton
//   onClick   — fn — makes the card clickable
//   sublabel  — string — small text below value (e.g. "of 48 rooms")
//
// Usage:
//   <StatsCard label="Occupied Rooms" value="36" sublabel="of 48 rooms" icon={<HomeIcon />} color="success" trend={{ value: 4, label: "this week" }} />
//   <StatsCard label="Overdue Payments" value="KES 12,500" icon={<AlertIcon />} color="error" />
// =============================================================================

const COLOR_TOKENS = {
  brand:   { icon: "#C5612C", iconBg: "#FFF5EF", badge: "#C5612C",  badgeBg: "rgba(197,97,44,0.1)",  trend: "#C5612C"  },
  success: { icon: "#059669", iconBg: "#ECFDF5", badge: "#059669",  badgeBg: "rgba(5,150,105,0.1)",  trend: "#059669"  },
  warning: { icon: "#D97706", iconBg: "#FFFBEB", badge: "#D97706",  badgeBg: "rgba(217,119,6,0.1)",  trend: "#D97706"  },
  error:   { icon: "#DC2626", iconBg: "#FEF2F2", badge: "#DC2626",  badgeBg: "rgba(220,38,38,0.1)",  trend: "#DC2626"  },
  info:    { icon: "#2563EB", iconBg: "#EFF6FF", badge: "#2563EB",  badgeBg: "rgba(37,99,235,0.08)", trend: "#2563EB"  },
  neutral: { icon: "#5C4A3A", iconBg: "#F5EDE0", badge: "#5C4A3A",  badgeBg: "rgba(92,74,58,0.08)",  trend: "#5C4A3A"  },
};

function TrendIcon({ positive }) {
  return positive ? (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  ) : (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

function Bone({ w = "100%", h = 14, r = 6 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: "linear-gradient(90deg,#F0E8DE 0%,#FAF7F2 50%,#F0E8DE 100%)",
      backgroundSize: "200% 100%",
      animation: "sc-shimmer 1.6s ease-in-out infinite",
    }}/>
  );
}

export default function StatsCard({
  label    = "Metric",
  value    = "—",
  icon,
  trend,
  color    = "brand",
  loading  = false,
  onClick,
  sublabel,
}) {
  const c        = COLOR_TOKENS[color] ?? COLOR_TOKENS.brand;
  const isPositive = trend?.value >= 0;

  return (
    <>
      <style>{`@keyframes sc-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        style={{
          background:   "#fff",
          borderRadius: 16,
          border:       "1px solid #EDE4D8",
          padding:      "18px 20px",
          display:      "flex",
          flexDirection:"column",
          gap:          10,
          cursor:       onClick ? "pointer" : "default",
          transition:   "box-shadow 0.2s, transform 0.2s",
          boxShadow:    "0 2px 8px rgba(0,0,0,0.05)",
          minWidth:     0,
          userSelect:   "none",
        }}
        onMouseOver={e => { if (onClick) { e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)"; e.currentTarget.style.transform = "translateY(-2px)"; } }}
        onMouseOut={e  => { if (onClick) { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";  e.currentTarget.style.transform = "translateY(0)"; } }}
      >
        {loading ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Bone w={32} h={32} r={10} />
              <Bone w="30%" h={18} r={999} />
            </div>
            <Bone w="55%" h={28} r={6} />
            <Bone w="40%" h={12} r={6} />
          </>
        ) : (
          <>
            {/* Top row: icon + trend badge */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              {/* Icon */}
              {icon && (
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: c.iconBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: c.icon,
                }}>
                  {icon}
                </div>
              )}

              {/* Trend badge */}
              {trend && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 3,
                  fontSize: 11, fontWeight: 700,
                  color: isPositive ? "#059669" : "#DC2626",
                  background: isPositive ? "#ECFDF5" : "#FEF2F2",
                  border: `1px solid ${isPositive ? "#A7F3D0" : "#FECACA"}`,
                  borderRadius: 999,
                  padding: "3px 8px",
                }}>
                  <TrendIcon positive={isPositive} />
                  {Math.abs(trend.value)}%
                </div>
              )}
            </div>

            {/* Value */}
            <div>
              <p style={{
                fontFamily:  "'Playfair Display', serif",
                fontWeight:  900,
                fontSize:    "clamp(20px, 2.5vw, 26px)",
                color:       "#1A1412",
                margin:      "0 0 2px",
                lineHeight:  1.1,
                overflow:    "hidden",
                textOverflow:"ellipsis",
                whiteSpace:  "nowrap",
              }}>
                {value}
              </p>
              {sublabel && (
                <p style={{ fontSize: 11, color: "#8B7355", margin: 0, lineHeight: 1 }}>{sublabel}</p>
              )}
            </div>

            {/* Label + trend text */}
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8 }}>
              <p style={{ fontSize: 13, color: "#5C4A3A", margin: 0, fontWeight: 500, lineHeight: 1.3 }}>
                {label}
              </p>
              {trend?.label && (
                <p style={{ fontSize: 10, color: "#8B7355", margin: 0, textAlign: "right", whiteSpace: "nowrap" }}>
                  {trend.label}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
