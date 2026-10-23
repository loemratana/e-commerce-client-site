"use client";

import React, { useEffect, useState } from "react";
import SingleItem from "./SingleItem";
import Image from "next/image";
import Link from "next/link";
import { productsApi } from "@/lib/api/products.api";
import { toCardProduct } from "@/lib/variants";
import { Product } from "@/types/product";

const BestSeller = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    productsApi
      .getBestSellers(30, 12)
      .then((items) => {
        if (isMounted) {
          setProducts(items.map(toCardProduct));
        }
      })
      .catch((error) => {
        console.error("Failed to load best sellers from API:", error);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="overflow-hidden">
      <div className="site-container">
        {/* <!-- section title --> */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <span className="flex items-center gap-2.5 font-medium text-dark mb-1.5">
              <Image
                src="/images/icons/icon-07.svg"
                alt="icon"
                width={17}
                height={17}
              />
              This Month
            </span>
            <h2 className="font-semibold text-xl xl:text-heading-5 text-dark">
              Best Sellers
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7.5">
          {isLoading &&
            Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="min-h-[403px] animate-pulse rounded-lg bg-gray-2"
              />
            ))}
          {!isLoading &&
            products.map((item) => <SingleItem item={item} key={item.id} />)}
        </div>

        {!isLoading && products.length === 0 && (
          <p className="py-12 text-center text-sm text-gray-500">
            No best sellers found at this moment.
          </p>
        )}

        <div className="text-center mt-12.5">
          <Link
            href="/shop-without-sidebar"
            className="inline-flex font-medium text-custom-sm py-3 px-7 sm:px-12.5 rounded-md border-gray-3 border bg-gray-1 text-dark ease-out duration-200 hover:bg-dark hover:text-white hover:border-transparent"
          >
            View All
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BestSeller;
