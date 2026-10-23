import { apiClient } from "@/lib/api/client";
import { getResponseData } from "@/lib/api/auth.api";
import { ApiResponse } from "@/types/auth-api";
import {
  CheckoutRequest,
  GetOrdersParams,
  OrderResponse,
  OrderStatsResponse,
  OrderSummaryResponse,
  PageResponse,
  PlaceOrderRequest,
  UpdateOrderStatusRequest,
} from "@/types/order-api";

const ORDERS_ENDPOINT = "/api/v1/orders";

export const ordersApi = {
  /**
   * Admin: Get all orders, optionally filtered by status, searched by order number/email/name, and paginated.
   * GET /api/v1/orders
   */
  async getOrders(
    params: GetOrdersParams = {}
  ): Promise<PageResponse<OrderSummaryResponse>> {
    const searchParams = new URLSearchParams();
    if (params.page !== undefined) {
      searchParams.set("page", String(params.page));
    }
    if (params.size !== undefined) {
      searchParams.set("size", String(params.size));
    }
    if (params.status) {
      searchParams.set("status", params.status);
    }
    if (params.search && params.search.trim()) {
      searchParams.set("search", params.search.trim());
    }
    if (params.sort) {
      searchParams.set("sort", params.sort);
    }

    const queryString = searchParams.toString();
    const endpoint = queryString
      ? `${ORDERS_ENDPOINT}?${queryString}`
      : ORDERS_ENDPOINT;

    const response = await apiClient.get<
      ApiResponse<PageResponse<OrderSummaryResponse>>
    >(endpoint);
    return getResponseData(response, "load orders");
  },

  /** Alias for getOrders */
  getAll(params: GetOrdersParams = {}) {
    return this.getOrders(params);
  },

  /**
   * Direct order placement for given items and quantities.
   * POST /api/v1/orders
   */
  async placeOrder(request: PlaceOrderRequest): Promise<OrderResponse> {
    const response = await apiClient.post<ApiResponse<OrderResponse>>(
      ORDERS_ENDPOINT,
      request
    );
    return getResponseData(response, "place your order");
  },

  /**
   * Places an order from the user's server-side cart; the server empties the cart afterwards.
   * POST /api/v1/orders/checkout
   */
  async checkoutCart(request: CheckoutRequest): Promise<OrderResponse> {
    const response = await apiClient.post<ApiResponse<OrderResponse>>(
      `${ORDERS_ENDPOINT}/checkout`,
      request
    );
    return getResponseData(response, "place your order");
  },

  /** Alias for checkoutCart (backwards compatibility) */
  checkout(request: CheckoutRequest) {
    return this.checkoutCart(request);
  },

  /**
   * Admin: Update an order's status.
   * Allowed: PENDING -> PAID -> PROCESSING -> SHIPPED -> DELIVERED; CANCELLED is possible until SHIPPED.
   * PATCH /api/v1/orders/{orderNumber}/status
   */
  async updateOrderStatus(
    orderNumber: string,
    request: UpdateOrderStatusRequest
  ): Promise<OrderResponse> {
    const response = await apiClient.patch<ApiResponse<OrderResponse>>(
      `${ORDERS_ENDPOINT}/${encodeURIComponent(orderNumber)}/status`,
      request
    );
    return getResponseData(response, "update order status");
  },

  /** Alias for updateOrderStatus */
  updateStatus(orderNumber: string, request: UpdateOrderStatusRequest) {
    return this.updateOrderStatus(orderNumber, request);
  },

  /**
   * Customer: Cancel one of own orders (allowed while order is PENDING or PAID).
   * PATCH /api/v1/orders/me/{orderNumber}/cancel
   */
  async cancelMyOrder(orderNumber: string): Promise<OrderResponse> {
    const response = await apiClient.patch<ApiResponse<OrderResponse>>(
      `${ORDERS_ENDPOINT}/me/${encodeURIComponent(orderNumber)}/cancel`
    );
    return getResponseData(response, "cancel this order");
  },

  /** Alias for cancelMyOrder (backwards compatibility) */
  cancel(orderNumber: string) {
    return this.cancelMyOrder(orderNumber);
  },

  /**
   * Admin: Get order details by order number.
   * GET /api/v1/orders/{orderNumber}
   */
  async getOrderByNumber(orderNumber: string): Promise<OrderResponse> {
    const response = await apiClient.get<ApiResponse<OrderResponse>>(
      `${ORDERS_ENDPOINT}/${encodeURIComponent(orderNumber)}`
    );
    return getResponseData(response, "load order details");
  },

  /** Alias for getOrderByNumber */
  getByOrderNumber(orderNumber: string) {
    return this.getOrderByNumber(orderNumber);
  },

  /**
   * Admin: Order counts per status and total revenue for the admin dashboard.
   * GET /api/v1/orders/stats
   */
  async getOrderStatistics(): Promise<OrderStatsResponse> {
    const response = await apiClient.get<ApiResponse<OrderStatsResponse>>(
      `${ORDERS_ENDPOINT}/stats`
    );
    return getResponseData(response, "load order statistics");
  },

  /** Alias for getOrderStatistics */
  getStats() {
    return this.getOrderStatistics();
  },

  /**
   * Customer: Get my orders, newest first.
   * GET /api/v1/orders/me
   */
  async getMyOrders(
    pageOrParams: number | { page?: number; size?: number; sort?: string } = 0,
    sizeArg = 10
  ): Promise<PageResponse<OrderSummaryResponse>> {
    let page = 0;
    let size = 10;
    let sort: string | undefined;

    if (typeof pageOrParams === "number") {
      page = pageOrParams;
      size = sizeArg;
    } else if (pageOrParams && typeof pageOrParams === "object") {
      page = pageOrParams.page ?? 0;
      size = pageOrParams.size ?? 10;
      sort = pageOrParams.sort;
    }

    const searchParams = new URLSearchParams({
      page: String(page),
      size: String(size),
    });
    if (sort) {
      searchParams.set("sort", sort);
    }

    const response = await apiClient.get<
      ApiResponse<PageResponse<OrderSummaryResponse>>
    >(`${ORDERS_ENDPOINT}/me?${searchParams.toString()}`);
    return getResponseData(response, "load your orders");
  },

  /** Alias for getMyOrders (backwards compatibility) */
  getMine(page = 0, size = 10) {
    return this.getMyOrders(page, size);
  },

  /**
   * Customer: Get one of my orders by order number.
   * GET /api/v1/orders/me/{orderNumber}
   */
  async getMyOrder(orderNumber: string): Promise<OrderResponse> {
    const response = await apiClient.get<ApiResponse<OrderResponse>>(
      `${ORDERS_ENDPOINT}/me/${encodeURIComponent(orderNumber)}`
    );
    return getResponseData(response, "load this order");
  },

  /**
   * Customer: Download the PDF invoice for one of my orders and save it.
   * Only paid orders have one (see hasInvoice); the API answers 409 otherwise.
   * GET /api/v1/orders/me/{orderNumber}/invoice
   */
  async downloadMyInvoice(orderNumber: string): Promise<void> {
    const { blob, fileName } = await apiClient.getBlob(
      `${ORDERS_ENDPOINT}/me/${encodeURIComponent(orderNumber)}/invoice`
    );
    const url = URL.createObjectURL(blob);
    const link = Object.assign(document.createElement("a"), {
      href: url,
      download: fileName ?? `invoice-${orderNumber}.pdf`,
    });
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Revoke on the next tick so the browser has started the download.
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  },
};
