"use client";

import { useEffect, useState } from "react";
import { usersApi } from "@/lib/api/users.api";
import { GetUsersParams, UserPageResponse } from "@/types/auth-api";

export const useUsers = (params: GetUsersParams = {}) => {
  const [data, setData] = useState<UserPageResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Depend on the individual values, not the object: callers pass a new params object on
  // every render (and the default {} is new each time), which would refetch in a loop.
  const { page, size, sortBy, sortDirection, search, role, active } = params;

  useEffect(() => {
    let isActive = true;

    setIsLoading(true);
    setError(null);

    usersApi
      .getUsers({ page, size, sortBy, sortDirection, search, role, active })
      .then((response) => {
        if (isActive) {
          setData(response);
        }
      })
      .catch((requestError: unknown) => {
        if (isActive) {
          setError(
            requestError instanceof Error
              ? requestError
              : new Error("Failed to load users.")
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
  }, [page, size, sortBy, sortDirection, search, role, active, reloadKey]);

  return {
    users: data?.content ?? [],
    pagination: data,
    isLoading,
    error,
    retry: () => setReloadKey((key) => key + 1),
  };
};
