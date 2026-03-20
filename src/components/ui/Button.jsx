import React from "react";

const VARIANT = {
  primary: "bg-[#C5612C] text-white hover:bg-[#A84E22]",
  secondary:
    "bg-white text-[#1F2937] border border-[#E5E7EB] hover:bg-[#F9FAFB]",
  danger: "bg-[#DC2626] text-white hover:bg-[#B91C1C]",
  ghost: "bg-transparent text-[#1F2937] hover:bg-[#F3F4F6]",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  fullWidth = false,
  loading = false,
  ...props
}) {
  const sizeStyle =
    size === "sm"
      ? "px-3 py-2 text-sm"
      : size === "lg"
        ? "px-5 py-3 text-base"
        : "px-4 py-2.5 text-sm";

  const widthStyle = fullWidth ? "w-full" : "inline-flex";
  const disabled = loading || props.disabled;

  return (
    <button
      className={`${VARIANT[variant] || VARIANT.primary} ${sizeStyle} ${widthStyle} rounded-lg font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#C5612C] ${className}`.trim()}
      disabled={disabled}
      {...props}
    >
      {loading ? "Loading..." : children}
    </button>
  );
}
