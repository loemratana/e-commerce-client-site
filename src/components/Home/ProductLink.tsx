"use client";
import React from "react";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { updateproductDetails } from "@/redux/features/product-details";
import { Product } from "@/types/product";

type ProductLinkProps = {
  product: Product | undefined;
  className?: string;
  children: React.ReactNode;
};

// The details page shows the product in the store, so set it before navigating
// (same as the product cards). Without a product, link to the shop.
const ProductLink = ({ product, className, children }: ProductLinkProps) => {
  const dispatch = useDispatch<AppDispatch>();

  if (!product) {
    return (
      <Link href="/shop-with-sidebar" className={className}>
        {children}
      </Link>
    );
  }

  return (
    <Link
      href={`/shop-details?id=${product.id}`}
      className={className}
      onClick={() => dispatch(updateproductDetails({ ...product }))}
    >
      {children}
    </Link>
  );
};

export default ProductLink;
