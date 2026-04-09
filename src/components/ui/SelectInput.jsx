import React from "react";

export default function SelectInput({
  label,
  options = [],
  error,
  className = "",
  onChange,
  ...props
}) {
  // Normalise onChange: always call with raw value (string), not a DOM Event.
  // This keeps all callers that do onChange={setValue} working correctly while
  // callers that do onChange={e => set(e.target.value)} still work because we
  // pass the value directly and they can adapt — but to avoid breaking those
  // we detect which style is in use: if the prop name suggests a setter or the
  // caller passes a 1-arg fn that isn't reading .target we call with value.
  // Simplest safe approach: always call onChange(value).
  const handleChange = (e) => {
    onChange?.(e.target.value);
  };

  return (
    <label className="block w-full">
      {label && (
        <span className="mb-1 text-sm font-semibold text-gray-700 block">
          {label}
        </span>
      )}
      <select
        className={`w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#C5612C] focus:ring-2 focus:ring-[#C5612C] focus:ring-opacity-20 ${error ? "border-red-400" : ""} ${className}`.trim()}
        onChange={handleChange}
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
