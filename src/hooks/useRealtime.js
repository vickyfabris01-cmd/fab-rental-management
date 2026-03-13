import { useEffect, useRef, useCallback } from "react";
import { supabase, realtimeChannel } from "../config/supabase";
import { REALTIME_TABLES } from "../config/constants";

// =============================================================================
// useRealtime
//
// Generic hook for subscribing to a Supabase Realtime postgres_changes channel.
// Cleans up automatically on unmount or when any dependency changes.
//
// Usage:
//   useRealtime({
//     channelName: "manager-requests",
//     table:  "rental_requests",
//     event:  "INSERT",
//     filter: `tenant_id=eq.${tenantId}`,
//     onEvent: (payload) => queryClient.invalidateQueries(["rental-requests"]),
//     enabled: !!tenantId,
//   });
//
// @param {object}   options
// @param {string}   options.channelName  Unique name for this channel instance
// @param {string}   options.table        Table to watch (use REALTIME_TABLES constants)
// @param {string}   [options.event]      "INSERT" | "UPDATE" | "DELETE" | "*" (default "*")
// @param {string}   [options.filter]     Supabase filter string e.g. "tenant_id=eq.abc"
// @param {string}   [options.schema]     DB schema (default "public")
// @param {Function} options.onEvent      Callback receiving the Supabase payload
// @param {boolean}  [options.enabled]    Set false to skip subscribing (default true)
// @param {Function} [options.onStatus]   Called with the Supabase channel status string
// =============================================================================
export function useRealtime({
  channelName,
  table,
  event    = "*",
  filter,
  schema   = "public",
  onEvent,
  enabled  = true,
  onStatus,
}) {
  // Keep callbacks in refs so changing them doesn't recreate the channel
  const onEventRef  = useRef(onEvent);
  const onStatusRef = useRef(onStatus);
  useEffect(() => { onEventRef.current  = onEvent;  }, [onEvent]);
  useEffect(() => { onStatusRef.current = onStatus; }, [onStatus]);

  useEffect(() => {
    if (!enabled || !table || !channelName) return;

    const config = { event, schema, table };
    if (filter) config.filter = filter;

    const channel = realtimeChannel(channelName)
      .on("postgres_changes", config, (payload) => {
        onEventRef.current?.(payload);
      })
      .subscribe((status, err) => {
        if (err) {
          console.error(`[useRealtime:${channelName}] Error:`, err.message);
        }
        onStatusRef.current?.(status);

        if (status === "SUBSCRIBED") {
          console.info(`[useRealtime] ✓ ${channelName}`);
        }
        if (status === "CHANNEL_ERROR") {
          console.warn(`[useRealtime] ✗ ${channelName} — channel error`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, table, event, filter, schema, enabled]);
}

// =============================================================================
// useMultiRealtime
//
// Subscribe to multiple tables / channels at once from a single hook call.
// Each entry in `subscriptions` is passed directly to useRealtime options.
// All channels are torn down together on unmount.
//
// Usage:
//   useMultiRealtime([
//     { channelName: "payments-feed",   table: "payments",         event: "INSERT", filter: `tenant_id=eq.${tenantId}`, onEvent: handlePayment },
//     { channelName: "requests-feed",   table: "rental_requests",  event: "INSERT", filter: `tenant_id=eq.${tenantId}`, onEvent: handleRequest },
//   ], { enabled: !!tenantId });
//
// @param {Array}   subscriptions   Array of useRealtime options objects
// @param {object}  [shared]        Shared options (e.g. { enabled }) applied to every entry
// =============================================================================
export function useMultiRealtime(subscriptions = [], shared = {}) {
  const subsRef = useRef(subscriptions);
  useEffect(() => { subsRef.current = subscriptions; }, [subscriptions]);

  useEffect(() => {
    const { enabled = true } = shared;
    if (!enabled) return;

    const channels = subsRef.current.map(sub => {
      const { channelName, table, event = "*", filter, schema = "public", onEvent, onStatus } = sub;
      if (!channelName || !table) return null;

      const config = { event, schema, table };
      if (filter) config.filter = filter;

      return realtimeChannel(channelName)
        .on("postgres_changes", config, payload => onEvent?.(payload))
        .subscribe((status, err) => {
          if (err) console.error(`[useMultiRealtime:${channelName}]`, err.message);
          onStatus?.(status);
        });
    }).filter(Boolean);

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shared.enabled]);
}

// =============================================================================
// Pre-built channel hooks
// These are opinionated wrappers for the most common subscriptions in the app.
// They follow the naming convention: use{Table}Realtime
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// usePaymentsRealtime
//
// Fires `onPayment` when a new payment is INSERTED for a given billing cycle.
// Used on the client billing page to show an instant M-Pesa confirmation.
//
// Usage:
//   usePaymentsRealtime({
//     billingCycleId: cycle.id,
//     onPayment: (payload) => {
//       if (payload.new.payment_status === "confirmed") toast.success("Payment confirmed!");
//     },
//   });
// ─────────────────────────────────────────────────────────────────────────────
export function usePaymentsRealtime({ billingCycleId, onPayment, enabled = true }) {
  useRealtime({
    channelName: `payments:${billingCycleId}`,
    table:       REALTIME_TABLES.PAYMENTS,
    event:       "INSERT",
    filter:      billingCycleId ? `billing_cycle_id=eq.${billingCycleId}` : undefined,
    onEvent:     onPayment,
    enabled:     enabled && !!billingCycleId,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useRentalRequestsRealtime
//
// Fires `onRequest` when a new rental request arrives for a tenant.
// Used on the manager dashboard to show a live badge on "Pending Requests".
//
// Usage:
//   useRentalRequestsRealtime({
//     tenantId,
//     onRequest: () => queryClient.invalidateQueries(["rental-requests", tenantId]),
//   });
// ─────────────────────────────────────────────────────────────────────────────
export function useRentalRequestsRealtime({ tenantId, onRequest, enabled = true }) {
  useRealtime({
    channelName: `rental_requests:${tenantId}`,
    table:       REALTIME_TABLES.RENTAL_REQUESTS,
    event:       "INSERT",
    filter:      tenantId ? `tenant_id=eq.${tenantId}` : undefined,
    onEvent:     onRequest,
    enabled:     enabled && !!tenantId,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useComplaintMessagesRealtime
//
// Fires `onMessage` when a new message is added to a specific complaint thread.
// Used on the complaint detail page for live chat-style updates.
//
// Usage:
//   useComplaintMessagesRealtime({
//     complaintId: complaint.id,
//     onMessage: (payload) => appendMessage(payload.new),
//   });
// ─────────────────────────────────────────────────────────────────────────────
export function useComplaintMessagesRealtime({ complaintId, onMessage, enabled = true }) {
  useRealtime({
    channelName: `complaint_messages:${complaintId}`,
    table:       REALTIME_TABLES.COMPLAINT_MSGS,
    event:       "INSERT",
    filter:      complaintId ? `complaint_id=eq.${complaintId}` : undefined,
    onEvent:     onMessage,
    enabled:     enabled && !!complaintId,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useTenanciesRealtime
//
// Fires `onTenancy` on INSERT or UPDATE to tenancies for a tenant.
// Used on manager resident list to auto-refresh when someone moves in/out.
//
// Usage:
//   useTenanciesRealtime({
//     tenantId,
//     onTenancy: () => queryClient.invalidateQueries(["tenancies", tenantId]),
//   });
// ─────────────────────────────────────────────────────────────────────────────
export function useTenanciesRealtime({ tenantId, onTenancy, enabled = true }) {
  useRealtime({
    channelName: `tenancies:${tenantId}`,
    table:       REALTIME_TABLES.TENANCIES,
    event:       "*",
    filter:      tenantId ? `tenant_id=eq.${tenantId}` : undefined,
    onEvent:     onTenancy,
    enabled:     enabled && !!tenantId,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useBillingCyclesRealtime
//
// Fires `onUpdate` when a billing cycle changes status (e.g. unpaid → paid).
// Used on manager billing page to reflect payment reconciliation in real time.
//
// Usage:
//   useBillingCyclesRealtime({
//     tenantId,
//     onUpdate: (payload) => queryClient.invalidateQueries(["billing-cycles"]),
//   });
// ─────────────────────────────────────────────────────────────────────────────
export function useBillingCyclesRealtime({ tenantId, onUpdate, enabled = true }) {
  useRealtime({
    channelName: `billing_cycles:${tenantId}`,
    table:       REALTIME_TABLES.BILLING_CYCLES,
    event:       "UPDATE",
    filter:      tenantId ? `tenant_id=eq.${tenantId}` : undefined,
    onEvent:     onUpdate,
    enabled:     enabled && !!tenantId,
  });
}

// =============================================================================
// useChannelStatus
//
// Returns the current Supabase Realtime connection status for a channel.
// Useful for showing a "live" / "reconnecting" indicator in the UI.
//
// @param {string} channelName   Must match a channelName used in useRealtime
// @returns {"SUBSCRIBED"|"TIMED_OUT"|"CHANNEL_ERROR"|"CLOSED"|null} status
// =============================================================================
export function useChannelStatus(channelName) {
  const statusRef = useRef(null);

  // We can't easily read status after the fact from the supabase client,
  // so components that need live status should use useRealtime with onStatus.
  // This hook is a placeholder for that pattern.
  const setStatus = useCallback((s) => { statusRef.current = s; }, []);

  return { status: statusRef.current, setStatus };
}

export default useRealtime;
