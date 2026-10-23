import React from "react";
import { AppDispatch, useAppSelector } from "@/redux/store";
import { useDispatch } from "react-redux";

import {
  selectIsWishlistPending,
  WishlistItem,
} from "@/redux/features/wishlist-slice";
import { updateQuickView } from "@/redux/features/quickView-slice";
import { useModalContext } from "@/app/context/QuickViewModalContext";
import { toggleWishlist } from "@/lib/wishlist-actions";

import Image from "next/image";
import { formatMoney } from "@/lib/currency";

const SingleItem = ({ item }: { item: WishlistItem }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { openModal } = useModalContext();
  const pending = useAppSelector(selectIsWishlistPending(item.productId));

  const handleRemoveFromWishlist = () => {
    void toggleWishlist(dispatch, item.productId, true);
  };

  // The customer still has to pick a color/size: quick view loads the product's variants and,
  // because of fromWishlist, its button moves the product to the cart instead of copying it.
  const handleOpenQuickView = () => {
    dispatch(
      updateQuickView({
        id: item.productId,
        title: item.title,
        reviews: 0,
        price: item.price ?? 0,
        discountedPrice: item.price ?? 0,
        imgs: item.imageUrl
          ? { thumbnails: [item.imageUrl], previews: [item.imageUrl] }
          : { thumbnails: [], previews: [] },
        fromWishlist: true,
      })
    );
    openModal();
  };

  return (
    <div className="flex items-center border-t border-gray-3 py-5 px-10">
      <div className="min-w-[83px]">
        <button
          onClick={() => handleRemoveFromWishlist()}
          disabled={pending}
          aria-label={`Remove ${item.title} from wishlist`}
          className="flex items-center justify-center rounded-lg max-w-[38px] w-full h-9.5 bg-gray-2 border border-gray-3 ease-out duration-200 hover:bg-red-light-6 hover:border-red-light-4 hover:text-red disabled:opacity-50"
        >
          <svg
            className="fill-current"
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9.19509 8.22222C8.92661 7.95374 8.49131 7.95374 8.22282 8.22222C7.95433 8.49071 7.95433 8.92601 8.22282 9.1945L10.0284 11L8.22284 12.8056C7.95435 13.074 7.95435 13.5093 8.22284 13.7778C8.49133 14.0463 8.92663 14.0463 9.19511 13.7778L11.0006 11.9723L12.8061 13.7778C13.0746 14.0463 13.5099 14.0463 13.7784 13.7778C14.0469 13.5093 14.0469 13.074 13.7784 12.8055L11.9729 11L13.7784 9.19451C14.0469 8.92603 14.0469 8.49073 13.7784 8.22224C13.5099 7.95376 13.0746 7.95376 12.8062 8.22224L11.0006 10.0278L9.19509 8.22222Z"
              fill=""
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M11.0007 1.14587C5.55835 1.14587 1.14648 5.55773 1.14648 11C1.14648 16.4423 5.55835 20.8542 11.0007 20.8542C16.443 20.8542 20.8548 16.4423 20.8548 11C20.8548 5.55773 16.443 1.14587 11.0007 1.14587ZM2.52148 11C2.52148 6.31713 6.31774 2.52087 11.0007 2.52087C15.6836 2.52087 19.4798 6.31713 19.4798 11C19.4798 15.683 15.6836 19.4792 11.0007 19.4792C6.31774 19.4792 2.52148 15.683 2.52148 11Z"
              fill=""
            />
          </svg>
        </button>
      </div>

      <div className="min-w-[387px]">
        <div className="flex items-center justify-between gap-5">
          <div className="w-full flex items-center gap-5.5">
            <div className="relative flex items-center justify-center rounded-[5px] bg-gray-2 max-w-[80px] w-full h-17.5 overflow-hidden">
              <Image
                src={item.imageUrl || "/images/products/product-1-bg-1.png"}
                alt={item.title}
                width={80}
                height={70}
                unoptimized
                className="object-contain"
              />
            </div>

            <div>
              <h3 className="text-dark ease-out duration-200 hover:text-blue">
                <button type="button" onClick={handleOpenQuickView} className="text-left">
                  {item.title}
                </button>
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div className="min-w-[205px]">
        <p className="text-dark">
          {item.price !== undefined ? `From ${formatMoney(item.price)}` : "—"}
        </p>
      </div>

      <div className="min-w-[265px]">
        {item.available ? (
          <span className="text-green">Available</span>
        ) : (
          <span className="text-red">No longer available</span>
        )}
      </div>

      <div className="min-w-[150px] flex justify-end">
        <button
          onClick={() => handleOpenQuickView()}
          disabled={!item.available || pending}
          className="inline-flex text-dark hover:text-white bg-gray-1 border border-gray-3 py-2.5 px-6 rounded-md ease-out duration-200 hover:bg-blue hover:border-gray-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-1 disabled:hover:text-dark"
        >
          Move to Cart
        </button>
      </div>
    </div>
  );
};

export default SingleItem;
