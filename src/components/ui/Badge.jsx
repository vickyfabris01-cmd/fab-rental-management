import React from "react";

const VARIANT_STYLES = {
  brand: "bg-[#C5612C] text-white",
  success: "bg-[#DCFCE7] text-[#065F46]",
  warning: "bg-[#FEF3C7] text-[#92400E]",
  error: "bg-[#FEE2E2] text-[#991B1B]",
  info: "bg-[#DBEAFE] text-[#1D4ED8]",
  neutral: "bg-[#F3F4F6] text-[#374151]",
  paid: "bg-[#DCFCE7] text-[#065F46]",
  overdue: "bg-[#FEE2E2] text-[#991B1B]",
  pending: "bg-[#FEF9C3] text-[#92400E]",
};

const SIZE_STYLES = {
  sm: "px-2 py-0.5 text-[11px] font-bold",
  md: "px-3 py-1 text-[12px] font-semibold",
  lg: "px-4 py-1.5 text-[13px] font-semibold",
};

function Badge({
  variant = "neutral",
  size = "md",
  className = "",
  style = {},
  children,
}) {
  const variantClass = VARIANT_STYLES[variant] || VARIANT_STYLES.neutral;
  const sizeClass = SIZE_STYLES[size] || SIZE_STYLES.md;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full ${variantClass} ${sizeClass} ${className}`.trim()}
      style={style}
      role="status"
      aria-label={typeof children === "string" ? children : "badge"}
    >
      {children}
    </span>
  );
}

export { Badge };
export default Badge;

export function BillingBadge(props) {
  return <Badge variant="info" {...props} />;
}
export function PaymentBadge(props) {
  return <Badge variant="success" {...props} />;
}
export function RoomBadge(props) {
  return <Badge variant="brand" {...props} />;
}
export function RequestBadge(props) {
  return <Badge variant="pending" {...props} />;
}
export function ComplaintBadge(props) {
  return <Badge variant="warning" {...props} />;
}
export function RoleBadge(props) {
  return <Badge variant="neutral" {...props} />;
}
export function TenantBadge(props) {
  return <Badge variant="brand" {...props} />;
}
export function MethodBadge(props) {
  return <Badge variant="info" {...props} />;
}
