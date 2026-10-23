export type CartItemResponse = {
  id: number;
  productId: number;
  productName: string;
  productVariantId: number;
  sku: string;
  color: string | null;
  sizeName: string | null;
  imageUrl: string | null;
  /** false = the product or option was archived; it must be removed before checkout. */
  available: boolean;
  quantity: number;
  price: number;
  lineTotal: number;
};

export type CartResponse = {
  cartId: number;
  userId: number;
  totalCartPrice: number;
  totalPriceAfterDiscount: number;
  items: CartItemResponse[];
};

export type AddToCartRequest = {
  productVariantId: number;
  quantity: number;
};

export type UpdateCartItemRequest = {
  quantity: number;
};
