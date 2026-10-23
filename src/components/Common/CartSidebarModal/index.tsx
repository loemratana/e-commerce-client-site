"use client";

import React, { useEffect, useMemo } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { useCartModalContext } from "@/app/context/CartSidebarModalContext";
import { selectTotalPrice, fetchCart } from "@/redux/features/cart-slice";
import { AppDispatch, useAppSelector } from "@/redux/store";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import SingleItem from "./SingleItem";
import EmptyCart from "./EmptyCart";
import {
  AUTHENTICATED_EVENT,
  hasAccessToken,
} from "@/lib/auth-prompt";
import { formatPrice } from "@/lib/order-utils";

const CartSidebarModal = () => {
  const { isCartModalOpen, closeCartModal } = useCartModalContext();
  const cartItems = useAppSelector((state) => state.cartReducer.items);
  const cartStatus = useAppSelector((state) => state.cartReducer.status);
  const cartError = useAppSelector((state) => state.cartReducer.error);
  const dispatch = useDispatch<AppDispatch>();
  const totalPrice = useSelector(selectTotalPrice);

  const totalQuantity = useMemo(
    () => cartItems.reduce((acc, item) => acc + (item.quantity ?? 1), 0),
    [cartItems]
  );

  useEffect(() => {
    const reloadCart = () => {
      void dispatch(fetchCart());
    };
    window.addEventListener(AUTHENTICATED_EVENT, reloadCart);

    if (cartStatus === "idle" && hasAccessToken()) {
      reloadCart();
    }

    return () => window.removeEventListener(AUTHENTICATED_EVENT, reloadCart);
  }, [cartStatus, dispatch]);

  return (
    <Drawer
      open={isCartModalOpen}
      onOpenChange={(open) => {
        if (!open) closeCartModal();
      }}
      swipeDirection="right"
    >
      <DrawerContent className="w-full sm:max-w-[480px] bg-white flex flex-col h-full shadow-2xl">
        <DrawerHeader className="relative flex flex-row items-center justify-between border-b border-gray-3 p-5 sm:p-6 bg-white">
          <div>
            <div className="flex items-center gap-2.5">
              <DrawerTitle className="text-xl sm:text-2xl font-semibold text-dark">
                Cart View
              </DrawerTitle>
              <span className="inline-flex items-center justify-center rounded-full bg-blue/10 px-2.5 py-0.5 text-xs font-semibold text-blue">
                {totalQuantity} {totalQuantity === 1 ? "item" : "items"}
              </span>
            </div>
            <DrawerDescription className="text-xs sm:text-sm text-dark-4 mt-1">
              Review your items and proceed to checkout
            </DrawerDescription>
          </div>

          <DrawerClose
            render={
              <button
                type="button"
                aria-label="Close cart drawer"
                className="flex h-9 w-9 items-center justify-center rounded-full text-dark-5 transition-colors hover:bg-gray-2 hover:text-dark focus:outline-none"
              />
            }
          >
            <svg
              className="w-5 h-5 fill-current"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5.29289 5.29289C5.68342 4.90237 6.31658 4.90237 6.70711 5.29289L10 8.58579L13.2929 5.29289C13.6834 4.90237 14.3166 4.90237 14.7071 5.29289C15.0976 5.68342 15.0976 6.31658 14.7071 6.70711L11.4142 10L14.7071 13.2929C15.0976 13.6834 15.0976 14.3166 14.7071 14.7071C14.3166 15.0976 13.6834 15.0976 13.2929 14.7071L10 11.4142L6.70711 14.7071C6.31658 15.0976 5.68342 15.0976 5.29289 14.7071C4.90237 14.3166 4.90237 13.6834 5.29289 13.2929L8.58579 10L5.29289 6.70711C4.90237 6.31658 4.90237 5.68342 5.29289 5.29289Z"
                fill="currentColor"
              />
            </svg>
          </DrawerClose>
        </DrawerHeader>

        {/* Scrollable Items Container */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 no-scrollbar">
          {cartItems.length > 0 ? (
            <div className="flex flex-col divide-y divide-gray-3">
              {cartItems.map((item) => (
                <div key={item.id} className="py-4 first:pt-0 last:pb-0">
                  <SingleItem item={item} />
                </div>
              ))}
            </div>
          ) : cartStatus === "loading" ? (
            <div className="py-16 text-center text-dark-4 space-y-3">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-blue border-r-transparent align-[-0.125em]" />
              <p className="text-sm font-medium">Loading your cart...</p>
            </div>
          ) : (
            <EmptyCart />
          )}

          {cartError && (
            <div
              role="alert"
              className="mt-4 p-3 rounded-lg bg-red-light-6 border border-red-light-4 text-center text-xs text-red"
            >
              {cartError}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {cartItems.length > 0 && (
          <DrawerFooter className="border-t border-gray-3 bg-white p-5 sm:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-base text-dark-4">Subtotal</span>
              <span className="text-xl font-bold text-dark">
                {formatPrice(totalPrice)}
              </span>
            </div>
            <p className="text-xs text-dark-5">
              Taxes and shipping calculated at checkout.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <Link
                onClick={() => closeCartModal()}
                href="/cart"
                className="flex items-center justify-center font-medium text-dark bg-gray-2 border border-gray-3 py-3 px-4 rounded-lg ease-out duration-200 hover:bg-gray-3 hover:text-dark text-sm sm:text-base text-center"
              >
                View Cart
              </Link>

              <Link
                onClick={() => closeCartModal()}
                href="/checkout"
                className="flex items-center justify-center font-medium text-white bg-blue py-3 px-4 rounded-lg ease-out duration-200 hover:bg-blue-dark text-sm sm:text-base text-center shadow-sm"
              >
                Checkout
              </Link>
            </div>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default CartSidebarModal;
