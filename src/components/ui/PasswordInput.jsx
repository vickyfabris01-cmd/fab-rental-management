import React, { useState } from "react";

export default function PasswordInput({
  label,
  error,
  className = "",
  ...props
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="block w-full relative">
      {label && (
        <span className="mb-1 text-sm font-semibold text-gray-700 block">
          {label}
        </span>
      )}
      <input
        type={visible ? "text" : "password"}
        className={`w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 focus:border-[#C5612C] focus:ring-2 focus:ring-[#C5612C] focus:ring-opacity-20 ${error ? "border-red-400" : ""} ${className}`.trim()}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2 top-[calc(50%-0.5rem)] text-xs text-gray-600"
      >
        {visible ? "Hide" : "Show"}
      </button>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </label>
  );
}
