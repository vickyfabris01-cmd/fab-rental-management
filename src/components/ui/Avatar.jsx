import React from "react";

function getInitials(name) {
  if (!name) return "?";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

export default function Avatar({ name, src, size = "sm", className = "" }) {
  const sizes = { sm: 8, md: 10, lg: 12 };
  const px = sizes[size] || sizes.sm;

  if (src) {
    return (
      <img
        src={src}
        alt={name || "Avatar"}
        className={`rounded-full object-cover ${className}`}
        style={{ width: `${px}rem`, height: `${px}rem` }}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-[#E5E7EB] flex items-center justify-center text-[#4B5563] font-semibold ${className}`}
      style={{ width: `${px}rem`, height: `${px}rem` }}
    >
      {getInitials(name)}
    </div>
  );
}
