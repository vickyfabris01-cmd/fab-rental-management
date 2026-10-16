// src/components/charts/index.js — MODIFIED FILE (Phase 4: LineTrend, BarCompare, DonutBreakdown added at the bottom)
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

// Phase 4: token-coloured, reusable charts (also used by Phase 5 reports)
export { default as LineTrend }         from "./LineTrend.jsx";
export { default as BarCompare }        from "./BarCompare.jsx";
export { default as DonutBreakdown }    from "./DonutBreakdown.jsx";
