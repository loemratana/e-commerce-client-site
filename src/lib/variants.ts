import { ApiProduct, ProductVariant } from "@/types/product-api";
import { Product } from "@/types/product";

// Colors are matched case-insensitively and ignoring surrounding spaces, like the API does.
const colorKey = (color: string | null | undefined) =>
  (color ?? "").trim().toLowerCase();

export const sameColor = (
  left: string | null | undefined,
  right: string | null | undefined
) => colorKey(left) === colorKey(right);

/** Price the customer actually pays for a variant. */
export const effectivePrice = (variant: ProductVariant) =>
  variant.priceAfterDiscount !== null &&
  variant.priceAfterDiscount !== undefined &&
  variant.priceAfterDiscount < variant.price
    ? variant.priceAfterDiscount
    : variant.price;

export const isInStock = (variant: ProductVariant) =>
  (variant.availableQuantity ?? 0) > 0;

export type ColorOption = { color: string; inStock: boolean };
export type SizeOption = {
  id: number;
  name: string;
  variant: ProductVariant;
  inStock: boolean;
};

/** Distinct colors in variant order; a color is in stock if any of its sizes is. */
export const getColorOptions = (product: ApiProduct): ColorOption[] => {
  const options: ColorOption[] = [];
  for (const variant of product.variants ?? []) {
    if (!variant.color?.trim()) continue;
    const existing = options.find((option) => sameColor(option.color, variant.color));
    if (existing) existing.inStock ||= isInStock(variant);
    else options.push({ color: variant.color.trim(), inStock: isInStock(variant) });
  }
  return options;
};

/** Sizes available for the chosen color (all variants when the product has no colors). */
export const getSizeOptions = (
  product: ApiProduct,
  color: string | null
): SizeOption[] =>
  (product.variants ?? [])
    .filter((variant) => variant.size && sameColor(variant.color, color))
    .map((variant) => ({
      id: variant.size!.id,
      name: variant.size!.name,
      variant,
      inStock: isInStock(variant),
    }));

/** The single variant matching a color + size choice (either may be absent on the product). */
export const findVariant = (
  product: ApiProduct,
  color: string | null,
  sizeId: number | null
): ProductVariant | undefined =>
  (product.variants ?? []).find(
    (variant) =>
      sameColor(variant.color, color) && (variant.size?.id ?? null) === sizeId
  );

/** Starting selection: the first in-stock variant, else the first variant. */
export const defaultVariant = (product: ApiProduct) =>
  (product.variants ?? []).find(isInStock) ?? product.variants?.[0];

/**
 * Gallery for the chosen color: that color's images first, then general (untagged) ones.
 * Falls back to every image when nothing is tagged for the color.
 */
export const getImagesForColor = (
  product: ApiProduct,
  color: string | null
): string[] => {
  const sorted = [...(product.images ?? [])].sort(
    (left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0)
  );
  const tagged = color
    ? sorted.filter((image) => image.color && sameColor(image.color, color))
    : [];
  const general = sorted.filter((image) => !image.color);
  const urls = tagged.length
    ? [...tagged, ...general].map((image) => image.imageUrl)
    : [product.imageCover, ...general.map((image) => image.imageUrl)];
  const unique = Array.from(new Set(urls.filter(Boolean)));
  return unique.length
    ? unique
    : sorted.map((image) => image.imageUrl).filter(Boolean);
};

export const variantLabel = (color?: string | null, sizeName?: string | null) =>
  [color, sizeName].filter(Boolean).join(" / ");

/**
 * Convert an ApiProduct from backend into a UI Product,
 * selecting the best in-stock variant and calculating prices.
 */
export const toCardProduct = (product: ApiProduct): Product => {
  const inStockVariants = (product.variants ?? []).filter(isInStock);
  const candidateVariants =
    inStockVariants.length > 0 ? inStockVariants : (product.variants ?? []);

  const cheapestVariant = [...candidateVariants].sort((left, right) => {
    const leftPrice = effectivePrice(left);
    const rightPrice = effectivePrice(right);
    return leftPrice - rightPrice;
  })[0];

  const discountedPrice = cheapestVariant
    ? effectivePrice(cheapestVariant)
    : 0;

  const images = [
    product.imageCover,
    ...(product.images ?? [])
      .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
      .map((image) => image.imageUrl),
  ].filter(Boolean);

  return {
    id: product.id,
    productVariantId: cheapestVariant?.id,
    title: product.title,
    reviews: product.ratingsQuantity ?? 0,
    price: cheapestVariant?.price ?? 0,
    discountedPrice,
    imgs: { thumbnails: images, previews: images },
    apiProduct: product,
  };
};
