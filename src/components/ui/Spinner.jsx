import React from "react";

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-10">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-solid border-gray-300 border-t-[#C5612C]" />
    </div>
  );
}

export function SkeletonCard({ lines = 3, hasImage = false }) {
  return (
    <div className="p-5 bg-white rounded-xl shadow-sm border border-gray-200">
      {hasImage && (
        <div className="h-28 bg-gray-100 rounded-lg mb-4 animate-pulse" />
      )}
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className="h-3 bg-gray-100 rounded-md mb-2 animate-pulse"
        />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="p-4 bg-white rounded-xl border border-gray-100">
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-3">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className="h-8 flex-1 bg-gray-100 rounded animate-pulse"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({
  icon = "box",
  title = "No items found",
  description = "There is nothing to show right now.",
  action = null,
}) {
  return (
    <div className="text-center py-10 px-4">
      <div className="mx-auto mb-3 h-12 w-12 flex items-center justify-center rounded-full bg-gray-100 text-gray-500">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-gray-800">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Divider({ label = "" }) {
  return (
    <div className="flex items-center py-3">
      <div className="flex-1 h-px bg-gray-200" />
      {label && (
        <span className="mx-3 text-xs text-gray-400 uppercase">{label}</span>
      )}
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

export default Spinner;
