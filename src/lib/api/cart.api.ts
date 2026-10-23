import { apiClient } from "@/lib/api/client";
import {
  AddToCartRequest,
  CartResponse,
  UpdateCartItemRequest,
} from "@/types/cart-api";

const CART_ENDPOINT = "/api/v1/cart";

export const cartApi = {
  getCurrent(): Promise<CartResponse | undefined> {
    return apiClient.get<CartResponse | undefined>(CART_ENDPOINT);
  },

  addItem(request: AddToCartRequest): Promise<CartResponse> {
    return apiClient.post<CartResponse>(`${CART_ENDPOINT}/items`, request);
  },

  updateItem(
    cartItemId: number,
    request: UpdateCartItemRequest
  ): Promise<CartResponse> {
    return apiClient.put<CartResponse>(
      `${CART_ENDPOINT}/items/${cartItemId}`,
      request
    );
  },

  async removeItem(cartItemId: number): Promise<CartResponse | undefined> {
    await apiClient.delete<void>(`${CART_ENDPOINT}/items/${cartItemId}`);
    return apiClient.get<CartResponse | undefined>(CART_ENDPOINT);
  },

  async clear(): Promise<void> {
    await apiClient.delete<void>(CART_ENDPOINT);
  },
};
