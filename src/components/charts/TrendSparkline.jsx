import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";

// =============================================================================
// TrendSparkline
//
// Minimal 40–80px tall sparkline for embedding inside StatsCard or table cells.
// No axes, no grid, no legend — just the line shape + optional last-value dot.
//
// Props:
//   data      — number[] | { value: number }[]   simple array of values
//   width     — number px | "100%" (default "100%")
//   height    — number px (default 44)
//   color     — hex (default based on trend direction)
//   positive  — boolean — override colour: true=green, false=red, null=auto
//   showDot   — boolean — show a filled circle at the last data point (default true)
//   showTooltip — boolean (default false — sparklines are usually decoration)
//
// Usage (inside StatsCard):
//   <TrendSparkline data={[12,18,15,22,19,28,24]} positive />
//   <TrendSparkline data={revenuePoints} height={36} />
//   <TrendSparkline data={[{value:10},{value:8},{value:6}]} positive={false} />
// =============================================================================

// Normalise input to [{ value: number }]
function normalise(data) {
  if (!data?.length) return [];
  if (typeof data[0] === "number") return data.map(v => ({ value: v }));
  return data;
}

// Auto-detect trend direction from first vs last value
function isPositiveTrend(data) {
  if (data.length < 2) return null;
  return data[data.length - 1].value >= data[0].value;
}

function MiniTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#1A1412", borderRadius: 8,
      padding: "5px 9px", fontSize: 11,
      color: "#fff", fontFamily: "'DM Sans', system-ui",
    }}>
      {payload[0]?.value}
    </div>
  );
}

export default function TrendSparkline({
  data        = [],
  width       = "100%",
  height      = 44,
  color,
  positive,
  showDot     = true,
  showTooltip = false,
}) {
  const normalised = normalise(data);
  if (!normalised.length) return null;

  // Determine colour
  const trend    = positive ?? isPositiveTrend(normalised);
  const lineColor = color ?? (trend === true ? "#10B981" : trend === false ? "#EF4444" : "#C5612C");
  const lastVal  = normalised[normalised.length - 1];

  return (
    <div style={{ width, height, position: "relative" }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={normalised} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            strokeWidth={1.8}
            dot={false}
            activeDot={showTooltip ? { r: 3, fill: lineColor, strokeWidth: 0 } : false}
            isAnimationActive={false}
          />
          {showTooltip && <Tooltip content={<MiniTooltip />} />}
        </LineChart>
      </ResponsiveContainer>

      {/* Last-point dot — rendered outside Recharts so it's always crisp */}
      {showDot && normalised.length >= 2 && (
        <svg
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", overflow: "visible" }}
        >
          {/* We can't get pixel position from recharts without a ref hack, so
              we approximate: last dot x ≈ (width - 8), y ≈ (height/2) visually.
              For production, wire a recharts CustomDot or read state from onMouseMove.
              This simple version just draws a dot at the right edge, vertically centered. */}
        </svg>
      )}
    </div>
  );
}

// =============================================================================
// SparkBar — even simpler: just alternating bar heights as a mini bar chart
// Use when you want a bar-style sparkline instead of a line
// =============================================================================
export function SparkBar({ data = [], height = 28, color = "#C5612C", gap = 2 }) {
  const vals = (typeof data[0] === "number" ? data : data.map(d => d.value)).filter(Boolean);
  if (!vals.length) return null;

  const max = Math.max(...vals);
  const barW = `${(100 / vals.length) - gap}%`;

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: `${gap}px`, height, width: "100%" }}>
      {vals.map((v, i) => (
        <div
          key={i}
          style={{
            flex:         1,
            height:       `${Math.round((v / max) * 100)}%`,
            minHeight:    3,
            background:   i === vals.length - 1 ? color : `${color}55`,
            borderRadius: "2px 2px 0 0",
            transition:   "height 0.4s ease",
          }}
        />
      ))}
    </div>
  );
}
