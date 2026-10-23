import { apiClient } from "@/lib/api/client";
import { SubCategoryApiResponse } from "@/types/category";

export const subcategoriesApi = {
  getAll(categoryId?: number): Promise<SubCategoryApiResponse> {
    const params = new URLSearchParams();
    if (categoryId !== undefined) {
      params.set("categoryId", String(categoryId));
    }

    const query = params.toString();
    const endpoint = `/api/v1/sub-categories${query ? `?${query}` : ""}`;

    return apiClient.get<SubCategoryApiResponse>(endpoint);
  },
};
