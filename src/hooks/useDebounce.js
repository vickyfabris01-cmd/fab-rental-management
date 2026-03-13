import { useState, useEffect, useRef, useCallback } from "react";

// =============================================================================
// useDebounce
//
// Delays updating a derived value until the input has stopped changing for
// `delay` ms. Perfect for search inputs: fire the API query only after the
// user pauses typing, not on every keystroke.
//
// Usage:
//   const [query, setQuery] = useState("");
//   const debouncedQuery = useDebounce(query, 300);
//
//   useEffect(() => {
//     if (debouncedQuery) fetchResults(debouncedQuery);
//   }, [debouncedQuery]);
//
// @param {T}      value  The rapidly-changing source value
// @param {number} delay  Milliseconds to wait after last change (default 300)
// @returns {T} The debounced (stable) value
// =============================================================================
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

// =============================================================================
// useDebouncedCallback
//
// Returns a debounced version of `fn` that only fires after `delay` ms of
// inactivity. Unlike useDebounce (which mirrors a value), this wraps an
// arbitrary callback — useful for firing side-effects like API calls
// directly from an onChange handler without needing intermediate state.
//
// Usage:
//   const search = useDebouncedCallback((term) => {
//     api.search(term).then(setResults);
//   }, 400);
//
//   <input onChange={e => search(e.target.value)} />
//
// The returned function is stable (same reference across renders) so it is
// safe to pass as a prop or include in dependency arrays.
//
// @param {Function} fn     The callback to debounce
// @param {number}   delay  Milliseconds (default 300)
// @returns {Function} Debounced version of fn
// =============================================================================
export function useDebouncedCallback(fn, delay = 300) {
  const timerRef = useRef(null);
  // Keep fn in a ref so the stable wrapper always calls the latest version
  const fnRef = useRef(fn);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  const debounced = useCallback(
    (...args) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        fnRef.current(...args);
      }, delay);
    },
    [delay]
  );

  // Cancel any pending invocation on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return debounced;
}

// =============================================================================
// useThrottle
//
// Limits how often a value update is applied — allows through the first
// update immediately, then ignores further changes until `limit` ms elapses.
// Useful for scroll positions, window resize, etc.
//
// Usage:
//   const throttledScroll = useThrottle(scrollY, 100);
//
// @param {T}      value  The rapidly-changing source value
// @param {number} limit  Minimum ms between updates (default 100)
// @returns {T}
// =============================================================================
export function useThrottle(value, limit = 100) {
  const [throttled, setThrottled] = useState(value);
  const lastUpdated = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    if (now - lastUpdated.current >= limit) {
      lastUpdated.current = now;
      setThrottled(value);
    } else {
      const timer = setTimeout(() => {
        lastUpdated.current = Date.now();
        setThrottled(value);
      }, limit - (now - lastUpdated.current));
      return () => clearTimeout(timer);
    }
  }, [value, limit]);

  return throttled;
}

// Default export is the most-used variant
export default useDebounce;
