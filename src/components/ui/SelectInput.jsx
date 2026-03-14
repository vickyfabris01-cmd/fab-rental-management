import React from "react";

export default function SelectInput({
  label,
  options = [],
  error,
  className = "",
  ...props
}) {
  return (
    <label className="block w-full">
      {label && (
        <span className="mb-1 text-sm font-semibold text-gray-700 block">
          {label}
        </span>
      )}
      <select
        className={`w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#C5612C] focus:ring-2 focus:ring-[#C5612C] focus:ring-opacity-20 ${error ? "border-red-400" : ""} ${className}`.trim()}
        {...props}
      >
        {options.map((opt, i) => (
          <option key={i} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </label>
  );
}
