export type ProductVariant = {
  id: number;
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

export type ApiProduct = {
  id: number;
  title: string;
  slug: string;
  description: string;
  imageCover: string;
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
