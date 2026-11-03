export type ProductVariant = {
  id: number;
  status?: string;
  color: string | null;
  size: {
    id: number;
    name: string;
    description: string | null;
    active: boolean;
    createdAt: string | null;
  } | null;
  sku: string;
  price: number;
  priceAfterDiscount: number | null;
  /** The variant's OWN discount (null = it uses the product's discount). */
  discountPercent?: number | null;
  /** Discount actually applied: the variant's own, else the product-wide one. */
  effectiveDiscountPercent?: number | null;
  discountAmount?: number | null;
  soldQuantity: number;
  /** Stock the customer can still order (quantity - reserved). */
  availableQuantity: number;
};

export type ProductImage = {
  id: number;
  imageUrl: string;
  /** Variant color this image shows; null = shown for every color. */
  color: string | null;
  sortOrder: number;
};

/** Who a product is for; MEN and WOMEN filters also include UNISEX products. */
export type ProductType = "MEN" | "WOMEN" | "UNISEX";

export const PRODUCT_TYPES: ProductType[] = ["MEN", "WOMEN", "UNISEX"];

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  MEN: "Men",
  WOMEN: "Women",
  UNISEX: "Unisex",
};

export type ApiProduct = {
  id: number;
  title: string;
  slug: string;
  description: string;
  imageCover: string;
  /** Null for products that haven't been given a type yet. */
  productType: ProductType | null;
  ratingsAverage: number;
  ratingsQuantity: number;
  subCategory: {
    subCategoryId: number;
    subCategoryName: string;
  };
  brand: {
    brandId: number;
    brandName: string;
  };
  variants: ProductVariant[];
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
};

export type ProductPage = {
  content: ApiProduct[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
};

export type ProductFilters = {
  type?: ProductType;
  title?: string;
  brandId?: number;
  subCategoryId?: number;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  page: number;
  size: number;
};

export type ProductSummaryResponse = {
  id: number;
  name: string;
  slug: string;
  price: number;
  imageUrl: string;
};

export type BestSellerSummaryResponse = Omit<ProductSummaryResponse, "price"> & {
  price: number | null;
  totalSold: number;
};
