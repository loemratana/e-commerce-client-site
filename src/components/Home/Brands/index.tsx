"use client";
import { useCallback, useRef } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, FreeMode } from "swiper/modules";
import { BadgeCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { useBrands } from "@/hooks/useBrands";
import { Brand } from "@/types/brand";

// Import Swiper styles
import "swiper/css";
import "swiper/css/free-mode";

const BrandLogo = ({ brand }: { brand: Brand }) => (
  <Link
    href={`/shop-with-sidebar?brandId=${brand.id}`}
    className="group flex flex-col items-center gap-3"
    title={`Shop ${brand.name}`}
  >
    <div className="flex h-24 w-full items-center justify-center rounded-xl border border-gray-3 bg-white p-4 transition-all duration-300 group-hover:border-blue group-hover:shadow-1">
      {brand.image ? (
        // Logos come in any shape: fit the whole logo instead of cropping it
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={brand.image}
          alt={brand.name}
          className="max-h-full max-w-full object-contain grayscale-[30%] transition duration-300 group-hover:grayscale-0 group-hover:scale-105"
        />
      ) : (
        <span className="text-lg font-semibold text-dark-4 group-hover:text-blue">
          {brand.name}
        </span>
      )}
    </div>
    <span className="text-sm font-medium text-dark group-hover:text-blue">
      {brand.name}
    </span>
  </Link>
);

const Brands = () => {
  const sliderRef = useRef(null);
  const { brands, isLoading, error, retry } = useBrands();

  const handlePrev = useCallback(() => {
    if (!sliderRef.current) return;
    sliderRef.current.swiper.slidePrev();
  }, []);

  const handleNext = useCallback(() => {
    if (!sliderRef.current) return;
    sliderRef.current.swiper.slideNext();
  }, []);

  // Nothing to shop by: leave the section out of the page
  if (!isLoading && !error && brands.length === 0) return null;

  return (
    <section className="overflow-hidden pt-17.5">
      <div className="site-container pb-15 border-b border-gray-3">
        {/* <!-- section title --> */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <span className="flex items-center gap-2.5 font-medium text-dark mb-1.5">
              <BadgeCheck size={20} className="text-blue" aria-hidden="true" />
              Brands
            </span>
            <h2 className="font-semibold text-xl xl:text-heading-5 text-dark">
              Shop by Brand
            </h2>
          </div>

          {brands.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous brands"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-3 bg-white text-dark hover:border-blue hover:bg-blue hover:text-white transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next brands"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-3 bg-white text-dark hover:border-blue hover:bg-blue hover:text-white transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>

        {isLoading && (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex flex-col items-center gap-3 animate-pulse">
                <div className="h-24 w-full rounded-xl bg-gray-2" />
                <div className="h-4 w-16 rounded bg-gray-2" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && error && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-dark-4">{error.message}</p>
            <button
              type="button"
              onClick={retry}
              className="rounded-md bg-blue px-5 py-2 font-medium text-white hover:bg-blue-dark"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !error && brands.length > 0 && (
          <Swiper
            ref={sliderRef}
            modules={[Autoplay, FreeMode]}
            freeMode
            grabCursor
            loop={brands.length > 6}
            autoplay={{
              delay: 2500,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            spaceBetween={20}
            slidesPerView={2}
            breakpoints={{
              640: { slidesPerView: 3 },
              1000: { slidesPerView: 4 },
              1200: { slidesPerView: 6 },
            }}
          >
            {brands.map((brand) => (
              <SwiperSlide key={brand.id}>
                <BrandLogo brand={brand} />
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>
    </section>
  );
};

export default Brands;
