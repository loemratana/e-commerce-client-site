"use client";

import React from "react";
import Link from "next/link";
import { useCartModalContext } from "@/app/context/CartSidebarModalContext";

const EmptyCart = () => {
  const { closeCartModal } = useCartModalContext();

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-gray-1 border border-gray-3 text-dark-4">
        <svg
          className="h-12 w-12 text-dark-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="8" cy="21" r="1" />
          <circle cx="19" cy="21" r="1" />
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
        </svg>
      </div>

      <h3 className="text-lg font-semibold text-dark mb-1">Your cart is empty</h3>
      <p className="text-sm text-dark-4 max-w-[280px] mb-6">
        Looks like you haven&apos;t added anything to your cart yet. Discover trending products and start shopping!
      </p>

      <Link
        onClick={() => closeCartModal()}
        href="/shop-with-sidebar"
        className="inline-flex items-center justify-center font-medium text-white bg-blue py-3 px-6 rounded-lg ease-out duration-200 hover:bg-blue-dark shadow-sm text-sm"
      >
        Start Shopping
      </Link>
    </div>
  );
};

export default EmptyCart;
