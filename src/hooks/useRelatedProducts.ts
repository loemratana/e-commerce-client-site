"use client";

import { useEffect, useState } from "react";
import { productsApi } from "@/lib/api/products.api";
import { ApiProduct } from "@/types/product-api";

/** Products related to {@code productId} (same category, matching type); empty while loading or on error. */
export const useRelatedProducts = (productId: number | null | undefined, limit = 8) => {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(productId));

  useEffect(() => {
    if (!productId) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    let isActive = true;
    setIsLoading(true);
    productsApi
      .getRelated(productId, limit)
      .then((related) => {
        if (isActive) setProducts(Array.isArray(related) ? related : []);
      })
      .catch((error) => {
        console.error("Failed to load related products:", error);
        if (isActive) setProducts([]);
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [productId, limit]);

  return { products, isLoading };
};
