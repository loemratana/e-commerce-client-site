"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import Breadcrumb from "../Common/Breadcrumb";
import { AppDispatch, useAppSelector } from "@/redux/store";
import {
  clearWishlist,
  fetchWishlistPage,
  selectWishlistCount,
  selectWishlistPage,
} from "@/redux/features/wishlist-slice";
import {
  AUTH_STATE_CHANGED_EVENT,
  hasAccessToken,
  requestAuthentication,
} from "@/lib/auth-prompt";
import Pagination from "../Reviews/Pagination";
import SingleItem from "./SingleItem";

export const Wishlist = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items: wishlistItems, currentPage, totalPages } = useAppSelector(selectWishlistPage);
  const totalCount = useAppSelector(selectWishlistCount);
  const status = useAppSelector((state) => state.wishlistReducer.pageStatus);
  const error = useAppSelector((state) => state.wishlistReducer.error);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // localStorage only exists in the browser, so read the session after mount.
  useEffect(() => {
    const syncAuth = () => setIsAuthenticated(hasAccessToken());
    syncAuth();
    window.addEventListener(AUTH_STATE_CHANGED_EVENT, syncAuth);
    return () => window.removeEventListener(AUTH_STATE_CHANGED_EVENT, syncAuth);
  }, []);

  // First visit, or the page went stale (an item was removed, moved or added): (re)load it.
  useEffect(() => {
    if (isAuthenticated && status === "idle") {
      void dispatch(fetchWishlistPage(currentPage));
    }
  }, [isAuthenticated, status, currentPage, dispatch]);

  const handlePageChange = (page: number) => {
    void dispatch(fetchWishlistPage(page));
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleClear = async () => {
    if (!window.confirm("Remove every product from your wishlist?")) return;
    setIsClearing(true);
    try {
      await dispatch(clearWishlist()).unwrap();
      toast.success("Wishlist cleared.");
    } catch (clearError) {
      toast.error(
        typeof clearError === "string" ? clearError : "Unable to clear your wishlist."
      );
    } finally {
      setIsClearing(false);
    }
  };

  const renderBody = () => {
    if (!isAuthenticated) {
      return (
        <div className="py-15 px-10 text-center">
          <p className="text-dark mb-5">Sign in to see the products you saved.</p>
          <button
            onClick={requestAuthentication}
            className="inline-flex font-medium text-white bg-blue py-3 px-7 rounded-md ease-out duration-200 hover:bg-blue-dark"
          >
            Sign in
          </button>
        </div>
      );
    }

    if (status === "idle" || (status === "loading" && wishlistItems.length === 0)) {
      return <p className="py-15 px-10 text-center text-dark-4">Loading your wishlist…</p>;
    }

    if (status === "failed" && wishlistItems.length === 0) {
      return (
        <div className="py-15 px-10 text-center">
          <p className="text-red mb-5">{error ?? "Unable to load your wishlist."}</p>
          <button
            onClick={() => void dispatch(fetchWishlistPage(currentPage))}
            className="inline-flex font-medium text-white bg-blue py-3 px-7 rounded-md ease-out duration-200 hover:bg-blue-dark"
          >
            Try again
          </button>
        </div>
      );
    }

    if (wishlistItems.length === 0) {
      return (
        <div className="py-15 px-10 text-center">
          <p className="text-dark mb-5">Your wishlist is empty.</p>
          <Link
            href="/shop-with-sidebar"
            className="inline-flex font-medium text-white bg-blue py-3 px-7 rounded-md ease-out duration-200 hover:bg-blue-dark"
          >
            Continue Shopping
          </Link>
        </div>
      );
    }

    return (
      <div className="w-full overflow-x-auto">
        <div className="min-w-[1170px]">
          {/* <!-- table header --> */}
          <div className="flex items-center py-5.5 px-10">
            <div className="min-w-[83px]"></div>
            <div className="min-w-[387px]">
              <p className="text-dark">Product</p>
            </div>

            <div className="min-w-[205px]">
              <p className="text-dark">Unit Price</p>
            </div>

            <div className="min-w-[265px]">
              <p className="text-dark">Stock Status</p>
            </div>

            <div className="min-w-[150px]">
              <p className="text-dark text-right">Action</p>
            </div>
          </div>

          {/* <!-- wish item --> */}
          {wishlistItems.map((item) => (
            <SingleItem item={item} key={item.productId} />
          ))}
        </div>
      </div>
    );
  };

  const isPageLoading = status === "loading";

  const renderFooter = () => {
    if (!isAuthenticated || wishlistItems.length === 0 || totalPages <= 1) return null;
    return (
      <div className="border-t border-gray-3 py-5 px-10">
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          label="Wishlist pages"
          disabled={isPageLoading}
        />
      </div>
    );
  };

  return (
    <>
      <Breadcrumb title={"Wishlist"} pages={["Wishlist"]} />
      <section className="overflow-hidden py-20 bg-gray-2">
        <div className="site-container">
          <div className="flex flex-wrap items-center justify-between gap-5 mb-7.5">
            <h2 className="font-medium text-dark text-2xl">
              Your Wishlist
              {isAuthenticated && totalCount > 0 && (
                <span className="ml-2 text-base text-dark-4">({totalCount})</span>
              )}
            </h2>
            {isAuthenticated && wishlistItems.length > 0 && (
              <button
                onClick={() => void handleClear()}
                disabled={isClearing}
                className="text-blue disabled:opacity-50"
              >
                {isClearing ? "Clearing…" : "Clear Wishlist"}
              </button>
            )}
          </div>

          <div
            ref={listRef}
            aria-busy={isPageLoading}
            className={`bg-white rounded-[10px] shadow-1 scroll-mt-30 transition-opacity ${
              isPageLoading && wishlistItems.length > 0 ? "opacity-60" : ""
            }`}
          >
            {renderBody()}
            {renderFooter()}
          </div>
        </div>
      </section>
    </>
  );
};
