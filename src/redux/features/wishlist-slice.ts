import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { wishlistApi } from "@/lib/api/wishlist.api";
import { ApiError } from "@/lib/api/client";
import { requestAuthentication } from "@/lib/auth-prompt";
import { clearAuthTokens } from "@/lib/auth-session";
import { WishlistItemResponse } from "@/types/wishlist-api";
import { RootState } from "../store";

export type WishlistItem = {
  id: number;
  productId: number;
  title: string;
  slug: string;
  imageUrl?: string;
  /** Lowest current price; undefined when the product has no active option. */
  price?: number;
  /** false = no longer sold; can't be moved to the cart */
  available: boolean;
  addedAt: string;
};

type LoadStatus = "idle" | "loading" | "succeeded" | "failed";

type WishlistPage = {
  items: WishlistItem[];
  currentPage: number;
  totalPages: number;
};

/**
 * Two views of the same wishlist:
 * - productIds: every saved product, for heart buttons and the header badge (loaded at sign-in).
 * - page: the rows the wishlist page is showing.
 */
type WishlistState = {
  productIds: number[];
  idsStatus: LoadStatus;
  page: WishlistPage;
  /** "idle" also means stale: the wishlist page (re)fetches its current page when it sees it. */
  pageStatus: LoadStatus;
  /** Products with an add/remove/move in flight, to disable their buttons. */
  pendingProductIds: number[];
  error: string | null;
};

const emptyPage: WishlistPage = { items: [], currentPage: 0, totalPages: 0 };

const initialState: WishlistState = {
  productIds: [],
  idsStatus: "idle",
  page: emptyPage,
  pageStatus: "idle",
  pendingProductIds: [],
  error: null,
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof ApiError && error.status === 401) {
    if (typeof window !== "undefined") clearAuthTokens();
    requestAuthentication();
    return "Authentication required. Please sign in to continue.";
  }
  return error instanceof Error ? error.message : "Unable to update your wishlist.";
};

const toWishlistItem = (item: WishlistItemResponse): WishlistItem => ({
  id: item.id,
  productId: item.productId,
  title: item.productName,
  slug: item.slug,
  imageUrl: item.imageUrl ?? undefined,
  price: item.priceFrom ?? undefined,
  available: item.available !== false,
  addedAt: item.addedAt,
});

export const fetchWishlistIds = createAsyncThunk<
  number[],
  void,
  { rejectValue: string }
