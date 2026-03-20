import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

// =============================================================================
// OccupancyChart
//
// Bar chart showing room occupancy breakdown per building.
// Supports two variants:
//   variant="grouped" — side-by-side occupied vs available bars (default)
//   variant="stacked" — stacked bars showing full room count breakdown
//
// Props:
//   data      — { name: string, occupied: number, available: number, maintenance?: number }[]
//   height    — number px (default 240)
//   variant   — "grouped" | "stacked"
//   showRate  — boolean — show occupancy rate % label above each bar group
//
// Usage:
//   <OccupancyChart data={buildingStats} />
//   <OccupancyChart data={buildingStats} variant="stacked" height={260} />
// =============================================================================

function DarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value ?? 0), 0);
  const occupied = payload.find((p) => p.dataKey === "occupied")?.value ?? 0;
  const rate = total > 0 ? Math.round((occupied / total) * 100) : 0;

  return (
    <div
      style={{
        background: "#1A1412",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 12,
        padding: "10px 14px",
        fontSize: 12,
        fontFamily: "'DM Sans', system-ui",
        boxShadow: "0 8px 24px rgba(0,0,0,0.30)",
        minWidth: 140,
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
          style={{ color: p.fill ?? p.color, margin: "3px 0", fontWeight: 600 }}
        >
          {p.name}: {p.value} rooms
        </p>
      ))}
      <p
        style={{
          color: "#10B981",
          marginTop: 6,
          fontWeight: 700,
          borderTop: "1px solid rgba(255,255,255,0.08)",
          paddingTop: 6,
          fontSize: 11,
        }}
      >
        Occupancy: {rate}%
      </p>
    </div>
  );
}

function RateLabel({ x, y, width, value, index, data }) {
  if (!data?.[index]) return null;
  const row = data[index];
  const total =
    (row.occupied ?? 0) + (row.available ?? 0) + (row.maintenance ?? 0);
  const rate = total > 0 ? Math.round(((row.occupied ?? 0) / total) * 100) : 0;
  return (
    <text
      x={x + width / 2}
      y={y - 6}
      textAnchor="middle"
      fill="#5C4A3A"
      fontSize={10}
      fontFamily="'DM Sans', system-ui"
      fontWeight={700}
    >
      {rate}%
    </text>
  );
}

export default function OccupancyChart({
  data = [],
  height = 240,
  variant = "grouped",
  showRate = false,
}) {
  const isStacked = variant === "stacked";

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: showRate ? 24 : 8, right: 8, left: 0, bottom: 0 }}
          barCategoryGap="30%"
          barGap={isStacked ? 0 : 3}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(0,0,0,0.06)"
            vertical={false}
          />

          <XAxis
            dataKey="name"
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
            tick={{
              fontSize: 11,
              fill: "#8B7355",
              fontFamily: "'DM Sans', system-ui",
            }}
            axisLine={false}
            tickLine={false}
            width={36}
            allowDecimals={false}
          />

          <Tooltip
            content={<DarkTooltip />}
            cursor={{ fill: "rgba(197,97,44,0.05)" }}
          />

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

          {/* Occupied */}
          <Bar
            dataKey="occupied"
            name="Occupied"
            fill="#C5612C"
            radius={isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
            stackId={isStacked ? "a" : undefined}
            maxBarSize={48}
            label={
              showRate && !isStacked ? <RateLabel data={data} /> : undefined
            }
          />

          {/* Available */}
          <Bar
            dataKey="available"
            name="Available"
            fill="#10B981"
            radius={isStacked ? [4, 4, 0, 0] : [4, 4, 0, 0]}
            stackId={isStacked ? "a" : undefined}
            maxBarSize={48}
          />

          {/* Maintenance (optional field) */}
          {data.some((d) => d.maintenance != null) && (
            <Bar
              dataKey="maintenance"
              name="Maintenance"
              fill="#F59E0B"
              radius={[0, 0, 0, 0]}
              stackId={isStacked ? "a" : undefined}
              maxBarSize={48}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
export { OccupancyChart };
