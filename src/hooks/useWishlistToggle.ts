import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@/redux/store";
import {
  selectIsInWishlist,
  selectIsWishlistPending,
} from "@/redux/features/wishlist-slice";
import { toggleWishlist } from "@/lib/wishlist-actions";

/** State + handler for a product's heart button. */
export const useWishlistToggle = (productId: number) => {
  const dispatch = useDispatch<AppDispatch>();
  const saved = useAppSelector(selectIsInWishlist(productId));
  const pending = useAppSelector(selectIsWishlistPending(productId));

  const toggle = () => {
    if (pending || !productId) return;
    void toggleWishlist(dispatch, productId, saved);
  };

  return { saved, pending, toggle };
};
