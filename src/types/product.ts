import { ApiProduct } from "@/types/product-api";

export type Product = {
  title: string;
  reviews: number;
  price: number;
  discountedPrice: number;
  id: number;
  productVariantId?: number;
  /** Full API product, so quick view can offer color/size selection. */
  apiProduct?: ApiProduct;
  /** Quick view opened from the wishlist page: adding to cart moves it out of the wishlist. */
  fromWishlist?: boolean;
  imgs?: {
    thumbnails: string[];
    previews: string[];
  };
};
