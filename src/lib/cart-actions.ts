import toast from "react-hot-toast";
import { addCartItem } from "@/redux/features/cart-slice";
import { AppDispatch } from "@/redux/store";
import { Product } from "@/types/product";
import { hasAccessToken, requestAuthentication } from "@/lib/auth-prompt";

const isAuthenticationError = (error: unknown) =>
  typeof error === "string" && error.startsWith("Authentication required.");

export const addProductToCart = async (
  dispatch: AppDispatch,
  product: Product,
  quantity: number
) => {
  if (!hasAccessToken()) {
    requestAuthentication();
    return false;
  }

  try {
    await dispatch(
      addCartItem({
        productVariantId: product.productVariantId,
        quantity,
        preview: {
          title: product.title,
          price: product.price,
          discountedPrice: product.discountedPrice,
          imgs: product.imgs,
        },
      })
    ).unwrap();
    toast.success("Added to cart.");
    return true;
  } catch (error) {
    if (!isAuthenticationError(error)) {
      toast.error(
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Unable to add this item to your cart."
      );
    }
    return false;
  }
};

export const runCartAction = async (
  operation: () => Promise<unknown>
) => {
  if (!hasAccessToken()) {
    requestAuthentication();
    return;
  }

  try {
    await operation();
  } catch (error) {
    if (!isAuthenticationError(error)) {
      toast.error(
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Unable to update your cart."
      );
    }
  }
};
