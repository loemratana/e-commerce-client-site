import { categoriesApi } from "@/lib/api/categories.api";
import { Category } from "@/types/category";

export const categoriesService = {
  async getAll(): Promise<Category[]> {
    const response = await categoriesApi.getAll();

    if (!response.success) {
      throw new Error(response.message || "Failed to load categories.");
    }

    if (!Array.isArray(response.data)) {
      throw new Error("The categories response has an invalid data format.");
    }

    return response.data;
  },
};
