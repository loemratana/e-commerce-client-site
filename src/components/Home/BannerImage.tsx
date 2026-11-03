import React from "react";
import Image from "next/image";
import { productImage } from "@/hooks/useFeaturedProducts";
import { Product } from "@/types/product";

type BannerImageProps = {
  product: Product;
  /** Passed to next/image; the parent sets the box size and must be positioned. */
  sizes: string;
  className?: string;
};

// The product photo, or the store logo on a soft tile while a product has no photo yet.
const BannerImage = ({ product, sizes, className = "" }: BannerImageProps) => {
  const src = productImage(product);

  if (src) {
    return (
      <Image
        src={src}
        alt={product.title}
        fill
        unoptimized
        sizes={sizes}
        className={`object-contain ${className}`}
      />
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/60">
      <div className="relative h-1/2 w-1/2 opacity-60">
        <Image
          src="/images/logo/system-logo.png"
          alt={product.title}
          fill
          sizes={sizes}
          className="object-contain"
        />
      </div>
    </div>
  );
};

export default BannerImage;
