import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { cartApi } from "@/lib/api/cart.api";
import { ApiError } from "@/lib/api/client";
import { requestAuthentication } from "@/lib/auth-prompt";
import { clearAuthTokens } from "@/lib/auth-session";
import { CartResponse } from "@/types/cart-api";
import { RootState } from "../store";
import { variantLabel } from "@/lib/variants";

export type CartItem = {
  id: number;
  productVariantId: number;
  title: string;
  price: number;
  discountedPrice: number;
  quantity: number;
  /** e.g. "Red / M" */
  variantLabel?: string;
  /** false = no longer sold; must be removed before checkout */
  available?: boolean;
  imgs?: {
    thumbnails: string[];
    previews: string[];
  };
};

type CartPreview = Pick<
  CartItem,
  "title" | "price" | "discountedPrice" | "imgs"
>;

type AddCartItemArgs = {
  productVariantId?: number;
  quantity: number;
  preview: CartPreview;
};

type CartState = {
  items: CartItem[];
  totalPrice: number;
  status: "idle" | "loading" | "succeeded" | "failed";
  isMutating: boolean;
  pendingMutations: number;
  error: string | null;
};

const initialState: CartState = {
  items: [],
  totalPrice: 0,
  status: "idle",
  isMutating: false,
  pendingMutations: 0,
  error: null,
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof ApiError && error.status === 401) {
    if (typeof window !== "undefined") clearAuthTokens();
    requestAuthentication();
    return "Authentication required. Please sign in to continue.";
  }
  return error instanceof Error ? error.message : "Unable to update your cart.";
};

type CartSnapshot = {
  items: CartItem[];
  totalPrice: number;
};

const toCartSnapshot = (response?: CartResponse): CartSnapshot => ({
  items: (response?.items ?? []).map((item) => ({
    id: item.id,
    productVariantId: item.productVariantId,
    title: item.productName,
    price: item.price,
    discountedPrice: item.price,
    quantity: item.quantity,
    variantLabel: variantLabel(item.color, item.sizeName),
    available: item.available !== false,
    // the API picks the image of the item's color, so it beats any client-side preview
    imgs: item.imageUrl
      ? { thumbnails: [item.imageUrl], previews: [item.imageUrl] }
      : undefined,
  })),
  totalPrice: response?.totalPriceAfterDiscount ?? 0,
});

const mergeCartItems = (
  currentItems: CartItem[],
  incomingItems: CartItem[],
  preview?: CartPreview,
  previewVariantId?: number
) =>
  incomingItems.map((item) => {
    const existingItem =
      currentItems.find((current) => current.id === item.id) ??
      currentItems.find(
        (current) => current.productVariantId === item.productVariantId
      );
    const itemPreview =
      item.productVariantId === previewVariantId ? preview : undefined;
    return {
      ...existingItem,
      ...item,
      ...itemPreview,
      imgs: item.imgs ?? itemPreview?.imgs ?? existingItem?.imgs,
    };
  });

export const fetchCart = createAsyncThunk<
  CartSnapshot,
  void,
  { rejectValue: string }
