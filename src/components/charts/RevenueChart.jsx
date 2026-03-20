import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// =============================================================================
// RevenueChart
//
// Grouped bar chart showing billed (expected) vs collected revenue per month.
// Used on: OwnerDashboard, OwnerFinancialSummaryPage.
//
// Props:
//   data        — { month: string, billed: number, collected: number }[]
//                 "month" can be "Jan", "Feb" … or "YYYY-MM"
//   height      — number px (default 280)
//   currency    — string prefix shown in tooltip (default "KES")
//   showLegend  — boolean (default true)
//   showGrid    — boolean (default true)
//   period      — string — shown as subtitle, e.g. "Last 6 months"
//
// Usage:
//   <RevenueChart data={monthlyRevenue} height={300} />
// =============================================================================

// ── Shared dark tooltip ───────────────────────────────────────────────────────
function DarkTooltip({ active, payload, label, currency = "KES" }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#1A1412",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 12,
        padding: "10px 14px",
        fontSize: 12,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        boxShadow: "0 8px 24px rgba(0,0,0,0.30)",
        minWidth: 160,
      }}
    >
      <p
        style={{
          color: "rgba(255,255,255,0.55)",
          marginBottom: 6,
          fontWeight: 600,
        }}
      >
        {label}
      </p>
      {payload.map((p) => (
        <p
          key={p.name}
          style={{ color: p.color, margin: "3px 0", fontWeight: 600 }}
        >
          {p.name}: {currency} {Number(p.value).toLocaleString("en-KE")}
        </p>
      ))}
      {payload.length === 2 && (
        <p
          style={{
            color: "rgba(255,255,255,0.35)",
            marginTop: 6,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            paddingTop: 6,
            fontSize: 11,
          }}
        >
          Collection rate:{" "}
          <span style={{ color: "#10B981", fontWeight: 700 }}>
            {Math.round((payload[1]?.value / payload[0]?.value) * 100) || 0}%
          </span>
        </p>
      )}
    </div>
  );
}

// ── Format big KES numbers on the Y axis ─────────────────────────────────────
function formatYAxis(val) {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`;
  return val;
}

export default function RevenueChart({
  data = [],
  height = 280,
  currency = "KES",
  showLegend = true,
  showGrid = true,
}) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
          barCategoryGap="28%"
          barGap={3}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(0,0,0,0.06)"
              vertical={false}
            />
          )}

          <XAxis
            dataKey="month"
            tick={{
              fontSize: 11,
              fill: "#8B7355",
              fontFamily: "'DM Sans', system-ui",
            }}
            axisLine={false}
            tickLine={false}
            dy={6}
          />

          <YAxis
            tickFormatter={formatYAxis}
            tick={{
              fontSize: 11,
              fill: "#8B7355",
              fontFamily: "'DM Sans', system-ui",
            }}
            axisLine={false}
            tickLine={false}
            width={44}
          />

          <Tooltip
            content={<DarkTooltip currency={currency} />}
            cursor={{ fill: "rgba(197,97,44,0.05)", radius: 4 }}
          />

          {showLegend && (
            <Legend
              wrapperStyle={{
                fontSize: 12,
                color: "#5C4A3A",
                fontFamily: "'DM Sans', system-ui",
                paddingTop: 10,
              }}
              iconType="circle"
              iconSize={8}
            />
          )}

          {/* Expected / billed — muted charcoal */}
          <Bar
            dataKey="billed"
            name="Billed"
            fill="#E8DDD4"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />

          {/* Collected — brand terracotta */}
          <Bar
            dataKey="collected"
            name="Collected"
            fill="#C5612C"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export { RevenueChart };
