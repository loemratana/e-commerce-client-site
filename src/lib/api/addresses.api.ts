import { apiClient } from "@/lib/api/client";
import { getResponseData } from "@/lib/api/auth.api";
import { ApiResponse } from "@/types/auth-api";
import { AddressRequest, AddressResponse } from "@/types/order-api";

const ADDRESSES_ENDPOINT = "/api/v1/users/me/addresses";

export const addressesApi = {
  async getAll(): Promise<AddressResponse[]> {
    const response = await apiClient.get<ApiResponse<AddressResponse[]>>(
      ADDRESSES_ENDPOINT
    );
    return getResponseData(response, "load your addresses") ?? [];
  },

  async create(request: AddressRequest): Promise<AddressResponse> {
    const response = await apiClient.post<ApiResponse<AddressResponse>>(
      ADDRESSES_ENDPOINT,
      request
    );
    return getResponseData(response, "save your address");
  },

  async update(
    id: number,
    request: Partial<AddressRequest>
  ): Promise<AddressResponse> {
    const response = await apiClient.patch<ApiResponse<AddressResponse>>(
      `${ADDRESSES_ENDPOINT}/${id}`,
      request
    );
    return getResponseData(response, "update your address");
  },

  async remove(id: number): Promise<void> {
    const response = await apiClient.delete<ApiResponse<unknown>>(
      `${ADDRESSES_ENDPOINT}/${id}`
    );
    if (response?.success === false) {
      throw new Error(response.message || "Unable to delete your address.");
    }
  },

  async setDefault(id: number): Promise<AddressResponse> {
    const response = await apiClient.patch<ApiResponse<AddressResponse>>(
      `${ADDRESSES_ENDPOINT}/${id}/default`
    );
    return getResponseData(response, "set your default address");
  },
};
