import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// =============================================================================
// BillingStatusDonut
//
// Donut chart showing billing cycle count (or value) split by status.
// Used on: OwnerDashboard, ManagerBillingPage, OwnerAnalyticsPage.
//
// Props:
//   data       — { status: string, count: number, amount?: number }[]
//                status must be one of the billing status enum values
//   valueKey   — "count" | "amount" (default "count")
//   currency   — string (default "KES")
//   height     — number px (default 220)
//   innerRadius— number px (default 52)
//   showLegend — boolean (default true)
//
// Usage:
//   <BillingStatusDonut data={[
//     { status: "paid",    count: 32, amount: 458000 },
//     { status: "unpaid",  count: 8,  amount: 112000 },
//     { status: "overdue", count: 4,  amount: 56000  },
//     { status: "partial", count: 3,  amount: 28000  },
//   ]} />
// =============================================================================

const STATUS_META = {
  paid: { label: "Paid", color: "#10B981" },
  partial: { label: "Partial", color: "#3B82F6" },
  unpaid: { label: "Unpaid", color: "#F59E0B" },
  overdue: { label: "Overdue", color: "#EF4444" },
  waived: { label: "Waived", color: "#8B5CF6" },
  cancelled: { label: "Cancelled", color: "#8B7355" },
};

function DarkTooltip({ active, payload, valueKey, currency }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  const meta = STATUS_META[payload[0]?.payload?.status];
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
      <p
        style={{ color: meta?.color ?? "#fff", fontWeight: 700, fontSize: 15 }}
      >
        {valueKey === "amount"
          ? `${currency} ${Number(value).toLocaleString("en-KE")}`
          : `${value} cycle${value !== 1 ? "s" : ""}`}
      </p>
    </div>
  );
}

export default function BillingStatusDonut({
  data = [],
  valueKey = "count",
  currency = "KES",
  height = 220,
  innerRadius = 52,
  showLegend = true,
}) {
  const total = data.reduce((s, d) => s + (d[valueKey] ?? 0), 0);

  // Build enriched data with label + colour from STATUS_META
  const enriched = data
    .filter((d) => (d[valueKey] ?? 0) > 0)
    .map((d) => ({
      ...d,
      name: STATUS_META[d.status]?.label ?? d.status,
      value: d[valueKey],
      color: STATUS_META[d.status]?.color ?? "#8B7355",
    }));

  const cx = "50%";
  const cy = showLegend ? "42%" : "50%";

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={enriched}
            cx={cx}
            cy={cy}
            innerRadius={innerRadius}
            outerRadius={innerRadius + 30}
            paddingAngle={3}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
          >
            {enriched.map((entry, i) => (
              <Cell key={i} fill={entry.color} stroke="none" />
            ))}
          </Pie>

          {/* Centre stat */}
          <text>
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="central"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 900,
                fontSize: 20,
                fill: "#1A1412",
              }}
            >
              {valueKey === "count"
                ? total
                : total >= 1_000_000
                  ? `${(total / 1_000_000).toFixed(1)}M`
                  : total >= 1_000
                    ? `${(total / 1_000).toFixed(0)}k`
                    : total}
            </text>
            <text
              x={cx}
              y={showLegend ? "calc(42% + 18px)" : "calc(50% + 18px)"}
              textAnchor="middle"
              style={{
                fontFamily: "'DM Sans', system-ui",
                fontSize: 11,
                fill: "#8B7355",
              }}
            >
              {valueKey === "count" ? "total cycles" : `${currency} total`}
            </text>
          </text>

          <Tooltip
            content={<DarkTooltip valueKey={valueKey} currency={currency} />}
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

export { BillingStatusDonut };
