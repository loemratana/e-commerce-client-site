"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@/redux/store";
import {
  removeCartItem,
  updateCartItem,
  CartItem,
} from "@/redux/features/cart-slice";
import { runCartAction } from "@/lib/cart-actions";
import { formatPrice } from "@/lib/order-utils";

interface SingleItemProps {
  item: CartItem;
}

const SingleItem = ({ item }: SingleItemProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const isGlobalMutating = useAppSelector(
    (state) => state.cartReducer.isMutating
  );
  const [isUpdating, setIsUpdating] = useState(false);

  const disabled = isGlobalMutating || isUpdating;

  const unitPrice = item.discountedPrice ?? item.price ?? 0;
  const lineTotal = unitPrice * (item.quantity ?? 1);

  const handleDecrease = async () => {
    if (disabled) return;
    if (item.quantity <= 1) {
      handleRemove();
      return;
    }
    setIsUpdating(true);
    try {
      await runCartAction(() =>
        dispatch(
          updateCartItem({ id: item.id, quantity: item.quantity - 1 })
        ).unwrap()
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleIncrease = async () => {
    if (disabled) return;
    setIsUpdating(true);
    try {
      await runCartAction(() =>
        dispatch(
          updateCartItem({ id: item.id, quantity: item.quantity + 1 })
        ).unwrap()
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    if (disabled) return;
    setIsUpdating(true);
    try {
      await runCartAction(() => dispatch(removeCartItem(item.id)).unwrap());
    } finally {
      setIsUpdating(false);
    }
  };

  const thumbnailSrc =
    item.imgs?.thumbnails?.[0] ??
    item.imgs?.previews?.[0] ??
    "/images/products/product-1-bg-1.png";

  return (
    <div className="flex items-start gap-4">
      {/* Product Image Thumbnail */}
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-3 bg-gray-1 p-1">
        <Image
          src={thumbnailSrc}
          alt={item.title || "Product image"}
          fill
          sizes="80px"
          className="object-contain"
        />
      </div>

      {/* Product Info & Controls */}
      <div className="flex flex-1 flex-col justify-between self-stretch min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4
            className="text-sm font-medium text-dark line-clamp-2 leading-snug hover:text-blue transition-colors"
            title={item.title}
          >
            {item.title}
            {item.variantLabel && (
              <span className="block text-xs font-normal text-dark-4">
                {item.variantLabel}
              </span>
            )}
            {item.available === false && (
              <span className="block text-xs font-medium text-red">
                No longer available
              </span>
            )}
          </h4>

          {/* Remove button */}
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            aria-label={`Remove ${item.title} from cart`}
            className="shrink-0 p-1 rounded-md text-dark-5 hover:text-red hover:bg-red-light-6 transition-colors disabled:opacity-50"
          >
            {isUpdating ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-red border-r-transparent" />
            ) : (
              <svg
                className="w-4 h-4 fill-current"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M8.75 3C8.75 2.58579 9.08579 2.25 9.5 2.25H10.5C10.9142 2.25 11.25 2.58579 11.25 3V3.75H14.5C14.9142 3.75 15.25 4.08579 15.25 4.5C15.25 4.91421 14.9142 5.25 14.5 5.25H5.5C5.08579 5.25 4.75 4.91421 4.75 4.5C4.75 4.08579 5.08579 3.75 5.5 3.75H8.75V3ZM6.5 6.75C6.91421 6.75 7.25 7.08579 7.25 7.5V14.5C7.25 14.9142 6.91421 15.25 6.5 15.25C6.08579 15.25 5.75 14.9142 5.75 14.5V7.5C5.75 7.08579 6.08579 6.75 6.5 6.75ZM10 6.75C10.4142 6.75 10.75 7.08579 10.75 7.5V14.5C10.75 14.9142 10.4142 15.25 10 15.25C9.58579 15.25 9.25 14.9142 9.25 14.5V7.5C9.25 7.08579 9.58579 6.75 10 6.75ZM13.5 6.75C13.9142 6.75 14.25 7.08579 14.25 7.5V14.5C14.25 14.9142 13.9142 15.25 13.5 15.25C13.0858 15.25 12.75 14.9142 12.75 14.5V7.5C12.75 7.08579 13.0858 6.75 13.5 6.75Z"
                  fill="currentColor"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Price and Quantity Controller */}
        <div className="flex items-center justify-between gap-2 mt-2">
          {/* Quantity Stepper */}
          <div className="inline-flex items-center rounded-lg border border-gray-3 bg-white">
            <button
              type="button"
              onClick={handleDecrease}
              disabled={disabled}
              aria-label="Decrease quantity"
              className="flex h-7 w-7 items-center justify-center text-dark-4 hover:bg-gray-2 hover:text-dark rounded-l-lg transition-colors disabled:opacity-40"
            >
              <span className="text-base font-semibold leading-none">−</span>
            </button>

            <span className="w-8 text-center text-xs font-semibold text-dark select-none">
              {item.quantity}
            </span>

            <button
              type="button"
              onClick={handleIncrease}
              disabled={disabled}
              aria-label="Increase quantity"
              className="flex h-7 w-7 items-center justify-center text-dark-4 hover:bg-gray-2 hover:text-dark rounded-r-lg transition-colors disabled:opacity-40"
            >
              <span className="text-base font-semibold leading-none">+</span>
            </button>
          </div>

          {/* Price */}
          <div className="text-right">
            <span className="block text-sm font-semibold text-dark">
              {formatPrice(lineTotal)}
            </span>
            {item.quantity > 1 && (
              <span className="block text-2xs text-dark-4">
                {formatPrice(unitPrice)} each
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleItem;
