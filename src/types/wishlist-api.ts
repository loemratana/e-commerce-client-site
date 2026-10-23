export type WishlistItemResponse = {
  id: number;
  productId: number;
  productName: string;
  slug: string;
  imageUrl: string | null;
  /** Lowest current price among the product's active variants; null if it has none. */
  priceFrom: number | null;
  ratingsAverage: number | null;
  /** false = archived or no active option left; it can't be moved to the cart. */
  available: boolean;
  addedAt: string;
};

export type WishlistStatusResponse = {
  productId: number;
  inWishlist: boolean;
};

export type MoveToCartRequest = {
  productVariantId: number;
  quantity: number;
};
