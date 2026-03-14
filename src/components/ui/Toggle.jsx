import React from "react";

export default function Toggle({
  label,
  checked,
  onChange,
  className = "",
  ...props
}) {
  return (
    <label className={`inline-flex items-center gap-2 ${className}`}>
      <span className="text-sm text-gray-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange?.({ target: { checked: !checked } })}
        className={`relative h-6 w-10 rounded-full transition ${checked ? "bg-[#059669]" : "bg-gray-300"}`.trim()}
        {...props}
      >
        <span
          className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transform transition ${checked ? "translate-x-4" : "translate-x-0"}`}
        />
      </button>
    </label>
  );
}
