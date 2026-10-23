import { apiClient } from "@/lib/api/client";
import { getResponseData } from "@/lib/api/auth.api";
import { ApiResponse } from "@/types/auth-api";
import {
  CreateReturnRequest,
  ReturnEligibilityResponse,
  ReturnPageResponse,
  ReturnResponse,
  ReturnStatus,
  ReturnableOrderResponse,
} from "@/types/return-api";

const RETURNS_ENDPOINT = "/api/v1/returns/me";

export const returnsApi = {
  /**
   * Get my returns, newest first. Supports pagination.
   * GET /api/v1/returns/me?page={page}&size={size}&sort={sort}
   */
  async getMyReturns(params?: {
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<ReturnPageResponse> {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.set("page", String(params.page));
    if (params?.size !== undefined) query.set("size", String(params.size));
    if (params?.sort !== undefined) query.set("sort", params.sort);
    const qs = query.toString();
    const url = qs ? `${RETURNS_ENDPOINT}?${qs}` : RETURNS_ENDPOINT;
    const response = await apiClient.get<
      ApiResponse<ReturnPageResponse | ReturnResponse[]>
    >(url);
    const data = getResponseData(response, "load my returns");

    if (Array.isArray(data)) {
      return {
        content: data,
        totalElements: data.length,
        totalPages: 1,
        currentPage: 0,
        pageSize: data.length,
        hasNext: false,
        hasPrevious: false,
      };
    }
    return data;
  },

  /**
   * Get one of my returns by returnNumber.
   * GET /api/v1/returns/me/{returnNumber}
   */
  async getByReturnNumber(returnNumber: string): Promise<ReturnResponse> {
    const response = await apiClient.get<ApiResponse<ReturnResponse>>(
      `${RETURNS_ENDPOINT}/${encodeURIComponent(returnNumber)}`
    );
    return getResponseData(response, "load return details");
  },

  /**
   * Alias for getByReturnNumber
   */
  async getMyReturn(returnNumber: string): Promise<ReturnResponse> {
    return this.getByReturnNumber(returnNumber);
  },

  /**
   * What the customer can still return from a delivered order, and until when.
   * GET /api/v1/returns/me/eligibility/{orderNumber}
   */
  async getEligibility(orderNumber: string): Promise<ReturnEligibilityResponse> {
    const response = await apiClient.get<ApiResponse<ReturnEligibilityResponse>>(
      `${RETURNS_ENDPOINT}/eligibility/${encodeURIComponent(orderNumber)}`
    );
    return getResponseData(response, "check if this order can be returned");
  },

  /**
   * My orders a return can still be requested for: delivered, inside the return period and not
   * already fully returned. Most recently delivered first.
   * GET /api/v1/returns/me/returnable-orders
   */
  async getReturnableOrders(): Promise<ReturnableOrderResponse[]> {
    const response = await apiClient.get<ApiResponse<ReturnableOrderResponse[]>>(
      `${RETURNS_ENDPOINT}/returnable-orders`
    );
    return getResponseData(response, "load your returnable orders");
  },

  /** POST /api/v1/returns/me */
  async requestReturn(request: CreateReturnRequest): Promise<ReturnResponse> {
    const response = await apiClient.post<ApiResponse<ReturnResponse>>(
      RETURNS_ENDPOINT,
      request
    );
    return getResponseData(response, "request this return");
  },

  /** GET /api/v1/returns/me/order/{orderNumber} */
  async getForOrder(orderNumber: string): Promise<ReturnResponse[]> {
    const response = await apiClient.get<ApiResponse<ReturnResponse[]>>(
      `${RETURNS_ENDPOINT}/order/${encodeURIComponent(orderNumber)}`
    );
    return getResponseData(response, "load returns");
  },

  /** Only while the store hasn't reviewed it yet. PATCH /api/v1/returns/me/{returnNumber}/cancel */
  async cancel(returnNumber: string): Promise<ReturnResponse> {
    const response = await apiClient.patch<ApiResponse<ReturnResponse>>(
      `${RETURNS_ENDPOINT}/${encodeURIComponent(returnNumber)}/cancel`
    );
    return getResponseData(response, "cancel this return");
  },
};

export const canCancelReturn = (status: ReturnStatus | string): boolean => {
  return status === "REQUESTED";
};

export const RETURN_STATUS_LABELS: Record<ReturnResponse["status"], string> = {
  REQUESTED: "Requested",
  APPROVED: "Approved – send items back",
  REJECTED: "Rejected",
  RECEIVED: "Refunded",
  CANCELLED: "Cancelled",
};

export const RETURN_STATUS_STYLES: Record<ReturnResponse["status"], string> = {
  REQUESTED: "text-yellow-dark bg-yellow-light-2 border border-yellow/30",
  APPROVED: "text-blue bg-blue-light-5 border border-blue/30",
  REJECTED: "text-red bg-red-light-6 border border-red/30",
  RECEIVED: "text-green bg-green-light-6 border border-green/30",
  CANCELLED: "text-gray-600 bg-gray-2 border border-gray-4",
};
