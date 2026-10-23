import { ApiError } from "@/lib/api/client";
import { requestAuthentication } from "@/lib/auth-prompt";
import { clearAuthTokens } from "@/lib/auth-session";
import {
  AddressResponse,
  OrderStatus,
  ShippingAddressResponse,
} from "@/types/order-api";
import { formatMoney } from "@/lib/currency";

// Store currency from the admin dashboard (Settings / Localization).
export const formatPrice = (value: number | null | undefined) =>
  formatMoney(value);

export const formatDate = (value: string | null | undefined) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "-";

export const formatDateTime = (value: string | null | undefined) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

export const formatAddress = (
  address: AddressResponse | ShippingAddressResponse | null | undefined
) =>
  address
    ? [
        address.street,
        address.city,
        address.state,
        address.zipCode,
        address.country,
      ]
        .filter(Boolean)
        .join(", ")
    : "-";

export const ALL_ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "text-yellow-dark bg-yellow-light-2 border border-yellow/30",
  PAID: "text-blue bg-blue-light-5 border border-blue/30",
  PROCESSING: "text-blue bg-blue-light-5 border border-blue/30",
  SHIPPED: "text-teal bg-gray-2 border border-gray-4",
  DELIVERED: "text-green bg-green-light-6 border border-green/30",
  CANCELLED: "text-red bg-red-light-6 border border-red/30",
};

/**
 * Backend transition rule:
 * PENDING -> PAID -> PROCESSING -> SHIPPED -> DELIVERED; CANCELLED is possible until SHIPPED.
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export const getStatusLabel = (status: string | null | undefined): string => {
  if (!status) return "-";
  const normalized = status.toUpperCase() as OrderStatus;
  return (
    ORDER_STATUS_LABELS[normalized] ||
    status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
  );
};

export const getStatusStyle = (status: string | null | undefined): string => {
  if (!status) return "text-dark-5 bg-gray-2";
  const normalized = status.toUpperCase() as OrderStatus;
  return ORDER_STATUS_STYLES[normalized] || "text-dark-5 bg-gray-2";
};

/** Mirrors the backend rule: customers can cancel while PENDING or PAID. */
/** Paid orders have a PDF invoice; pending and cancelled ones don't. */
export const hasInvoice = (status: OrderStatus | string) =>
  status === "PAID" ||
  status === "PROCESSING" ||
  status === "SHIPPED" ||
  status === "DELIVERED";

export const canCancelOrder = (status: OrderStatus | string) =>
  status === "PENDING" || status === "PAID";

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiError && error.status === 401) {
    clearAuthTokens();
    requestAuthentication();
    return "Your session has expired. Please sign in again.";
  }
  return error instanceof Error ? error.message : fallback;
};
