// Mirrors ecommerce-api/payment/dto.
export type PaymentMethod = "STRIPE" | "ABA_PAYWAY" | "CASH_ON_DELIVERY";

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
  /** Send the customer here to pay (Stripe Checkout, ABA PayWay); null for cash on delivery. */
  redirectUrl: string | null;
  failureReason: string | null;
  paidAt: string | null;
  createdAt: string;
};
