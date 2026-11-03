"use client";

import { useEffect, useState } from "react";
import { productsApi } from "@/lib/api/products.api";
import { toCardProduct } from "@/lib/variants";
import { Product } from "@/types/product";
import { ApiProduct } from "@/types/product-api";

const FEATURED_COUNT = 8;

export const discountPercent = (product: Product) =>
  product.discountPercent !== undefined && product.discountPercent > 0
    ? product.discountPercent
    : product.price > product.discountedPrice && product.price > 0
    ? Math.round(((product.price - product.discountedPrice) / product.price) * 100)
    : 0;

export const productImage = (product: Product) =>
  product.imgs?.previews?.[0] || product.apiProduct?.imageCover || "";

/** Plain-text excerpt of the product description for banner copy. */
export const productExcerpt = (product: Product, length = 110) => {
  const text = (product.apiProduct?.description ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > length ? `${text.slice(0, length).trimEnd()}…` : text;
};

// The hero and promo banners both need these: share one round of requests.
let featuredProducts: Promise<Product[]> | null = null;

const loadFeaturedProducts = async (): Promise<Product[]> => {
  const items: ApiProduct[] = [];
  const add = (products: ApiProduct[]) => {
    const seen = new Set(items.map((product) => product.id));
    items.push(...products.filter((product) => !seen.has(product.id)));
  };

  add(await productsApi.getBestSellers(30, FEATURED_COUNT).catch(() => []));
  if (items.length < FEATURED_COUNT) {
    add(await productsApi.getNewArrivals(30, FEATURED_COUNT).catch(() => []));
  }
  // Quiet shop: fill the banners from the catalogue
  if (items.length < FEATURED_COUNT) {
    const page = await productsApi
      .getAll({ page: 0, size: FEATURED_COUNT * 2 })
      .catch(() => null);
    add(page?.content ?? []);
  }

  const hasImage = (product: Product) => (productImage(product) ? 1 : 0);

  return items
    .map(toCardProduct)
    // Products with a photo first, then products on sale
    .sort(
      (left, right) =>
        hasImage(right) - hasImage(left) ||
        discountPercent(right) - discountPercent(left)
    )
    .slice(0, FEATURED_COUNT);
};

const getFeaturedProducts = () => {
  featuredProducts ??= loadFeaturedProducts().catch((error) => {
    featuredProducts = null;
    throw error;
  });
  return featuredProducts;
};

/** Real products for the home page banners: best sellers, topped up with new arrivals. */
export const useFeaturedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    getFeaturedProducts()
      .then((items) => {
        if (isActive) setProducts(items);
      })
      .catch(() => {
        // Banners fall back to plain copy without a product
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  return { products, isLoading };
};
