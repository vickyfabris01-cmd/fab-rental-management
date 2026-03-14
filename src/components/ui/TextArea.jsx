import React from "react";

export default function TextArea({ label, error, className = "", ...props }) {
  return (
    <label className="block w-full">
      {label && (
        <span className="mb-1 text-sm font-semibold text-gray-700 block">
          {label}
        </span>
      )}
      <textarea
        className={`w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#C5612C] focus:ring-2 focus:ring-[#C5612C] focus:ring-opacity-20 ${error ? "border-red-400" : ""} ${className}`.trim()}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </label>
  );
}

export function Checkbox({
  label,
  checked,
  onChange,
  className = "",
  ...props
}) {
  return (
    <label className={`inline-flex items-center gap-2 ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 accent-[#C5612C]"
        {...props}
      />
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  );
}

export function Toggle({ label, checked, onChange, className = "", ...props }) {
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
