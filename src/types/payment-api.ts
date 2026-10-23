// Mirrors ecommerce-api/payment/dto.
export type PaymentMethod = "STRIPE" | "CASH_ON_DELIVERY";

export type PaymentStatus =
  | "PENDING"
  | "SUCCEEDED"
  | "FAILED"
  | "EXPIRED"
  | "CANCELLED"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED";

export type InitiatePaymentRequest = {
  orderNumber: string;
  method: PaymentMethod;
};

export type PaymentResponse = {
  id: number;
  orderNumber: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  refundedAmount: number;
  currency: string;
  /** Send the customer here to pay (Stripe Checkout); null for cash on delivery. */
  redirectUrl: string | null;
  failureReason: string | null;
  paidAt: string | null;
  createdAt: string;
};
