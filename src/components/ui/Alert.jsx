import React from "react";

const VARIANT = {
  success: "bg-green-50 border-green-200 text-green-700",
  error: "bg-red-50 border-red-200 text-red-700",
  info: "bg-blue-50 border-blue-200 text-blue-700",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-700",
};

function Alert({ type = "info", title, message, className = "", onClose }) {
  return (
    <div
      className={`rounded-lg border p-3 text-sm ${VARIANT[type] || VARIANT.info} ${className}`.trim()}
      role="alert"
    >
      {title && <p className="font-bold">{title}</p>}
      {message && <p>{message}</p>}
      {onClose && (
        <button
          onClick={onClose}
          className="ml-auto mt-2 text-xs font-semibold text-gray-600"
        >
          Close
        </button>
      )}
    </div>
  );
}

export { Alert };
export default Alert;
