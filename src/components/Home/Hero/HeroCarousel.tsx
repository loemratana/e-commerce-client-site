"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";

// Import Swiper styles
import "swiper/css/pagination";
import "swiper/css";

import BannerImage from "../BannerImage";
import ProductLink from "../ProductLink";
import { discountPercent, productExcerpt } from "@/hooks/useFeaturedProducts";
import { formatMoney } from "@/lib/currency";
import { Product } from "@/types/product";

const HeroSlide = ({ product }: { product: Product }) => {
  const discount = discountPercent(product);

  return (
    <div className="flex items-center pt-6 sm:pt-0 flex-col-reverse sm:flex-row">
      <div className="max-w-[394px] py-10 sm:py-15 lg:py-24.5 pl-4 sm:pl-7.5 lg:pl-12.5">
        <div className="flex items-center gap-4 mb-7.5 sm:mb-10">
          {discount > 0 ? (
            <>
              <span className="block font-semibold text-heading-3 sm:text-heading-1 text-blue">
                {discount}%
              </span>
              <span className="block text-dark text-sm sm:text-custom-1 sm:leading-[24px]">
                Sale
                <br />
                Off
              </span>
            </>
          ) : (
            <span className="block font-semibold text-heading-5 sm:text-heading-4 text-blue">
              {formatMoney(product.discountedPrice)}
            </span>
          )}
        </div>

        <h1 className="font-semibold text-dark text-xl sm:text-3xl mb-3">
          <ProductLink product={product} className="hover:text-blue">
            {product.title}
          </ProductLink>
        </h1>

        {productExcerpt(product) && <p>{productExcerpt(product)}</p>}

        <ProductLink
          product={product}
          className="inline-flex font-medium text-white text-custom-sm rounded-md bg-dark py-3 px-9 ease-out duration-200 hover:bg-blue mt-10"
        >
          Shop Now
        </ProductLink>
      </div>

      <div className="relative h-[280px] w-[280px] sm:h-[358px] sm:w-[351px] shrink-0">
        <BannerImage product={product} sizes="351px" />
      </div>
    </div>
  );
};

const HeroCarousal = ({
  products,
  isLoading,
}: {
  products: Product[];
  isLoading: boolean;
}) => {
  if (isLoading) {
    return (
      <div className="flex animate-pulse items-center gap-10 py-15 lg:py-24.5 pl-4 sm:pl-7.5 lg:pl-12.5">
        <div className="flex-1 space-y-4">
          <div className="h-12 w-32 rounded bg-gray-2" />
          <div className="h-8 w-3/4 rounded bg-gray-2" />
          <div className="h-4 w-2/3 rounded bg-gray-2" />
          <div className="h-11 w-36 rounded bg-gray-2" />
        </div>
        <div className="hidden sm:block h-[300px] w-[300px] rounded-lg bg-gray-2" />
      </div>
    );
  }

  // No products yet: a plain welcome slide instead of an empty carousel
  if (products.length === 0) {
    return (
      <div className="max-w-[460px] py-15 lg:py-24.5 pl-4 sm:pl-7.5 lg:pl-12.5">
        <h1 className="font-semibold text-dark text-xl sm:text-3xl mb-3">
          Discover our latest products
        </h1>
        <ProductLink
          product={undefined}
          className="inline-flex font-medium text-white text-custom-sm rounded-md bg-dark py-3 px-9 ease-out duration-200 hover:bg-blue mt-7"
        >
          Shop Now
        </ProductLink>
      </div>
    );
  }

  return (
    <Swiper
      spaceBetween={30}
      centeredSlides={true}
      autoplay={{
        delay: 3500,
        disableOnInteraction: false,
      }}
      pagination={{
        clickable: true,
      }}
      loop={products.length > 1}
      modules={[Autoplay, Pagination]}
      className="hero-carousel"
    >
      {products.map((product) => (
        <SwiperSlide key={product.id}>
          <HeroSlide product={product} />
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default HeroCarousal;
