import { PaymentMethod, PaymentStatus } from "@/types/payment-api";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  STRIPE: "Card",
  CASH_ON_DELIVERY: "Cash on delivery",
};

export const PAYMENT_METHOD_DESCRIPTIONS: Record<PaymentMethod, string> = {
  STRIPE: "Pay securely by card on Stripe. You'll be redirected to complete the payment.",
  CASH_ON_DELIVERY: "Pay the courier in cash when your order arrives.",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Awaiting payment",
  SUCCEEDED: "Paid",
  FAILED: "Failed",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
  PARTIALLY_REFUNDED: "Partly refunded",
  REFUNDED: "Refunded",
};

export const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  PENDING: "text-yellow-dark bg-yellow-light-2 border border-yellow/30",
  SUCCEEDED: "text-green bg-green-light-6 border border-green/30",
  FAILED: "text-red bg-red-light-6 border border-red/30",
  EXPIRED: "text-dark-5 bg-gray-2 border border-gray-4",
  CANCELLED: "text-dark-5 bg-gray-2 border border-gray-4",
  PARTIALLY_REFUNDED: "text-blue bg-blue-light-5 border border-blue/30",
  REFUNDED: "text-blue bg-blue-light-5 border border-blue/30",
};

/**
 * One-line payment note for an order in a list (the list has no payment details, only the method).
 * Cash on delivery is unpaid until delivery but needs nothing from the customer.
 */
export const orderPaymentNote = (
  status: string,
  paymentMethod: PaymentMethod | null | undefined
): string | null => {
  if (paymentMethod === "CASH_ON_DELIVERY") {
    return status === "DELIVERED" ? "Paid in cash" : status === "CANCELLED" ? null : "Pay on delivery";
  }
  if (paymentMethod === "STRIPE") {
    // A cancelled card order may never have been paid, or was refunded: the details show which.
    return status === "PENDING" ? "Card · awaiting payment" : status === "CANCELLED" ? null : "Paid by card";
  }
  return status === "PENDING" ? "Payment not started" : null;
};

/** An unpaid order the customer still has to pay online (not cash on delivery). */
export const canPayOrder = (status: string, paymentMethod: PaymentMethod | null | undefined) =>
  status === "PENDING" && paymentMethod !== "CASH_ON_DELIVERY";

/** Cash-on-delivery payments stay pending until delivery, so they don't need a "pay" action. */
export const needsPaymentAction = (
  orderStatus: string,
  latestPaymentStatus: PaymentStatus | undefined,
  latestPaymentMethod: PaymentMethod | undefined
) =>
  orderStatus === "PENDING" &&
  !(latestPaymentStatus === "PENDING" && latestPaymentMethod === "CASH_ON_DELIVERY");
