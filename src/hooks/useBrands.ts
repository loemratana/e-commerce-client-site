"use client";

import { useEffect, useState } from "react";
import { brandsApi } from "@/lib/api/brands.api";
import { Brand } from "@/types/brand";

export const useBrands = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isActive = true;

    setIsLoading(true);
    setError(null);

    brandsApi
      .getAll()
      .then((data) => {
        if (isActive) {
          setBrands(data);
        }
      })
      .catch((requestError: unknown) => {
        if (isActive) {
          setError(
            requestError instanceof Error
              ? requestError
              : new Error("Failed to load brands.")
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
  }, [reloadKey]);

  return {
    brands,
    isLoading,
    error,
    retry: () => setReloadKey((key) => key + 1),
  };
};
