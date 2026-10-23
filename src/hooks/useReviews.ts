"use client";

import { useEffect, useState } from "react";
import { reviewsApi } from "@/lib/api/reviews.api";
import { Review } from "@/types/review";

export const useReviews = (page = 0, size = 10) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isActive = true;

    setIsLoading(true);
    setError(null);

    reviewsApi
      .getAll(page, size)
      .then((data) => {
        if (isActive) {
          setReviews(data.content ?? []);
        }
      })
      .catch((requestError: unknown) => {
        if (isActive) {
          setError(
            requestError instanceof Error
              ? requestError
              : new Error("Failed to load reviews.")
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
  }, [page, size, reloadKey]);

  return {
    reviews,
    isLoading,
    error,
    retry: () => setReloadKey((key) => key + 1),
  };
};
