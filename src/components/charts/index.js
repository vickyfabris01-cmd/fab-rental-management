// =============================================================================
// components/charts/index.js
// All chart components. Requires: npm install recharts
//
// Usage:
//   import { RevenueChart, OccupancyChart, TrendSparkline } from "@/components/charts";
//   import { RevenueChart } from "@/components";   ← also works via master barrel
// =============================================================================

export { default as RevenueChart }        from "./RevenueChart.jsx";
export { default as OccupancyChart }      from "./OccupancyChart.jsx";
export { default as OccupancyTrendLine }  from "./OccupancyTrendLine.jsx";
export { default as PaymentMethodPie }    from "./PaymentMethodPie.jsx";
export { default as BillingStatusDonut }  from "./BillingStatusDonut.jsx";
export { default as GrowthLineChart }     from "./GrowthLineChart.jsx";
export { default as TrendSparkline, SparkBar } from "./TrendSparkline.jsx";