>("cart/fetch", async (_, { rejectWithValue }) => {
  try {
    return toCartSnapshot(await cartApi.getCurrent());
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const addCartItem = createAsyncThunk<
  CartSnapshot & { preview: CartPreview },
  AddCartItemArgs,
  { rejectValue: string }
>("cart/addItem", async ({ productVariantId, quantity, preview }, { rejectWithValue }) => {
  if (productVariantId === undefined) {
    return rejectWithValue("This product has no selectable variant to add to the cart.");
  }

  try {
    const response = await cartApi.addItem({ productVariantId, quantity });
    return { ...toCartSnapshot(response), preview };
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const updateCartItem = createAsyncThunk<
  CartSnapshot,
  { id: number; quantity: number },
  { rejectValue: string }
>("cart/updateItem", async ({ id, quantity }, { rejectWithValue }) => {
  try {
    return toCartSnapshot(await cartApi.updateItem(id, { quantity }));
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const removeCartItem = createAsyncThunk<
  CartSnapshot,
  number,
  { rejectValue: string }
>("cart/removeItem", async (id, { rejectWithValue }) => {
  try {
    return toCartSnapshot(await cartApi.removeItem(id));
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const clearCart = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>("cart/clear", async (_, { rejectWithValue }) => {
  try {
    await cartApi.clear();
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

const cart = createSlice({
  name: "cart",
  initialState,
  reducers: {
    resetCart: (state) => {
      state.items = [];
      state.totalPrice = 0;
      state.status = "idle";
      state.isMutating = false;
      state.pendingMutations = 0;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = mergeCartItems(state.items, action.payload.items);
        state.totalPrice = action.payload.totalPrice;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? action.error.message ?? "Unable to load your cart.";
      })
      .addCase(addCartItem.pending, (state) => {
        state.pendingMutations += 1;
        state.isMutating = true;
        state.error = null;
      })
      .addCase(addCartItem.fulfilled, (state, action) => {
        state.pendingMutations = Math.max(0, state.pendingMutations - 1);
        state.isMutating = state.pendingMutations > 0;
        state.status = "succeeded";
        state.items = mergeCartItems(
          state.items,
          action.payload.items,
          action.payload.preview,
          action.meta.arg.productVariantId
        );
        state.totalPrice = action.payload.totalPrice;
      })
      .addCase(addCartItem.rejected, (state, action) => {
        state.pendingMutations = Math.max(0, state.pendingMutations - 1);
        state.isMutating = state.pendingMutations > 0;
        state.error = action.payload ?? action.error.message ?? "Unable to add this item.";
      })
      .addCase(updateCartItem.pending, (state) => {
        state.pendingMutations += 1;
        state.isMutating = true;
        state.error = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.pendingMutations = Math.max(0, state.pendingMutations - 1);
        state.isMutating = state.pendingMutations > 0;
        state.status = "succeeded";
        state.error = null;
        state.items = mergeCartItems(state.items, action.payload.items);
        state.totalPrice = action.payload.totalPrice;
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.pendingMutations = Math.max(0, state.pendingMutations - 1);
        state.isMutating = state.pendingMutations > 0;
        state.error = action.payload ?? action.error.message ?? "Unable to update this item.";
      })
      .addCase(removeCartItem.pending, (state) => {
        state.pendingMutations += 1;
        state.isMutating = true;
        state.error = null;
      })
      .addCase(removeCartItem.fulfilled, (state, action) => {
        state.pendingMutations = Math.max(0, state.pendingMutations - 1);
        state.isMutating = state.pendingMutations > 0;
        state.status = "succeeded";
        state.error = null;
        state.items = mergeCartItems(state.items, action.payload.items);
        state.totalPrice = action.payload.totalPrice;
      })
      .addCase(removeCartItem.rejected, (state, action) => {
        state.pendingMutations = Math.max(0, state.pendingMutations - 1);
        state.isMutating = state.pendingMutations > 0;
        state.error = action.payload ?? action.error.message ?? "Unable to remove this item.";
      })
      .addCase(clearCart.pending, (state) => {
        state.pendingMutations += 1;
        state.isMutating = true;
        state.error = null;
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.pendingMutations = Math.max(0, state.pendingMutations - 1);
        state.isMutating = state.pendingMutations > 0;
        state.status = "succeeded";
        state.error = null;
        state.items = [];
        state.totalPrice = 0;
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.pendingMutations = Math.max(0, state.pendingMutations - 1);
        state.isMutating = state.pendingMutations > 0;
        state.error = action.payload ?? action.error.message ?? "Unable to clear your cart.";
      });
  },
});

export const selectCartItems = (state: RootState) => state.cartReducer.items;

export const selectHasUnavailableItems = (state: RootState) =>
  state.cartReducer.items.some((item) => item.available === false);

export const selectTotalPrice = (state: RootState) =>
  state.cartReducer.totalPrice;

export const { resetCart } = cart.actions;

export default cart.reducer;
