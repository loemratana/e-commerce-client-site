"use client";
import React from "react";
import BannerImage from "../BannerImage";
import ProductLink from "../ProductLink";
import {
  discountPercent,
  productExcerpt,
  useFeaturedProducts,
} from "@/hooks/useFeaturedProducts";
import { formatMoney, useCurrency } from "@/lib/currency";
import { Product } from "@/types/product";

/** "UP TO 30% OFF" for products on sale, otherwise the price. */
const OfferLine = ({ product }: { product: Product }) =>
  discountPercent(product) > 0 ? (
    <>Up to {discountPercent(product)}% off</>
  ) : (
    <>From {formatMoney(product.discountedPrice)}</>
  );

const PromoBanner = () => {
  useCurrency(); // re-render prices if the store currency changes
  const { products, isLoading } = useFeaturedProducts();

  if (isLoading) {
    return (
      <section className="overflow-hidden py-20">
        <div className="site-container animate-pulse">
          <div className="h-[300px] rounded-lg bg-gray-2 mb-7.5" />
          <div className="grid gap-7.5 grid-cols-1 lg:grid-cols-2">
            <div className="h-[240px] rounded-lg bg-gray-2" />
            <div className="h-[240px] rounded-lg bg-gray-2" />
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  // The hero uses the first five; reuse earlier ones when there aren't eight
  const pick = (index: number) => products[index % products.length];
  const big = pick(5);
  const left = pick(6);
  const right = pick(7);

  return (
    <section className="overflow-hidden py-20">
      <div className="site-container">
        {/* <!-- promo banner big --> */}
        <div className="relative z-1 overflow-hidden rounded-lg bg-[#F5F5F7] py-12.5 lg:py-17.5 xl:py-22.5 px-4 sm:px-7.5 lg:px-14 xl:px-19 mb-7.5">
          <div className="max-w-[550px] w-full">
            <span className="block font-medium text-xl text-dark mb-3">
              {big.title}
            </span>

            <h2 className="font-bold text-xl lg:text-heading-4 xl:text-heading-3 text-dark mb-5 uppercase">
              <OfferLine product={big} />
            </h2>

            {productExcerpt(big, 160) && <p>{productExcerpt(big, 160)}</p>}

            <ProductLink
              product={big}
              className="inline-flex font-medium text-custom-sm text-white bg-blue py-[11px] px-9.5 rounded-md ease-out duration-200 hover:bg-blue-dark mt-7.5"
            >
              Buy Now
            </ProductLink>
          </div>

          <div className="absolute bottom-0 right-4 lg:right-26 -z-1 hidden sm:block h-[300px] w-[240px] lg:h-[350px] lg:w-[274px] opacity-90 sm:opacity-100">
            <BannerImage product={big} sizes="274px" className="object-bottom" />
          </div>
        </div>

        <div className="grid gap-7.5 grid-cols-1 lg:grid-cols-2">
          {/* <!-- promo banner small --> */}
          <div className="relative z-1 overflow-hidden rounded-lg bg-[#DBF4F3] py-10 xl:py-16 px-4 sm:px-7.5 xl:px-10">
            <div className="absolute top-1/2 -translate-y-1/2 left-3 sm:left-10 -z-1 h-[160px] w-[160px] sm:h-[220px] sm:w-[220px] opacity-40 sm:opacity-100">
              <BannerImage product={left} sizes="220px" />
            </div>

            <div className="text-right ml-auto max-w-[260px]">
              <span className="block text-lg text-dark mb-1.5 line-clamp-2">
                {left.title}
              </span>

              <h2 className="font-bold text-xl lg:text-heading-4 text-dark mb-2.5">
                {left.apiProduct?.brand?.brandName || "Featured"}
              </h2>

              <p className="font-semibold text-custom-1 text-teal">
                <OfferLine product={left} />
              </p>

              <ProductLink
                product={left}
                className="inline-flex font-medium text-custom-sm text-white bg-teal py-2.5 px-8.5 rounded-md ease-out duration-200 hover:bg-teal-dark mt-9"
              >
                Grab Now
              </ProductLink>
            </div>
          </div>

          {/* <!-- promo banner small --> */}
          <div className="relative z-1 overflow-hidden rounded-lg bg-[#FFECE1] py-10 xl:py-16 px-4 sm:px-7.5 xl:px-10">
            <div className="absolute top-1/2 -translate-y-1/2 right-3 sm:right-8.5 -z-1 h-[160px] w-[160px] sm:h-[200px] sm:w-[200px] opacity-40 sm:opacity-100">
              <BannerImage product={right} sizes="200px" />
            </div>

            <div className="max-w-[285px]">
              <span className="block text-lg text-dark mb-1.5 line-clamp-2">
                {right.title}
              </span>

              <h2 className="font-bold text-xl lg:text-heading-4 text-dark mb-2.5">
                {discountPercent(right) > 0 ? (
                  <>
                    Up to <span className="text-orange">{discountPercent(right)}%</span> off
                  </>
                ) : (
                  <span className="text-orange">{formatMoney(right.discountedPrice)}</span>
                )}
              </h2>

              {productExcerpt(right, 80) && (
                <p className="text-custom-sm">{productExcerpt(right, 80)}</p>
              )}

              <ProductLink
                product={right}
                className="inline-flex font-medium text-custom-sm text-white bg-orange py-2.5 px-8.5 rounded-md ease-out duration-200 hover:bg-orange-dark mt-7.5"
              >
                Buy Now
              </ProductLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromoBanner;