>("wishlist/fetchIds", async (_, { rejectWithValue }) => {
  try {
    return await wishlistApi.getProductIds();
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const fetchWishlistPage = createAsyncThunk<
  WishlistPage,
  number,
  { rejectValue: string }
>("wishlist/fetchPage", async (requestedPage, { rejectWithValue }) => {
  try {
    let page = await wishlistApi.getMine(requestedPage);
    // The page emptied out (last item on it removed): show the new last page instead.
    if (page.content.length === 0 && requestedPage > 0 && page.totalPages > 0) {
      page = await wishlistApi.getMine(page.totalPages - 1);
    }
    return {
      items: page.content.map(toWishlistItem),
      currentPage: page.currentPage,
      totalPages: page.totalPages,
    };
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const addToWishlist = createAsyncThunk<
  WishlistItem,
  number,
  { rejectValue: string }
>("wishlist/add", async (productId, { rejectWithValue }) => {
  try {
    return toWishlistItem(await wishlistApi.add(productId));
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const removeFromWishlist = createAsyncThunk<
  void,
  number,
  { rejectValue: string }
>("wishlist/remove", async (productId, { rejectWithValue }) => {
  try {
    await wishlistApi.remove(productId);
  } catch (error) {
    // Already gone on the server (e.g. removed in another tab): treat as removed.
    if (error instanceof ApiError && error.status === 404) return;
    return rejectWithValue(getErrorMessage(error));
  }
});

export const clearWishlist = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>("wishlist/clear", async (_, { rejectWithValue }) => {
  try {
    await wishlistApi.clear();
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

/** The caller refreshes the cart afterwards (fetchCart). */
export const moveWishlistItemToCart = createAsyncThunk<
  void,
  { productId: number; productVariantId: number; quantity: number },
  { rejectValue: string }
>(
  "wishlist/moveToCart",
  async ({ productId, productVariantId, quantity }, { rejectWithValue }) => {
    try {
      await wishlistApi.moveToCart(productId, { productVariantId, quantity });
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const clearPending = (state: WishlistState, productId: number) => {
  state.pendingProductIds = state.pendingProductIds.filter((id) => id !== productId);
};

/** Drops the row right away, then marks the page stale so the next item slides up into it. */
const removeLocally = (state: WishlistState, productId: number) => {
  state.productIds = state.productIds.filter((id) => id !== productId);
  const before = state.page.items.length;
  state.page.items = state.page.items.filter((item) => item.productId !== productId);
  if (state.page.items.length < before) state.pageStatus = "idle";
};

const wishlist = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    resetWishlist: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlistIds.pending, (state) => {
        state.idsStatus = "loading";
      })
      .addCase(fetchWishlistIds.fulfilled, (state, action) => {
        state.idsStatus = "succeeded";
        state.productIds = action.payload;
      })
      .addCase(fetchWishlistIds.rejected, (state) => {
        state.idsStatus = "failed";
      })
      .addCase(fetchWishlistPage.pending, (state) => {
        state.pageStatus = "loading";
        state.error = null;
      })
      .addCase(fetchWishlistPage.fulfilled, (state, action) => {
        state.pageStatus = "succeeded";
        state.page = action.payload;
      })
      .addCase(fetchWishlistPage.rejected, (state, action) => {
        state.pageStatus = "failed";
        state.error = action.payload ?? action.error.message ?? "Unable to load your wishlist.";
      })
      .addCase(addToWishlist.pending, (state, action) => {
        state.pendingProductIds.push(action.meta.arg);
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        clearPending(state, action.meta.arg);
        if (!state.productIds.includes(action.payload.productId)) {
          state.productIds.unshift(action.payload.productId);
          // Newest first: it belongs on page 1, and every later page shifts by one.
          if (state.pageStatus === "succeeded") state.pageStatus = "idle";
        }
      })
      .addCase(addToWishlist.rejected, (state, action) => {
        clearPending(state, action.meta.arg);
      })
      .addCase(removeFromWishlist.pending, (state, action) => {
        state.pendingProductIds.push(action.meta.arg);
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        clearPending(state, action.meta.arg);
        removeLocally(state, action.meta.arg);
      })
      .addCase(removeFromWishlist.rejected, (state, action) => {
        clearPending(state, action.meta.arg);
      })
      .addCase(clearWishlist.fulfilled, (state) => {
        state.productIds = [];
        state.page = emptyPage;
        state.pageStatus = "succeeded";
        state.error = null;
      })
      .addCase(moveWishlistItemToCart.pending, (state, action) => {
        state.pendingProductIds.push(action.meta.arg.productId);
      })
      .addCase(moveWishlistItemToCart.fulfilled, (state, action) => {
        clearPending(state, action.meta.arg.productId);
        removeLocally(state, action.meta.arg.productId);
      })
      .addCase(moveWishlistItemToCart.rejected, (state, action) => {
        clearPending(state, action.meta.arg.productId);
      });
  },
});

export const selectWishlistPage = (state: RootState) => state.wishlistReducer.page;

export const selectWishlistCount = (state: RootState) =>
  state.wishlistReducer.productIds.length;

export const selectIsInWishlist = (productId: number) => (state: RootState) =>
  state.wishlistReducer.productIds.includes(productId);

export const selectIsWishlistPending = (productId: number) => (state: RootState) =>
  state.wishlistReducer.pendingProductIds.includes(productId);

export const { resetWishlist } = wishlist.actions;

export default wishlist.reducer;
