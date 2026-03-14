import React from "react";

export default function Input({ label, error, className = "", ...props }) {
  return (
    <label className="block w-full">
      {label && (
        <span className="mb-1 text-sm font-semibold text-gray-700 block">
          {label}
        </span>
      )}
      <input
        className={`w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#C5612C] focus:ring-2 focus:ring-[#C5612C] focus:ring-opacity-20 ${error ? "border-red-400" : ""} ${className}`.trim()}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </label>
  );
}
