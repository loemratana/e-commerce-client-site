import toast from "react-hot-toast";
import {
  addToWishlist,
  moveWishlistItemToCart,
  removeFromWishlist,
} from "@/redux/features/wishlist-slice";
import { fetchCart } from "@/redux/features/cart-slice";
import { AppDispatch } from "@/redux/store";
import { hasAccessToken, requestAuthentication } from "@/lib/auth-prompt";

const isAuthenticationError = (error: unknown) =>
  typeof error === "string" && error.startsWith("Authentication required.");

const showError = (error: unknown, fallback: string) => {
  if (!isAuthenticationError(error)) {
    toast.error(
      typeof error === "string"
        ? error
        : error instanceof Error
          ? error.message
          : fallback
    );
  }
};

/** Heart button: saves the product, or removes it when it's already saved. */
export const toggleWishlist = async (
  dispatch: AppDispatch,
  productId: number,
  isSaved: boolean
) => {
  if (!hasAccessToken()) {
    requestAuthentication();
    return false;
  }

  try {
    if (isSaved) {
      await dispatch(removeFromWishlist(productId)).unwrap();
      toast.success("Removed from wishlist.");
    } else {
      await dispatch(addToWishlist(productId)).unwrap();
      toast.success("Added to wishlist.");
    }
    return true;
  } catch (error) {
    showError(error, "Unable to update your wishlist.");
    return false;
  }
};

/** Moves a wishlisted product to the cart once the customer has picked a variant. */
export const moveWishlistProductToCart = async (
  dispatch: AppDispatch,
  productId: number,
  productVariantId: number,
  quantity: number
) => {
  if (!hasAccessToken()) {
    requestAuthentication();
    return false;
  }

  try {
    await dispatch(
      moveWishlistItemToCart({ productId, productVariantId, quantity })
    ).unwrap();
    void dispatch(fetchCart());
    toast.success("Moved to cart.");
    return true;
  } catch (error) {
    showError(error, "Unable to move this item to your cart.");
    return false;
  }
};
