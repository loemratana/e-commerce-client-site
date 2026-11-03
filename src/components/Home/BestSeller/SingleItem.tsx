"use client";
import React from "react";
import { useDispatch } from "react-redux";
import { Heart } from "lucide-react";
import { Product } from "@/types/product";
import { useModalContext } from "@/app/context/QuickViewModalContext";
import { AppDispatch } from "@/redux/store";
import { updateQuickView } from "@/redux/features/quickView-slice";
import { addProductToCart } from "@/lib/cart-actions";
import { useWishlistToggle } from "@/hooks/useWishlistToggle";
import { formatMoney } from "@/lib/currency";
import { isInStock } from "@/lib/variants";
import StarIcon from "@/components/Common/StarIcon";
import BannerImage from "../BannerImage";
import ProductLink from "../ProductLink";

const SingleItem = ({ item }: { item: Product }) => {
  const { openModal } = useModalContext();
  const dispatch = useDispatch<AppDispatch>();
  const wishlist = useWishlistToggle(item.id);

  const variants = item.apiProduct?.variants ?? [];
  const soldOut = variants.length > 0 && !variants.some(isInStock);
  const rating = item.apiProduct?.ratingsAverage ?? 0;
  const discount =
    item.discountPercent !== undefined && item.discountPercent > 0
      ? item.discountPercent
      : item.price > item.discountedPrice
      ? Math.round((1 - item.discountedPrice / item.price) * 100)
      : 0;

  // Products with several options open quick view so the customer can pick one
  const handleAddToCart = () => {
    if (variants.length > 1 || !item.productVariantId) {
      dispatch(updateQuickView({ ...item }));
      openModal();
      return;
    }
    void addProductToCart(dispatch, item, 1);
  };

  return (
    <div className="group overflow-hidden rounded-lg border border-gray-3 bg-white transition-shadow duration-200 hover:shadow-1">
      <div className="relative aspect-square overflow-hidden bg-gray-1">
        <ProductLink product={item} className="absolute inset-0 p-6">
          <span className="relative block h-full w-full">
            <BannerImage product={item} sizes="(max-width: 640px) 100vw, 360px" />
          </span>
        </ProductLink>

        {discount > 0 && (
          <span className="absolute left-3 top-3 z-10 rounded bg-red px-2 py-0.5 text-xs font-medium text-white shadow-sm">
            -{discount}%
          </span>
        )}

        <button
          type="button"
          onClick={wishlist.toggle}
          disabled={wishlist.pending}
          aria-pressed={wishlist.saved}
          aria-label={wishlist.saved ? "Remove from wishlist" : "Add to wishlist"}
          className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-1 transition-colors hover:text-red disabled:opacity-60 ${
            wishlist.saved ? "text-red" : "text-dark-4"
          }`}
        >
          <Heart size={16} fill={wishlist.saved ? "currentColor" : "none"} />
        </button>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={soldOut}
          className="absolute inset-x-0 bottom-0 bg-dark py-2.5 text-custom-sm font-medium text-white transition-transform duration-200 hover:bg-blue disabled:bg-gray-5 lg:translate-y-full lg:group-hover:translate-y-0 lg:focus-visible:translate-y-0"
        >
          {soldOut ? "Sold out" : "Add to cart"}
        </button>
      </div>

      <div className="p-4">
        <h3 className="mb-1.5 truncate font-medium text-dark transition-colors hover:text-blue">
          <ProductLink product={item}>{item.title}</ProductLink>
        </h3>

        <div className="mb-2 flex items-center gap-1.5 text-custom-xs text-dark-4">
          <span className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon key={star} filled={star <= Math.round(rating)} size={12} />
            ))}
          </span>
          <span>({item.reviews})</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-dark">
            {formatMoney(item.discountedPrice)}
          </span>
          {discount > 0 && (
            <span className="text-custom-sm text-dark-4 line-through">
              {formatMoney(item.price)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SingleItem;
