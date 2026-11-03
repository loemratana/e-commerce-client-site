import { apiClient } from "@/lib/api/client";
import { getResponseData } from "@/lib/api/auth.api";
import { ApiResponse } from "@/types/auth-api";
import { Brand } from "@/types/brand";

const BRANDS_ENDPOINT = "/api/v1/brands";

export const brandsApi = {
  /** GET /api/v1/brands */
  async getAll(): Promise<Brand[]> {
    const response = await apiClient.get<ApiResponse<Brand[]>>(BRANDS_ENDPOINT);
    const brands = getResponseData(response, "load brands");

    if (!Array.isArray(brands)) {
      throw new Error("The brands response has an invalid data format.");
    }

    return brands;
  },
};
