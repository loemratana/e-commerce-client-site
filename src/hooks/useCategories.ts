"use client";

import { useEffect, useState } from "react";
import { categoriesService } from "@/lib/services/categories.service";
import { Category } from "@/types/category";

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isActive = true;

    setIsLoading(true);
    setError(null);

    categoriesService
      .getAll()
      .then((data) => {
        if (isActive) {
          setCategories(data);
        }
      })
      .catch((requestError: unknown) => {
        if (isActive) {
          setError(
            requestError instanceof Error
              ? requestError
              : new Error("Failed to load categories.")
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
    categories,
    isLoading,
    error,
    retry: () => setReloadKey((key) => key + 1),
  };
};
