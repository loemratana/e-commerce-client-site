"use client";
import Image from "next/image";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { updateQuickView } from "@/redux/features/quickView-slice";
import { useRelatedProducts } from "@/hooks/useRelatedProducts";
import { effectivePrice, isInStock, toCardProduct } from "@/lib/variants";
import { formatPrice } from "@/lib/order-utils";
import { ApiProduct } from "@/types/product-api";

const lowestPrice = (product: ApiProduct) => {
  const variants = product.variants ?? [];
  const candidates = variants.some(isInStock) ? variants.filter(isInStock) : variants;
  return candidates.length ? Math.min(...candidates.map(effectivePrice)) : null;
};

/** "You may also like" row under the quick view; picking one shows it in the same modal. */
const QuickViewRelated = ({ productId }: { productId: number }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { products, isLoading } = useRelatedProducts(productId, 4);

  if (!isLoading && products.length === 0) return null;

  const show = (product: ApiProduct) => {
    dispatch(updateQuickView(toCardProduct(product)));
    document.querySelector(".modal-content")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="mt-8 border-t border-gray-3 pt-6">
      <h3 className="mb-4 font-medium text-lg text-dark">You may also like</h3>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="h-[190px] animate-pulse rounded-lg bg-gray-2" />
            ))
          : products.map((product) => {
              const price = lowestPrice(product);
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => show(product)}
                  className="group rounded-lg border border-gray-3 p-3 text-left duration-200 hover:border-blue"
                >
                  <span className="relative mb-3 block aspect-square overflow-hidden rounded-md bg-gray-1">
                    <Image
                      src={product.imageCover || "/images/products/product-1-bg-1.png"}
                      alt={product.title}
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 50vw, 200px"
                      className="object-contain p-2 duration-300 group-hover:scale-105"
                    />
                  </span>
                  <span className="block truncate text-custom-sm font-medium text-dark group-hover:text-blue">
                    {product.title}
                  </span>
                  <span className="mt-1 block text-custom-sm text-dark-4">
                    {price !== null ? formatPrice(price) : "Price unavailable"}
                  </span>
                </button>
              );
            })}
      </div>
    </section>
  );
};

export default QuickViewRelated;
