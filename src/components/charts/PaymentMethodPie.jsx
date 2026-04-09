import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// =============================================================================
// PaymentMethodPie
//
// Donut chart showing payment volume breakdown by method.
// Used on: OwnerDashboard, OwnerAnalyticsPage, ManagerPaymentsPage.
//
// Props:
//   data       — { name: string, value: number }[]
//                name should be one of: "M-Pesa" | "Cash" | "Bank Transfer" | "Other"
//                value is the amount in KES (or count — controlled by valueType)
//   height     — number px (default 220)
//   valueType  — "amount" | "count" (default "amount") — affects tooltip label
//   currency   — string (default "KES")
//   innerRadius— number px (default 52) — controls donut hole size
//   showLegend — boolean (default true)
//
// Usage:
//   <PaymentMethodPie data={[{name:"M-Pesa",value:298000},{name:"Cash",value:42000}]} />
// =============================================================================

// Method colours — fixed so they're consistent across every chart in the app
const METHOD_COLORS = {
  "M-Pesa": "#10B981",
  Cash: "#C5612C",
  "Bank Transfer": "#3B82F6",
  Other: "#8B7355",
};

// Fallback palette for unknown methods
const FALLBACK_COLORS = ["#C5612C", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"];

function getColor(name, index) {
  return METHOD_COLORS[name] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

function DarkTooltip({ active, payload, valueType, currency }) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: row } = payload[0];
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
        minWidth: 150,
      }}
    >
      <p
        style={{
          color: "rgba(255,255,255,0.55)",
          marginBottom: 4,
          fontWeight: 600,
        }}
      >
        {name}
      </p>
      <p style={{ color: row.color ?? "#fff", fontWeight: 700, fontSize: 15 }}>
        {valueType === "amount"
          ? `${currency} ${Number(value).toLocaleString("en-KE")}`
          : `${value} payments`}
      </p>
    </div>
  );
}

// Centre label rendered inside the donut hole
function CentreLabel({ cx, cy, total, currency, valueType }) {
  // Guard against NaN when data is empty
  const safeTotal = isNaN(total) ? 0 : total;
  const label =
    valueType === "amount"
      ? safeTotal >= 1_000_000
        ? `${(safeTotal / 1_000_000).toFixed(1)}M`
        : safeTotal >= 1_000
          ? `${(safeTotal / 1_000).toFixed(0)}k`
          : String(safeTotal)
      : String(safeTotal);

  // Use a single <text> with <tspan> children to avoid the "42%-8" / "42%12"
  // SVG attribute concatenation bug that occurs when dy is applied to a
  // percentage-based y value in some renderers.
  return (
    <text x={cx} textAnchor="middle" fontFamily="'DM Sans', system-ui">
      <tspan
        x={cx}
        y={cy}
        dy="-8"
        dominantBaseline="central"
        fill="#1A1412"
        fontWeight={900}
        fontSize={18}
        fontFamily="'Playfair Display', serif"
      >
        {valueType === "amount" ? `${currency} ` : ""}{label}
      </tspan>
      <tspan
        x={cx}
        dy={22}
        dominantBaseline="central"
        fill="#8B7355"
        fontSize={11}
      >
        total {valueType === "amount" ? "collected" : "payments"}
      </tspan>
    </text>
  );
}

export default function PaymentMethodPie({
  data = [],
  height = 220,
  valueType = "amount",
  currency = "KES",
  innerRadius = 52,
  showLegend = true,
}) {
  const total = data.reduce((s, d) => s + (d.value ?? 0), 0);

  // Enrich data with colours
  const enriched = data.map((d, i) => ({
    ...d,
    color: getColor(d.name, i),
  }));

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={enriched}
            cx="50%"
            cy={showLegend ? "42%" : "50%"}
            innerRadius={innerRadius}
            outerRadius={innerRadius + 32}
            paddingAngle={3}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
          >
            {enriched.map((entry, i) => (
              <Cell key={`cell-${i}`} fill={entry.color} stroke="none" />
            ))}
          </Pie>

          {/* Custom centre label — rendered directly (no wrapper <text> to avoid nested SVG error) */}
          <CentreLabel
            cx="50%"
            cy={showLegend ? "42%" : "50%"}
            total={total}
            currency={currency}
            valueType={valueType}
          />

          <Tooltip
            content={<DarkTooltip valueType={valueType} currency={currency} />}
          />

          {showLegend && (
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{
                fontSize: 12,
                color: "#5C4A3A",
                fontFamily: "'DM Sans', system-ui",
                paddingTop: 8,
              }}
              formatter={(value, entry) => {
                const pct =
                  total > 0
                    ? Math.round((entry.payload.value / total) * 100)
                    : 0;
                return `${value} (${pct}%)`;
              }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export { PaymentMethodPie };
