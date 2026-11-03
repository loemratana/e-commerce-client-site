"use client";

import { useEffect, useState } from "react";
import { couponsApi } from "@/lib/api/coupons.api";
import { AvailableCoupon } from "@/types/order-api";

// One request per page load: the product page, quick view and checkout all show the same list.
let cached: Promise<AvailableCoupon[]> | null = null;

const loadCoupons = () => {
  cached ??= couponsApi.getAvailable().catch((error) => {
    console.error("Failed to load coupons:", error);
    cached = null; // try again next time
    return [];
  });
  return cached;
};

/** Coupons shoppers can use right now; empty while loading or when there are none. */
export const useAvailableCoupons = () => {
  const [coupons, setCoupons] = useState<AvailableCoupon[]>([]);

  useEffect(() => {
    let isActive = true;
    loadCoupons().then((list) => {
      if (isActive) setCoupons(list);
    });
    return () => {
      isActive = false;
    };
  }, []);

  return coupons;
};
