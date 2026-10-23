import { productsApi } from "@/lib/api/products.api";
import { ProductFilters, ProductPage } from "@/types/product-api";

export const productsService = {
  async getAll(filters: ProductFilters): Promise<ProductPage> {
    const response = await productsApi.getAll(filters);

    if (
      !response ||
      !Array.isArray(response.content) ||
      !response.page ||
      typeof response.page.totalElements !== "number" ||
      typeof response.page.totalPages !== "number"
    ) {
      throw new Error("The products response has an invalid format.");
    }

    return response;
  },
};
