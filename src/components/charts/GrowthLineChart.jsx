import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";

// =============================================================================
// GrowthLineChart
//
// Multi-series line chart for platform-level growth metrics.
// Used on: SuperAdminDashboard, AdminAnalyticsPage.
//
// Props:
//   data     — { month: string, [seriesKey]: number }[]
//              e.g. [{ month:"Jan", tenants:12, users:148, revenue:890000 }]
//   series   — { key: string, label: string, color?: string }[]
//              defines which keys to plot and their display labels
//   height   — number px (default 260)
//   showGrid — boolean (default true)
//
// Default series if none provided:
//   tenants (terracotta) + users (blue) + revenue (green, right Y axis)
//
// Usage:
//   <GrowthLineChart data={platformStats} />
//
//   <GrowthLineChart
//     data={data}
//     series={[
//       { key: "active_tenants", label: "Active Tenants", color: "#C5612C" },
//       { key: "new_signups",    label: "New Sign-ups",   color: "#3B82F6" },
//     ]}
//   />
// =============================================================================

const DEFAULT_SERIES = [
  { key: "tenants", label: "Tenants",  color: "#C5612C" },
  { key: "users",   label: "Users",    color: "#3B82F6" },
];

const DOT_STYLE  = (color) => ({ r: 3, fill: color, strokeWidth: 0 });
const ACTIVE_DOT = (color) => ({ r: 5, fill: color, strokeWidth: 2, stroke: "#fff" });

function DarkTooltip({ active, payload, label, series }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#0F0D0C", border: "1px solid rgba(255,255,255,0.10)",
      borderRadius: 12, padding: "10px 14px", fontSize: 12,
      fontFamily: "'DM Sans', system-ui", boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
      minWidth: 160,
    }}>
      <p style={{ color: "rgba(255,255,255,0.45)", marginBottom: 7, fontWeight: 600, fontSize: 11, letterSpacing: "0.05em" }}>
        {label}
      </p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color, margin: "4px 0", fontWeight: 600 }}>
          {p.name}:{" "}
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 14 }}>
            {typeof p.value === "number" && p.value > 9999
              ? p.value >= 1_000_000
                ? `KES ${(p.value / 1_000_000).toFixed(1)}M`
                : `KES ${(p.value / 1_000).toFixed(0)}k`
              : p.value.toLocaleString()}
          </span>
        </p>
      ))}
    </div>
  );
}

export default function GrowthLineChart({
  data     = [],
  series   = DEFAULT_SERIES,
  height   = 260,
  showGrid = true,
}) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.06)"
              vertical={false}
            />
          )}

          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "rgba(255,255,255,0.35)", fontFamily: "'DM Sans', system-ui" }}
            axisLine={false} tickLine={false} dy={6}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "rgba(255,255,255,0.35)", fontFamily: "'DM Sans', system-ui" }}
            axisLine={false} tickLine={false} width={36}
            tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
          />

          <Tooltip content={<DarkTooltip series={series} />} />

          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{
              fontSize: 12,
              color: "rgba(255,255,255,0.45)",
              fontFamily: "'DM Sans', system-ui",
              paddingTop: 10,
            }}
          />

          {series.map((s, i) => {
            const color = s.color ?? ["#C5612C", "#3B82F6", "#10B981", "#F59E0B"][i % 4];
            return (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={color}
                strokeWidth={2}
                dot={DOT_STYLE(color)}
                activeDot={ACTIVE_DOT(color)}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
