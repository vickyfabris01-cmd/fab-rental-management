import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart,
} from "recharts";

// =============================================================================
// OccupancyTrendLine
//
// Smooth line (or area) chart showing occupancy rate % over time.
// Used on: OwnerDashboard summary panel, OccupancyReportPage.
//
// Props:
//   data     — { month: string, rate: number }[]   (rate is 0–100)
//   height   — number px (default 200)
//   variant  — "line" | "area" (default "area" — filled gradient under line)
//   target   — number | null — draw a horizontal reference line (e.g. 85 for 85% target)
//   color    — hex string (default brand terracotta #C5612C)
//
// Usage:
//   <OccupancyTrendLine data={trend} target={85} />
//   <OccupancyTrendLine data={trend} variant="line" height={160} />
// =============================================================================

function DarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const rate = payload[0]?.value ?? 0;
  return (
    <div style={{
      background: "#1A1412", border: "1px solid rgba(255,255,255,0.10)",
      borderRadius: 12, padding: "10px 14px", fontSize: 12,
      fontFamily: "'DM Sans', system-ui", boxShadow: "0 8px 24px rgba(0,0,0,0.30)",
    }}>
      <p style={{ color: "rgba(255,255,255,0.55)", marginBottom: 4, fontWeight: 600 }}>{label}</p>
      <p style={{
        color:  rate >= 85 ? "#10B981" : rate >= 70 ? "#F59E0B" : "#EF4444",
        fontWeight: 700, fontSize: 16,
      }}>
        {rate}%
      </p>
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, marginTop: 2 }}>occupancy rate</p>
    </div>
  );
}

// Shared active dot style
const activeDot = { r: 5, fill: "#C5612C", strokeWidth: 2, stroke: "#fff" };

export default function OccupancyTrendLine({
  data    = [],
  height  = 200,
  variant = "area",
  target  = null,
  color   = "#C5612C",
}) {
  const gradientId = "occ-gradient";

  if (variant === "area") {
    return (
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.18} />
                <stop offset="95%" stopColor={color} stopOpacity={0.0}  />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />

            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#8B7355", fontFamily: "'DM Sans', system-ui" }}
              axisLine={false} tickLine={false} dy={6}
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={v => `${v}%`}
              tick={{ fontSize: 11, fill: "#8B7355", fontFamily: "'DM Sans', system-ui" }}
              axisLine={false} tickLine={false} width={38}
            />

            <Tooltip content={<DarkTooltip />} />

            {target != null && (
              <ReferenceLine
                y={target}
                stroke="#10B981"
                strokeDasharray="5 5"
                strokeWidth={1.5}
                label={{
                  value: `Target ${target}%`,
                  position: "insideTopRight",
                  fill: "#10B981",
                  fontSize: 10,
                  fontFamily: "'DM Sans', system-ui",
                }}
              />
            )}

            <Area
              type="monotone"
              dataKey="rate"
              name="Occupancy"
              stroke={color}
              strokeWidth={2.5}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={activeDot}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Line variant
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />

          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "#8B7355", fontFamily: "'DM Sans', system-ui" }}
            axisLine={false} tickLine={false} dy={6}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={v => `${v}%`}
            tick={{ fontSize: 11, fill: "#8B7355", fontFamily: "'DM Sans', system-ui" }}
            axisLine={false} tickLine={false} width={38}
          />

          <Tooltip content={<DarkTooltip />} />

          {target != null && (
            <ReferenceLine
              y={target}
              stroke="#10B981"
              strokeDasharray="5 5"
              strokeWidth={1.5}
            />
          )}

          <Line
            type="monotone"
            dataKey="rate"
            name="Occupancy"
            stroke={color}
            strokeWidth={2.5}
            dot={{ r: 3, fill: color, strokeWidth: 0 }}
            activeDot={activeDot}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
