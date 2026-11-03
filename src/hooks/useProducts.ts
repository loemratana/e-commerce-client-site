"use client";

import { useEffect, useState } from "react";
import { productsService } from "@/lib/services/products.service";
import { ApiProduct, ProductFilters, ProductPage } from "@/types/product-api";

// One shared empty list: a new [] each render would look like new products to effects
const NO_PRODUCTS: ApiProduct[] = [];

export const useProducts = (filters: ProductFilters) => {
  const [result, setResult] = useState<ProductPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Depend on the individual values, not the object: callers pass a new filters object on
  // every render, which would refetch in a loop.
  const {
    type,
    title,
    brandId,
    subCategoryId,
    categoryId,
    minPrice,
    maxPrice,
    minRating,
    page,
    size,
  } = filters;

  useEffect(() => {
    let isActive = true;

    setIsLoading(true);
    setError(null);

    productsService
      .getAll({
        type,
        title,
        brandId,
        subCategoryId,
        categoryId,
        minPrice,
        maxPrice,
        minRating,
        page,
        size,
      })
      .then((response) => {
        if (isActive) {
          setResult(response);
        }
      })
      .catch((requestError: unknown) => {
        if (isActive) {
          setError(
            requestError instanceof Error
              ? requestError
              : new Error("Failed to load products.")
          );
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [
    type,
    title,
    brandId,
    subCategoryId,
    categoryId,
    minPrice,
    maxPrice,
    minRating,
    page,
    size,
    reloadKey,
  ]);

  return {
    products: result?.content ?? NO_PRODUCTS,
    pagination: result?.page ?? null,
    isLoading,
    error,
    retry: () => setReloadKey((key) => key + 1),
  };
};
