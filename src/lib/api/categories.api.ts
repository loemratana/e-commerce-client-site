import { apiClient } from "@/lib/api/client";
import { CategoryApiResponse } from "@/types/category";

const CATEGORIES_ENDPOINT = "/api/v1/categories";

export const categoriesApi = {
  getAll: () => apiClient.get<CategoryApiResponse>(CATEGORIES_ENDPOINT),
};
