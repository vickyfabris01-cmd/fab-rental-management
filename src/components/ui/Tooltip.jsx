import React from "react";

export default function Tooltip({ content, children, className = "" }) {
  return (
    <span className={`relative inline-block ${className}`}>
      {children}
      {content && (
        <span className="absolute left-1/2 -top-8 z-10 hidden -translate-x-1/2 rounded bg-gray-800 px-2 py-1 text-xs text-white group-hover:block">
          {content}
        </span>
      )}
    </span>
  );
}
