"use client";
import React from "react";
import HeroCarousel from "./HeroCarousel";
import HeroFeature from "./HeroFeature";
import Image from "next/image";
import BannerImage from "../BannerImage";
import ProductLink from "../ProductLink";
import { discountPercent, useFeaturedProducts } from "@/hooks/useFeaturedProducts";
import { formatMoney, useCurrency } from "@/lib/currency";
import { Product } from "@/types/product";

const HeroSideCard = ({ product }: { product: Product }) => (
  <div className="w-full relative rounded-[10px] bg-white p-4 sm:p-7.5">
    <div className="flex items-center justify-between gap-6">
      <div className="min-w-0">
        <h2 className="max-w-[170px] font-semibold text-dark text-xl mb-12 sm:mb-20 line-clamp-2">
          <ProductLink product={product} className="hover:text-blue">
            {product.title}
          </ProductLink>
        </h2>

        <div>
          <p className="font-medium text-dark-4 text-custom-sm mb-1.5">
            {discountPercent(product) > 0
              ? `${discountPercent(product)}% off`
              : "Shop now"}
          </p>
          <span className="flex items-center gap-3">
            <span className="font-medium text-heading-6 sm:text-heading-5 text-red">
              {formatMoney(product.discountedPrice)}
            </span>
            {product.price > product.discountedPrice && (
              <span className="font-medium text-xl text-dark-4 line-through">
                {formatMoney(product.price)}
              </span>
            )}
          </span>
        </div>
      </div>

      <ProductLink
        product={product}
        className="relative h-[161px] w-[123px] shrink-0"
      >
        <BannerImage product={product} sizes="123px" />
      </ProductLink>
    </div>
  </div>
);

const HeroSideCardSkeleton = () => (
  <div className="w-full flex animate-pulse items-center justify-between gap-6 rounded-[10px] bg-white p-4 sm:p-7.5">
    <div className="flex-1 space-y-3">
      <div className="h-6 w-3/4 rounded bg-gray-2" />
      <div className="h-4 w-1/2 rounded bg-gray-2 mt-14" />
      <div className="h-7 w-24 rounded bg-gray-2" />
    </div>
    <div className="h-[161px] w-[123px] rounded bg-gray-2" />
  </div>
);

const Hero = () => {
  useCurrency(); // re-render prices if the store currency changes
  const { products, isLoading } = useFeaturedProducts();
  // First three in the carousel, the next two in the side cards
  const slides = products.slice(0, 3);
  const sideCards = products.slice(3, 5);

  return (
    <section className="overflow-hidden pb-10 lg:pb-12.5 xl:pb-15 pt-6 lg:pt-8 xl:pt-10 bg-[#E5EAF4]">
      <div className="site-container">
        <div className="flex flex-wrap xl:flex-nowrap gap-5">
          <div className="w-full xl:w-auto xl:flex-1 xl:min-w-0">
            <div className="relative z-1 rounded-[10px] bg-white overflow-hidden">
              {/* <!-- bg shapes --> */}
              <Image
                src="/images/hero/hero-bg.png"
                alt=""
                className="absolute right-0 bottom-0 -z-1"
                width={534}
                height={520}
              />

              <HeroCarousel products={slides} isLoading={isLoading} />
            </div>
          </div>

          {(isLoading || sideCards.length > 0) && (
            <div className="w-full xl:w-[393px] xl:shrink-0">
              <div className="flex flex-col sm:flex-row xl:flex-col gap-5">
                {isLoading ? (
                  <>
                    <HeroSideCardSkeleton />
                    <HeroSideCardSkeleton />
                  </>
                ) : (
                  sideCards.map((product) => (
                    <HeroSideCard key={product.id} product={product} />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* <!-- Hero features --> */}
      <HeroFeature />
    </section>
  );
};

export default Hero;
