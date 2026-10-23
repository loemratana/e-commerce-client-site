import { apiClient } from "@/lib/api/client";
import { getResponseData } from "@/lib/api/auth.api";
import { ApiResponse } from "@/types/auth-api";
import { CartResponse } from "@/types/cart-api";
import { PageResponse } from "@/types/order-api";
import {
  MoveToCartRequest,
  WishlistItemResponse,
} from "@/types/wishlist-api";

const WISHLIST_ENDPOINT = "/api/v1/wishlist";

/** Rows per wishlist page (the API caps it at 50). */
export const WISHLIST_PAGE_SIZE = 10;

export const wishlistApi = {
  /** Every saved product id, unpaged: drives hearts and the header badge. */
  async getProductIds(): Promise<number[]> {
    return getResponseData(
      await apiClient.get<ApiResponse<number[]>>(`${WISHLIST_ENDPOINT}/product-ids`),
      "load your wishlist"
    );
  },

  async getMine(
    page = 0,
    size = WISHLIST_PAGE_SIZE
  ): Promise<PageResponse<WishlistItemResponse>> {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
    });
    return getResponseData(
      await apiClient.get<ApiResponse<PageResponse<WishlistItemResponse>>>(
        `${WISHLIST_ENDPOINT}?${params.toString()}`
      ),
      "load your wishlist"
    );
  },

  /** Idempotent on the server: re-adding returns the existing entry. */
  async add(productId: number): Promise<WishlistItemResponse> {
    return getResponseData(
      await apiClient.post<ApiResponse<WishlistItemResponse>>(
        `${WISHLIST_ENDPOINT}/${productId}`
      ),
      "add to wishlist"
    );
  },

  async remove(productId: number): Promise<void> {
    await apiClient.delete<void>(`${WISHLIST_ENDPOINT}/${productId}`);
  },

  async clear(): Promise<void> {
    await apiClient.delete<void>(WISHLIST_ENDPOINT);
  },

  /** Adds the chosen variant to the cart and removes the product from the wishlist. */
  async moveToCart(
    productId: number,
    request: MoveToCartRequest
  ): Promise<CartResponse> {
    return getResponseData(
      await apiClient.post<ApiResponse<CartResponse>>(
        `${WISHLIST_ENDPOINT}/${productId}/move-to-cart`,
        request
      ),
      "move this item to your cart"
    );
  },
};
