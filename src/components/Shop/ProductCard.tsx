import Image from "next/image";
import { Eye, Heart, ShoppingCart, Star } from "lucide-react";
import { useDispatch } from "react-redux";
import { useModalContext } from "@/app/context/QuickViewModalContext";
import { addProductToCart } from "@/lib/cart-actions";
import { useWishlistToggle } from "@/hooks/useWishlistToggle";
import { updateQuickView } from "@/redux/features/quickView-slice";
import { AppDispatch } from "@/redux/store";
import { Product } from "@/types/product";
import { ApiProduct } from "@/types/product-api";
import { isInStock, toCardProduct } from "@/lib/variants";

interface ProductCardProps {
  product: ApiProduct;
  layout: "grid" | "list";
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const ProductCard = ({ product, layout }: ProductCardProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { openModal } = useModalContext();
  const cardProduct = toCardProduct(product);
  const wishlist = useWishlistToggle(product.id);
  const variants = product.variants ?? [];
  const soldOut = variants.length > 0 && !variants.some(isInStock);
  // More than one variant: the customer has to pick color/size, so open quick view instead.
  const needsChoice = variants.length > 1;
  const openQuickView = () => {
    dispatch(updateQuickView(cardProduct));
    openModal();
  };
  const priceVariant = variants
    .map((variant) => ({
      price:
        variant.priceAfterDiscount !== null &&
        variant.priceAfterDiscount < variant.price
          ? variant.priceAfterDiscount
          : variant.price,
      originalPrice: variant.price,
    }))
    .sort((left, right) => left.price - right.price)[0];

  return (
    <article
      className={`group overflow-hidden rounded-lg bg-white shadow-1 ${
        layout === "list" ? "sm:flex" : ""
      }`}
    >
      <div
        className={`relative mb-4 flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white shadow-1 ${
          layout === "list"
            ? "min-h-[270px] w-full sm:mb-0 sm:min-h-[270px] sm:w-[270px]"
            : "min-h-[270px] w-full"
        }`}
      >
        <Image
          src={product.imageCover || "/images/products/product-1-bg-1.png"}
          alt={product.title}
          fill
          unoptimized
          sizes={
            layout === "list"
              ? "(max-width: 640px) 100vw, 250px"
              : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          }
          className="object-contain p-5 transition-transform duration-300 group-hover:scale-105"
        />

        <div className="pointer-events-none absolute bottom-0 left-0 flex w-full translate-y-full items-center justify-center gap-2.5 pb-5 transition-transform duration-200 group-hover:translate-y-0 group-focus-within:translate-y-0">
          <button
            type="button"
            onClick={wishlist.toggle}
            disabled={wishlist.pending}
            aria-pressed={wishlist.saved}
            aria-label={
              wishlist.saved
                ? `Remove ${product.title} from wishlist`
                : `Add ${product.title} to wishlist`
            }
            className={`pointer-events-auto flex h-9 w-9 items-center justify-center rounded-[5px] bg-white shadow-1 transition-colors hover:text-blue disabled:opacity-60 ${
              wishlist.saved ? "text-red" : "text-dark"
            }`}
          >
            <Heart
              size={17}
              fill={wishlist.saved ? "currentColor" : "none"}
              aria-hidden="true"
            />
          </button>

          <button
            type="button"
            onClick={() =>
              needsChoice
                ? openQuickView()
                : void addProductToCart(dispatch, cardProduct, 1)
            }
            disabled={!variants.length || soldOut}
            aria-label={
              needsChoice
                ? `Choose options for ${product.title}`
                : `Add ${product.title} to cart`
            }
            className="pointer-events-auto inline-flex items-center gap-2 rounded-[5px] bg-blue px-4 py-2 text-sm font-medium text-white shadow-1 transition-colors hover:bg-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingCart size={16} aria-hidden="true" />
            {soldOut ? "Sold out" : needsChoice ? "Choose options" : "Add to cart"}
          </button>

          <button
            type="button"
            onClick={openQuickView}
            aria-label={`View ${product.title}`}
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-[5px] bg-white text-dark shadow-1 transition-colors hover:text-blue"
          >
            <Eye size={17} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        className={`flex min-w-0 flex-1 flex-col ${
          layout === "list"
            ? "justify-center py-2 sm:px-7.5 sm:py-5"
            : "px-4 pb-4"
        }`}
      >
        <p className="text-xs font-medium uppercase tracking-wide text-blue">
          {product.brand?.brandName ?? "Unbranded"}
        </p>
        <h2 className="mb-1.5 mt-1 font-medium text-dark transition-colors group-hover:text-blue">
          {product.title}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {product.subCategory?.subCategoryName}
        </p>
        {layout === "list" && (
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-600">
            {product.description}
          </p>
        )}

        <div className="mb-2 mt-2 flex items-center gap-2.5 text-sm">
          <span className="flex items-center gap-0.5 text-amber-400">
            {Array.from({ length: 5 }, (_, index) => (
              <Star
                key={index}
                size={14}
                fill={
                  index < Math.round(Number(product.ratingsAverage ?? 0))
                    ? "currentColor"
                    : "none"
                }
                aria-hidden="true"
              />
            ))}
          </span>
          <span className="text-custom-sm text-gray-500">
            ({product.ratingsQuantity})
          </span>
        </div>

        <div className="flex items-baseline gap-2 font-medium text-lg">
          {priceVariant ? (
            <>
              <span className="text-lg font-semibold text-dark">
                {variants.length > 1 ? "From " : ""}
                {currency.format(priceVariant.price)}
              </span>
              {priceVariant.originalPrice > priceVariant.price && (
                <span className="text-sm text-gray-400 line-through">
                  {currency.format(priceVariant.originalPrice)}
                </span>
              )}
            </>
          ) : (
            <span className="text-sm text-gray-500">Price unavailable</span>
          )}
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
