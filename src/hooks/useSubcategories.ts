"use client";

import { useEffect, useState } from "react";
import { subcategoriesService } from "@/lib/services/subcategories.service";
import { SubCategory } from "@/types/category";

export const useSubcategories = (categoryId?: number) => {
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isActive = true;

    setIsLoading(true);
    setError(null);
    setSubcategories([]);

    subcategoriesService
      .getAll(categoryId)
      .then((data) => {
        if (isActive) {
          setSubcategories(data);
        }
      })
      .catch((requestError: unknown) => {
        if (isActive) {
          setError(
            requestError instanceof Error
              ? requestError
              : new Error("Failed to load sub-categories.")
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
  }, [categoryId]);

  return { subcategories, isLoading, error };
};
