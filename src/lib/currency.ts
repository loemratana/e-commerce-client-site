import { useSyncExternalStore } from "react";

// The store's currency comes from the admin dashboard (Settings / Localization) through
// GET /api/v1/settings/public. It's only a label: prices are never converted. The last known value
// is kept in localStorage so pages render with it straight away; the site layout refreshes it.

const STORAGE_KEY = "storeCurrency";
const FALLBACK = "USD";

const readStored = () => {
  try {
    return (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) || FALLBACK;
  } catch {
    return FALLBACK;
  }
};

let currentCurrency = readStored();
const listeners = new Set<() => void>();

export const getCurrency = () => currentCurrency;

export const setCurrency = (currency: string) => {
  if (!currency || currency === currentCurrency) return;
  currentCurrency = currency;
  try {
    localStorage.setItem(STORAGE_KEY, currency);
  } catch {
    // Private mode etc.: still applies for this visit.
  }
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** Re-renders the component when the currency changes (e.g. the header cart total). */
export const useCurrency = () =>
  useSyncExternalStore(subscribe, getCurrency, () => FALLBACK);

const formatters = new Map<string, Intl.NumberFormat>();

const formatter = () => {
  let format = formatters.get(currentCurrency);
  if (!format) {
    const options: Intl.NumberFormatOptions = {
      style: "currency",
      // "$", "€", "៛" rather than "US$" / "KHR"
      currencyDisplay: "narrowSymbol",
    };
    try {
      format = new Intl.NumberFormat("en-US", { ...options, currency: currentCurrency });
    } catch {
      // Unknown code (shouldn't happen: the API validates it).
      format = new Intl.NumberFormat("en-US", { ...options, currency: FALLBACK });
    }
    formatters.set(currentCurrency, format);
  }
  return format;
};

/** Formats an amount in the store currency; missing values show as 0. */
export const formatMoney = (value: number | string | null | undefined) =>
  formatter().format(Number(value ?? 0) || 0);
