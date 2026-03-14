import React from "react";

export default function PhoneInput({
  label,
  value,
  onChange,
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
      <div className="flex rounded-lg border border-gray-300 focus-within:border-[#C5612C] focus-within:ring-2 focus-within:ring-[#C5612C] focus-within:ring-opacity-20 overflow-hidden">
        <span className="px-3 py-2 bg-gray-100 text-gray-600">+254</span>
        <input
          type="tel"
          value={value}
          onChange={onChange}
          className={`flex-1 min-w-0 px-3 py-2 outline-none ${className}`.trim()}
          placeholder="712345678"
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </label>
  );
}
