"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import BannerImage from "../BannerImage";
import ProductLink from "../ProductLink";
import { productsApi } from "@/lib/api/products.api";
import { toCardProduct } from "@/lib/variants";
import {
  discountPercent,
  productExcerpt,
  productImage,
  useFeaturedProducts,
} from "@/hooks/useFeaturedProducts";
import { formatMoney, useCurrency } from "@/lib/currency";
import { Product } from "@/types/product";

// Same look as the old countdown boxes
const DetailBox = ({ value, label }: { value: React.ReactNode; label: string }) => (
  <div>
    <span className="min-w-[64px] h-14.5 font-semibold text-xl lg:text-2xl text-dark rounded-lg flex items-center justify-center bg-white shadow-2 px-4 mb-2 whitespace-nowrap">
      {value}
    </span>
    <span className="block text-custom-sm text-dark text-center">{label}</span>
  </div>
);

/** Spotlight on the newest product (the hero and promo banners show best sellers). */
const CounDown = () => {
  useCurrency(); // re-render prices if the store currency changes
  const { products: featured, isLoading: featuredLoading } = useFeaturedProducts();
  const [newest, setNewest] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    productsApi
      .getNewArrivals(30, 8)
      .then((items) => {
        // Prefer a new product that has a photo
        const cards = items.map(toCardProduct);
        const item = cards.find((card) => productImage(card)) ?? cards[0];
        if (isActive && item) setNewest(item);
      })
      .catch(() => {
        // Falls back to a featured product
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const product = newest ?? featured[featured.length - 1];

  if (isLoading || (!newest && featuredLoading)) {
    return (
      <section className="overflow-hidden py-20">
        <div className="site-container">
          <div className="h-[380px] animate-pulse rounded-lg bg-gray-2" />
        </div>
      </section>
    );
  }

  if (!product) return null;

  const discount = discountPercent(product);
  const rating = product.apiProduct?.ratingsAverage ?? 0;
  const brandName = product.apiProduct?.brand?.brandName;

  return (
    <section className="overflow-hidden py-20">
      <div className="site-container">
        <div className="relative overflow-hidden z-1 rounded-lg bg-[#D0E9F3] p-4 sm:p-7.5 lg:p-10 xl:p-15">
          <div className="max-w-[422px] w-full">
            <span className="block font-medium text-custom-1 text-blue mb-2.5">
              {newest ? "Just Arrived" : "Don’t Miss!"}
            </span>

            <h2 className="font-bold text-dark text-xl lg:text-heading-4 xl:text-heading-3 mb-3">
              <ProductLink product={product} className="hover:text-blue">
                {product.title}
              </ProductLink>
            </h2>

            {productExcerpt(product, 140) && <p>{productExcerpt(product, 140)}</p>}

            {/* <!-- Product details --> */}
            <div className="flex flex-wrap gap-6 mt-6">
              <DetailBox value={formatMoney(product.discountedPrice)} label="Price" />
              {discount > 0 && <DetailBox value={`${discount}%`} label="Off" />}
              {rating > 0 && (
                <DetailBox value={`★ ${rating.toFixed(1)}`} label="Rating" />
              )}
              {brandName && <DetailBox value={brandName} label="Brand" />}
            </div>

            <ProductLink
              product={product}
              className="inline-flex font-medium text-custom-sm text-white bg-blue py-3 px-9.5 rounded-md ease-out duration-200 hover:bg-blue-dark mt-7.5"
            >
              Check it Out!
            </ProductLink>
          </div>

          {/* <!-- bg shapes --> */}
          <Image
            src="/images/countdown/countdown-bg.png"
            alt=""
            className="hidden sm:block absolute right-0 bottom-0 -z-1"
            width={737}
            height={482}
          />
          <div className="hidden lg:block absolute right-4 xl:right-33 bottom-4 xl:bottom-10 -z-1 h-[320px] w-[350px] xl:h-[376px] xl:w-[411px]">
            <BannerImage product={product} sizes="411px" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CounDown;
