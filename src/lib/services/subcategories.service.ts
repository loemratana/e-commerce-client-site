import { subcategoriesApi } from "@/lib/api/subcategories.api";
import { SubCategory } from "@/types/category";

export const subcategoriesService = {
  async getAll(categoryId?: number): Promise<SubCategory[]> {
    const response = await subcategoriesApi.getAll(categoryId);

    if (!response.success || !Array.isArray(response.data)) {
      throw new Error(response.message || "Failed to load sub-categories.");
    }

    return response.data;
  },
};
