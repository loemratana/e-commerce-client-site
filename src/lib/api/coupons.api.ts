import { apiClient } from "@/lib/api/client";
import { getResponseData } from "@/lib/api/auth.api";
import { ApiResponse } from "@/types/auth-api";
import { CouponResponse } from "@/types/order-api";

const COUPONS_ENDPOINT = "/api/v1/coupons";

export const couponsApi = {
  /** Throws with the server's message when the code is invalid, expired or below the minimum order. */
  async validate(code: string, orderAmount?: number): Promise<CouponResponse> {
    const query =
      orderAmount !== undefined ? `?orderAmount=${orderAmount.toFixed(2)}` : "";
    const response = await apiClient.get<ApiResponse<CouponResponse>>(
      `${COUPONS_ENDPOINT}/validate/${encodeURIComponent(code)}${query}`
    );
    return getResponseData(response, "validate this coupon");
  },
};
