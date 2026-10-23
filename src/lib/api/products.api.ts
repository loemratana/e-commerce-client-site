import { apiClient } from "@/lib/api/client";
import {
  ApiProduct,
  BestSellerSummaryResponse,
  ProductFilters,
  ProductPage,
  ProductSummaryResponse,
} from "@/types/product-api";

const PRODUCTS_ENDPOINT = "/api/v1/product";

const getDetailedProducts = async (
  summaries: Array<{ id: number }>
): Promise<ApiProduct[]> => {
  const detailedProducts = await Promise.all(
    summaries.map(async (summary) => {
      try {
        return await apiClient.get<ApiProduct>(
          `${PRODUCTS_ENDPOINT}/${summary.id}`
        );
      } catch (error) {
        console.error(`Failed to load product ${summary.id}:`, error);
        return null;
      }
    })
  );

  return detailedProducts.filter((product): product is ApiProduct => product !== null);
};

export const productsApi = {
  getAll(filters: ProductFilters): Promise<ProductPage> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, String(value));
      }
    });

    return apiClient.get<ProductPage>(
      `${PRODUCTS_ENDPOINT}?${params.toString()}`
    );
  },

  getById(id: number | string): Promise<ApiProduct> {
    return apiClient.get<ApiProduct>(`${PRODUCTS_ENDPOINT}/${id}`);
  },

  /**
   * Newest in-stock products added in the last N days with complete variant details
   * GET /api/v1/product/new-arrivals?days={days}&limit={limit}
   */
  async getNewArrivals(
    days = 30,
    limit = 12
  ): Promise<ApiProduct[]> {
    const response = await apiClient.get<
      ProductSummaryResponse[] | { data: ProductSummaryResponse[] }
    >(`${PRODUCTS_ENDPOINT}/new-arrivals?days=${days}&limit=${limit}`);

    const summaries = Array.isArray(response)
      ? response
      : (response as { data?: ProductSummaryResponse[] })?.data ?? [];

    if (!summaries.length) {
      return [];
    }

    return getDetailedProducts(summaries);
  },

  /**
   * Best-selling products in the last N days with complete variant details
   * GET /api/v1/product/best-sellers?days={days}&limit={limit}
   */
  async getBestSellers(days = 30, limit = 12): Promise<ApiProduct[]> {
    const response = await apiClient.get<
      BestSellerSummaryResponse[] | { data?: BestSellerSummaryResponse[] }
    >(`${PRODUCTS_ENDPOINT}/best-sellers?days=${days}&limit=${limit}`);

    const summaries = Array.isArray(response) ? response : response?.data ?? [];

    if (!summaries.length) {
      return [];
    }

    return getDetailedProducts(summaries);
  },
};
