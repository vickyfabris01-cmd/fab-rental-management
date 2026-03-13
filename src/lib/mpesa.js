// =============================================================================
// lib/mpesa.js
//
// Frontend-side M-Pesa helpers. These are pure utility functions — they do
// NOT call Daraja directly (Daraja credentials live in FastAPI only).
//
// What lives here:
//   - Phone number normalisation (254 format)
//   - STK push amount rounding (M-Pesa requires integer KES)
//   - Polling helper wrapper
//   - Receipt / callback payload parsing (for when FastAPI returns the result)
//   - Human-readable status mappers
// =============================================================================

import { mpesaSTKPush, pollPaymentStatus } from "./api/payments";

// ─────────────────────────────────────────────────────────────────────────────
// normalizePhone
// Converts any Kenya phone number format to the 254xxxxxxxxx format required
// by the Daraja API.
//
// Accepts:
//   "0712345678"     → "254712345678"
//   "+254712345678"  → "254712345678"
//   "254712345678"   → "254712345678"
//   "712345678"      → "254712345678"
//
// @param {string} phone
// @returns {string} Normalized phone in 254xxxxxxxxx format
// @throws {Error}   If the number can't be parsed as a valid KE number
// ─────────────────────────────────────────────────────────────────────────────
export function normalizePhone(phone) {
  if (!phone) throw new Error("Phone number is required");

  // Strip spaces, dashes, parentheses
  const cleaned = String(phone).replace(/[\s\-().]/g, "");

  // Already in 254 format
  if (/^254[17]\d{8}$/.test(cleaned)) return cleaned;

  // +254 format
  if (/^\+254[17]\d{8}$/.test(cleaned)) return cleaned.slice(1);

  // 0... format (local)
  if (/^0[17]\d{8}$/.test(cleaned)) return "254" + cleaned.slice(1);

  // 7... or 1... (8 digits, no prefix)
  if (/^[17]\d{8}$/.test(cleaned)) return "254" + cleaned;

  throw new Error(`Cannot parse "${phone}" as a valid Kenya phone number`);
}

// ─────────────────────────────────────────────────────────────────────────────
// formatMpesaAmount
// M-Pesa only accepts whole-number KES amounts. Rounds up fractional cents
// so the payment always covers the full amount due.
//
// @param {number} amount
// @returns {number} Integer
// ─────────────────────────────────────────────────────────────────────────────
export function formatMpesaAmount(amount) {
  return Math.ceil(Number(amount));
}

// ─────────────────────────────────────────────────────────────────────────────
// buildAccountReference
// Builds the "AccountReference" string shown in the M-Pesa confirmation
// message on the client's phone. Keep it under 12 chars.
//
// @param {string} tenantName   e.g. "Sunrise Hostel"
// @param {string} roomNumber   e.g. "A4"
// @returns {string}            e.g. "SUNRISE-A4"
// ─────────────────────────────────────────────────────────────────────────────
export function buildAccountReference(tenantName, roomNumber) {
  const name = tenantName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
  const room = String(roomNumber).toUpperCase().replace(/[^A-Z0-9]/g, "");
  return `${name}-${room}`.slice(0, 12);
}

