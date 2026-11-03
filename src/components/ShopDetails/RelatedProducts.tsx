"use client";
import ProductCard from "../Shop/ProductCard";
import { useRelatedProducts } from "@/hooks/useRelatedProducts";

interface RelatedProductsProps {
  productId: number;
}

const RelatedProducts = ({ productId }: RelatedProductsProps) => {
  const { products, isLoading } = useRelatedProducts(productId, 8);

  // Nothing related: hide the section instead of showing an empty grid.
  if (!isLoading && products.length === 0) return null;

  return (
    <section className="overflow-hidden py-20">
      <div className="site-container">
        <h2 className="font-semibold text-xl xl:text-heading-5 text-dark mb-7.5">
          Related Products
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-7.5 gap-y-9">
          {isLoading
            ? Array.from({ length: 4 }, (_, index) => (
                <div
                  key={index}
                  className="h-[400px] animate-pulse rounded-lg bg-gray-2"
                />
              ))
            : products.map((product) => (
                <ProductCard key={product.id} product={product} layout="grid" />
              ))}
        </div>
      </div>
    </section>
  );
};

export default RelatedProducts;
