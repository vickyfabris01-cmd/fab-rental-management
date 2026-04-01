// =============================================================================
// lib/formatters.js
//
// Pure, zero-dependency formatting helpers used throughout the UI.
// No imports — safe to use anywhere including server-side logic.
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// Currency
// ─────────────────────────────────────────────────────────────────────────────

/**
 * formatCurrency
 * Formats a number as Kenyan Shillings.
 *
 * @param {number} amount
 * @param {object} [opts]
 * @param {boolean} [opts.showSymbol]     Include "KES" prefix (default true)
 * @param {boolean} [opts.compact]        Use "1.2k" shorthand for large amounts
 * @param {number}  [opts.decimals]       Decimal places (default 0 for KES)
 * @returns {string}  e.g. "KES 8,500" or "KES 1.2k"
 *
 * @example
 * formatCurrency(8500)           // "KES 8,500"
 * formatCurrency(1200000, { compact: true }) // "KES 1.2M"
 * formatCurrency(8500, { showSymbol: false }) // "8,500"
 */
export function formatCurrency(amount, opts = {}) {
  const {
    showSymbol = true,
    compact = false,
    decimals = 0,
    currency = "KES",
  } = opts;

  const num = Number(amount ?? 0);

  let formatted;

  if (compact) {
    if (Math.abs(num) >= 1_000_000) {
      formatted = (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    } else if (Math.abs(num) >= 1_000) {
      formatted = (num / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
    } else {
      formatted = num.toFixed(decimals);
    }
  } else {
    formatted = new Intl.NumberFormat("en-KE", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  }

  return showSymbol ? `${currency} ${formatted}` : formatted;
}

/**
 * formatAmount
 * Alias of formatCurrency — shorter import for when "KES" prefix is implicit.
 */
export const formatAmount = formatCurrency;

// ─────────────────────────────────────────────────────────────────────────────
// Dates
// ─────────────────────────────────────────────────────────────────────────────

/**
 * formatDate
 * Formats an ISO date string or Date object.
 *
 * @param {string | Date | null} value
 * @param {object} [opts]
 * @param {'short'|'medium'|'long'|'numeric'} [opts.style]  Default 'medium'
 * @param {boolean} [opts.includeTime]  Include HH:mm
 * @returns {string}
 *
 * @example
 * formatDate("2025-03-15")                         // "15 Mar 2025"
 * formatDate("2025-03-15", { style: "long" })      // "15 March 2025"
 * formatDate("2025-03-15", { style: "short" })     // "15/03/2025"
 * formatDate("2025-03-15T14:30:00", { includeTime: true }) // "15 Mar 2025, 14:30"
 */
export function formatDate(value, opts = {}) {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return "Invalid date";

  const { style = "medium", includeTime = false } = opts;

  const dateStr = (() => {
    if (style === "short") {
      const d = String(date.getDate()).padStart(2, "0");
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const y = date.getFullYear();
      return `${d}/${m}/${y}`;
    }
    const monthFmt = style === "long" ? "long" : "short";
    return date.toLocaleDateString("en-KE", {
      day: "numeric",
      month: monthFmt,
      year: "numeric",
    });
  })();

  if (!includeTime) return dateStr;

  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${dateStr}, ${h}:${m}`;
}

/**
 * formatRelativeTime
 * "2 hours ago", "in 3 days", "just now"
 *
 * @param {string | Date} value
 * @returns {string}
 */
export function formatRelativeTime(value) {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffS = Math.round(diffMs / 1000);
  const diffM = Math.round(diffS / 60);
  const diffH = Math.round(diffM / 60);
  const diffD = Math.round(diffH / 24);

  if (Math.abs(diffS) < 30) return "just now";
  if (Math.abs(diffS) < 90) return diffS > 0 ? "1 minute ago" : "in 1 minute";
  if (Math.abs(diffM) < 60)
    return diffM > 0 ? `${diffM} minutes ago` : `in ${Math.abs(diffM)} minutes`;
  if (Math.abs(diffH) < 24)
    return diffH > 0 ? `${diffH}h ago` : `in ${Math.abs(diffH)}h`;
  if (Math.abs(diffD) < 7)
    return diffD > 0 ? `${diffD}d ago` : `in ${Math.abs(diffD)}d`;
  if (Math.abs(diffD) < 30) {
    const weeks = Math.round(diffD / 7);
    return diffD > 0 ? `${weeks}w ago` : `in ${weeks}w`;
  }
  return formatDate(date, { style: "short" });
}

/**
 * formatBillingPeriod
 * Renders a billing cycle's date range as a readable string.
 *
 * @param {string} periodStart  ISO date
 * @param {string} periodEnd    ISO date
 * @param {'monthly'|'semester'} [billingType]
 * @returns {string}  e.g. "Mar 2025" or "Jan – Jun 2025"
 */
export function formatBillingPeriod(periodStart, periodEnd, billingType) {
  if (!periodStart) return "—";

  if (billingType === "semester") {
    const start = formatDate(periodStart, { style: "medium" });
    const end = formatDate(periodEnd, { style: "medium" });
    return `${start} – ${end}`;
  }

  // Monthly: just show month + year
  const date = new Date(periodStart);
  return date.toLocaleDateString("en-KE", { month: "long", year: "numeric" });
}

/**
 * formatDueDate
 * Returns the due date with an optional "overdue" indicator.
 *
 * @param {string} dueDate    ISO date
 * @returns {{ label: string, isOverdue: boolean }}
 */
export function formatDueDate(dueDate) {
  if (!dueDate) return { label: "—", isOverdue: false };
  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = dueDate < today;
  return {
    label: formatDate(dueDate),
    isOverdue,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Phone numbers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * formatPhone
 * Formats a phone number for display. Converts 254... to 07... for readability.
 *
 * @param {string | null} phone
 * @returns {string}  e.g. "0712 345 678" or "—"
 *
 * @example
 * formatPhone("254712345678")  // "0712 345 678"
 * formatPhone("0712345678")    // "0712 345 678"
 * formatPhone(null)            // "—"
 */
export function formatPhone(phone) {
  if (!phone) return "—";

  let digits = String(phone).replace(/\D/g, "");

  // Convert 254 prefix to local 0 prefix for display
  if (digits.startsWith("254")) digits = "0" + digits.slice(3);

  // Format as 0712 345 678
  if (digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }

  return phone; // Return as-is if we can't parse it
}

/**
 * maskPhone
 * Partially masks a phone for privacy in list views.
 *
 * @param {string} phone
 * @returns {string}  e.g. "0712 *** 678"
 */
export function maskPhone(phone) {
  const formatted = formatPhone(phone);
  if (formatted === "—") return "—";
  // Replace middle 3 chars of the 7-10 block with ***
  return formatted.replace(/(\d{4} )\d{3}( \d{3})/, "$1***$2");
}

// ─────────────────────────────────────────────────────────────────────────────
// Text
// ─────────────────────────────────────────────────────────────────────────────

/**
 * truncate
 * Clips text to `maxLength` and appends "…".
 *
 * @param {string} text
 * @param {number} [maxLength]  Default 80
 * @returns {string}
 */
export function truncate(text, maxLength = 80) {
  if (!text) return "";
  return text.length <= maxLength ? text : text.slice(0, maxLength - 1) + "…";
}

/**
 * capitalize
 * Capitalises the first letter of each word.
 *
 * @param {string} text
 * @returns {string}  e.g. "sunrise hostel" → "Sunrise Hostel"
 */
export function capitalize(text) {
  if (!text) return "";
  return text.toLowerCase().replace(/(^|\s)\S/g, (l) => l.toUpperCase());
}

/**
 * slugify
 * Converts a string to a URL-safe slug.
 *
 * @param {string} text
 * @returns {string}  e.g. "Sunrise Hostel" → "sunrise-hostel"
 */
export function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─────────────────────────────────────────────────────────────────────────────
// File sizes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * formatFileSize
 * Human-readable file size string.
 *
 * @param {number} bytes
 * @returns {string}  e.g. "1.4 MB"
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(1).replace(/\.0$/, "")} ${units[i]}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Misc
// ─────────────────────────────────────────────────────────────────────────────

/**
 * formatInitials
 * Gets initials from a full name.
 *
 * @param {string} name
 * @param {number} [max]  Max characters to return (default 2)
 * @returns {string}  e.g. "John Doe" → "JD"
 */
export function formatInitials(name, max = 2) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, max);
}

/**
 * formatRole
 * Human-readable role label.
 *
 * @param {string} role
 * @returns {string}
 */
export function formatRole(role) {
  const labels = {
    super_admin: "Super Admin",
    owner: "Owner",
    manager: "Manager",
    client: "Resident",
    worker: "Worker",
    visitor: "Visitor",
  };
  return labels[role] ?? capitalize(role ?? "");
}

/**
 * formatRoomType
 * Human-readable room type.
 */
export function formatRoomType(type) {
  const labels = {
    single: "Single Room",
    double: "Double Room",
    dormitory: "Stalls",
    studio: "1 Bedroom",
    bedsitter: "Bedsitter",
    suite: "2 Bedroom",
  };
  return labels[type] ?? capitalize(type ?? "");
}

/**
 * ordinalSuffix
 * Appends the correct ordinal suffix to a number.
 *
 * @param {number} n
 * @returns {string}  e.g. 1 → "1st", 3 → "3rd"
 */
export function ordinalSuffix(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