// ─────────────────────────────────────────────────────────────────────────────
// initiateMpesaPayment
// High-level helper that normalises the phone, validates the amount, calls
// the STK push API, then returns a poller function.
//
// Usage:
//   const { paymentId, pollStatus } = await initiateMpesaPayment({
//     cycleId, clientId, phone: "0712345678", amount: 8500,
//     tenantName: "Sunrise Hostel", roomNumber: "A4",
//   });
//   // Then poll or use Realtime to watch for confirmed/failed
//   const finalStatus = await pollStatus();
//
// @param {object} opts
// @param {string} opts.cycleId
// @param {string} opts.clientId
// @param {string} opts.phone
// @param {number} opts.amount
// @param {string} opts.tenantName
// @param {string} opts.roomNumber
// @param {Function} [opts.onStatusUpdate]   Called during polling with interim status
// @returns {Promise<{ paymentId: string, checkoutRequestId: string, pollStatus: Function }>}
// ─────────────────────────────────────────────────────────────────────────────
export async function initiateMpesaPayment({
  cycleId, clientId, phone, amount, tenantName, roomNumber, onStatusUpdate,
}) {
  const normalizedPhone = normalizePhone(phone);
  const intAmount       = formatMpesaAmount(amount);
  const reference       = buildAccountReference(tenantName ?? "Rental", roomNumber ?? "");

  const { data, error } = await mpesaSTKPush({
    cycleId,
    clientId,
    phone:     normalizedPhone,
    amount:    intAmount,
    reference,
  });

  if (error) throw new Error(error.message ?? "Failed to initiate M-Pesa payment");

  const { payment_id: paymentId, checkout_request_id: checkoutRequestId } = data;

  /**
   * pollStatus — waits for the payment to leave 'pending'.
   * Returns the final payment_status string.
   */
  const pollStatus = () =>
    pollPaymentStatus(paymentId, {
      intervalMs:  3000,
      maxAttempts: 20,
      onUpdate:    onStatusUpdate,
    });

  return { paymentId, checkoutRequestId, pollStatus };
}

// ─────────────────────────────────────────────────────────────────────────────
// parseMpesaCallback
// Parses the JSON payload that FastAPI forwards to the frontend after
// processing the async M-Pesa callback. Normalises both success and failure
// shapes into a single consistent object.
//
// FastAPI callback payload shape (success):
//   { payment_status: "confirmed", payment_id, mpesa_receipt, amount, paid_at }
//
// FastAPI callback payload shape (failure):
//   { payment_status: "failed", payment_id, error_code, error_message }
//
// @param {object} payload
// @returns {{ status, paymentId, receipt?, amount?, paidAt?, errorCode?, errorMessage? }}
// ─────────────────────────────────────────────────────────────────────────────
export function parseMpesaCallback(payload) {
  if (!payload || !payload.payment_status) {
    return { status: "unknown", paymentId: null };
  }

  if (payload.payment_status === "confirmed") {
    return {
      status:    "confirmed",
      paymentId: payload.payment_id,
      receipt:   payload.mpesa_receipt,
      amount:    Number(payload.amount),
      paidAt:    payload.paid_at,
    };
  }

  return {
    status:       payload.payment_status, // "failed" or "reversed"
    paymentId:    payload.payment_id,
    errorCode:    payload.error_code    ?? null,
    errorMessage: payload.error_message ?? "Payment was not successful",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// getMpesaStatusLabel
// Human-readable label for a payment_status value.
// ─────────────────────────────────────────────────────────────────────────────
export function getMpesaStatusLabel(status) {
  const labels = {
    pending:   "Waiting for payment…",
    confirmed: "Payment confirmed",
    failed:    "Payment failed",
    reversed:  "Payment reversed",
  };
  return labels[status] ?? status;
}

// ─────────────────────────────────────────────────────────────────────────────
// getMpesaStatusColor
// Tailwind colour class pair for status badges.
// ─────────────────────────────────────────────────────────────────────────────
export function getMpesaStatusColor(status) {
  const colors = {
    pending:   { bg: "bg-amber-50",   text: "text-amber-700"   },
    confirmed: { bg: "bg-emerald-50", text: "text-emerald-700" },
    failed:    { bg: "bg-red-50",     text: "text-red-700"     },
    reversed:  { bg: "bg-stone-100",  text: "text-stone-600"   },
  };
  return colors[status] ?? { bg: "bg-stone-100", text: "text-stone-600" };
}

// ─────────────────────────────────────────────────────────────────────────────
// isValidKEPhone
// Quick predicate — does this string look like a valid Kenya mobile number
// in any of the accepted input formats?
//
// @param {string} phone
// @returns {boolean}
// ─────────────────────────────────────────────────────────────────────────────
export function isValidKEPhone(phone) {
  try {
    normalizePhone(phone);
    return true;
  } catch {
    return false;
  }
}
