import { apiClient } from "@/lib/api/client";
import { getResponseData } from "@/lib/api/auth.api";
import { ApiResponse } from "@/types/auth-api";
import {
  InitiatePaymentRequest,
  PaymentMethod,
  PaymentResponse,
} from "@/types/payment-api";

const PAYMENTS_ENDPOINT = "/api/v1/payments";

export const paymentsApi = {
  /**
   * Payment methods the store accepts (each has a gateway on the server).
   * GET /api/v1/payments/methods
   */
  async getMethods(): Promise<PaymentMethod[]> {
    const response = await apiClient.get<ApiResponse<PaymentMethod[]>>(
      `${PAYMENTS_ENDPOINT}/methods`
    );
    return getResponseData(response, "load payment methods");
  },

  /**
   * Starts paying one of my PENDING orders. Returns redirectUrl for online methods
   * (send the customer there); cash on delivery has none. Calling it again with the
   * same method returns the open attempt instead of creating another.
   * POST /api/v1/payments
   */
  async initiate(request: InitiatePaymentRequest): Promise<PaymentResponse> {
    const response = await apiClient.post<ApiResponse<PaymentResponse>>(
      PAYMENTS_ENDPOINT,
      request
    );
    return getResponseData(response, "start the payment");
  },

  /**
   * Payment attempts for one of my orders, newest first.
   * GET /api/v1/payments/me/order/{orderNumber}
   */
  async getForMyOrder(orderNumber: string): Promise<PaymentResponse[]> {
    const response = await apiClient.get<ApiResponse<PaymentResponse[]>>(
      `${PAYMENTS_ENDPOINT}/me/order/${encodeURIComponent(orderNumber)}`
    );
    return getResponseData(response, "load payments");
  },

  /**
   * Asks the API to check my order's pending Stripe payment with Stripe and mark the order paid
   * if it was. Call when the customer returns from Stripe Checkout; safe to repeat.
   * POST /api/v1/payments/me/order/{orderNumber}/confirm
   */
  async confirmForMyOrder(orderNumber: string): Promise<PaymentResponse[]> {
    const response = await apiClient.post<ApiResponse<PaymentResponse[]>>(
      `${PAYMENTS_ENDPOINT}/me/order/${encodeURIComponent(orderNumber)}/confirm`
    );
    return getResponseData(response, "confirm the payment");
  },
};
