"use client";
import React, { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import {
  CheckCircle2,
  Heart,
  Minus,
  Plus,
  ShoppingCart,
  XCircle,
  ZoomIn,
} from "lucide-react";
import Breadcrumb from "../Common/Breadcrumb";
import Newsletter from "../Common/Newsletter";
import StarIcon from "../Common/StarIcon";
import VariantPicker, { VariantSelection } from "../Common/VariantPicker";
import ProductReviews from "@/components/Reviews/ProductReviews";
import RelatedProducts from "./RelatedProducts";
import AvailableCoupons from "../Common/AvailableCoupons";
import { usePreviewSlider } from "@/app/context/PreviewSliderContext";
import { AppDispatch, useAppSelector } from "@/redux/store";
import { updateproductDetails } from "@/redux/features/product-details";
import { productsApi } from "@/lib/api/products.api";
import { addProductToCart } from "@/lib/cart-actions";
import { formatMoney, useCurrency } from "@/lib/currency";
import { getApiErrorMessage } from "@/lib/order-utils";
import {
  defaultVariant,
  effectivePrice,
  findVariant,
  getImagesForColor,
  isInStock,
  toCardProduct,
  variantDiscountPercent,
} from "@/lib/variants";
import { useWishlistToggle } from "@/hooks/useWishlistToggle";
import { ApiProduct, PRODUCT_TYPE_LABELS } from "@/types/product-api";

const LOW_STOCK = 5;

/** Product id from ?id=, else the product last opened from a card (kept across refreshes). */
const useRequestedProductId = (): number | null => {
  const searchParams = useSearchParams();
  const fromStore = useAppSelector((state) => state.productDetailsReducer.value);

  const fromUrl = Number(searchParams.get("id"));
  if (Number.isInteger(fromUrl) && fromUrl > 0) return fromUrl;
  if (fromStore?.id) return Number(fromStore.id);

  try {
    const saved = JSON.parse(localStorage.getItem("productDetails") ?? "null");
    return saved?.id ? Number(saved.id) : null;
  } catch {
    return null;
  }
};

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="rounded-md even:bg-gray-1 flex py-4 px-4 sm:px-5">
    <div className="max-w-[450px] min-w-[140px] w-full">
      <p className="text-sm sm:text-base text-dark-4">{label}</p>
    </div>
    <div className="w-full">
      <p className="text-sm sm:text-base text-dark">{value}</p>
    </div>
  </div>
);

const ShopDetailsContent = () => {
  useCurrency(); // re-render prices if the store currency changes
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { openPreviewModal } = usePreviewSlider();
  const productId = useRequestedProductId();

  const [apiProduct, setApiProduct] = useState<ApiProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [selection, setSelection] = useState<VariantSelection>({ color: null, sizeId: null });
  const [previewImg, setPreviewImg] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [reviewStats, setReviewStats] = useState<{ count: number; averageRating: number } | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const wishlist = useWishlistToggle(productId ?? 0);

  // Always show the latest price and stock, not the copy saved when the card was clicked
  useEffect(() => {
    if (!productId) {
      setIsLoading(false);
      return;
    }

    let isActive = true;
    setIsLoading(true);
    setError(null);

    productsApi
      .getById(productId)
      .then((product) => {
        if (!isActive) return;
        setApiProduct(product);
        const initial = defaultVariant(product);
        setSelection({
          color: initial?.color?.trim() || null,
          sizeId: initial?.size?.id ?? null,
        });
        setPreviewImg(0);
        setQuantity(1);
        setReviewStats(null);
        localStorage.setItem("productDetails", JSON.stringify(toCardProduct(product)));
      })
      .catch((requestError) => {
        if (isActive) setError(getApiErrorMessage(requestError, "Unable to load this product."));
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [productId, reloadKey]);

  if (isLoading) {
    return (
      <section className="site-container py-20">
        <div className="flex animate-pulse flex-col gap-7.5 lg:flex-row">
          <div className="aspect-square w-full rounded-lg bg-gray-2 lg:w-1/2" />
          <div className="flex-1 space-y-4">
            <div className="h-8 w-3/4 rounded bg-gray-2" />
            <div className="h-4 w-1/3 rounded bg-gray-2" />
            <div className="h-8 w-1/4 rounded bg-gray-2" />
            <div className="h-24 w-full rounded bg-gray-2" />
            <div className="h-12 w-1/2 rounded bg-gray-2" />
          </div>
        </div>
      </section>
    );
  }

  if (!productId || error || !apiProduct) {
    return (
      <section className="site-container py-20 text-center">
        <p className="text-lg font-medium text-dark">
          {error ?? "Choose a product to see its details."}
        </p>
        <div className="mt-5 flex justify-center gap-3">
          {error && (
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="rounded-md bg-blue px-6 py-2.5 font-medium text-white hover:bg-blue-dark"
            >
              Try again
            </button>
          )}
          <Link
            href="/shop-with-sidebar"
            className="rounded-md border border-gray-3 px-6 py-2.5 font-medium text-dark hover:bg-gray-1"
          >
            Browse products
          </Link>
        </div>
      </section>
    );
  }

  const variants = apiProduct.variants ?? [];
  const selectedVariant =
    findVariant(apiProduct, selection.color, selection.sizeId) ?? (variants.length === 1 ? variants[0] : undefined);
  const gallery = getImagesForColor(apiProduct, selection.color);
  const cardProduct = toCardProduct(apiProduct);

  // Price of the chosen variant, else the "from" price of the product
  const price = selectedVariant ? selectedVariant.price : cardProduct.price;
  const salePrice = selectedVariant ? effectivePrice(selectedVariant) : cardProduct.discountedPrice;
  const discount =
    selectedVariant
      ? variantDiscountPercent(selectedVariant)
      : price > salePrice && price > 0
      ? Math.round((1 - salePrice / price) * 100)
      : 0;

  const available = selectedVariant?.availableQuantity ?? 0;
  const soldOut = variants.length > 0 && !variants.some(isInStock);
  const canAdd = Boolean(selectedVariant) && available > 0;
  const totalSold = variants.reduce((sum, variant) => sum + (variant.soldQuantity ?? 0), 0);

  const rating = reviewStats?.count ? reviewStats.averageRating : apiProduct.ratingsAverage ?? 0;
  const reviewCount = reviewStats?.count ?? apiProduct.ratingsQuantity ?? 0;

  const purchasable = {
    ...cardProduct,
    productVariantId: selectedVariant?.id,
    price,
    discountedPrice: salePrice,
    imgs: { thumbnails: gallery, previews: gallery },
  };

  const changeSelection = (next: VariantSelection) => {
    if (next.color !== selection.color) setPreviewImg(0);
    setSelection(next);
    setQuantity(1);
  };

  const handlePreview = () => {
    // The preview slider reads its images from the product-details store
    dispatch(updateproductDetails(purchasable));
    openPreviewModal();
  };

  const addToCart = async (thenCheckout: boolean) => {
    if (!canAdd || isAdding) return;
    setIsAdding(true);
    const added = await addProductToCart(dispatch, purchasable, quantity);
    setIsAdding(false);
    if (added && thenCheckout) router.push("/checkout");
  };

  const tabs = [
    { id: "description", title: "Description" },
    { id: "information", title: "Additional Information" },
    { id: "reviews", title: reviewCount > 0 ? `Reviews (${reviewCount})` : "Reviews" },
  ];

  return (
    <>
      <section className="overflow-hidden relative pb-20 pt-5 lg:pt-20 xl:pt-28">
        <div className="site-container">
          <div className="flex flex-col lg:flex-row gap-7.5 xl:gap-17.5">
            {/* <!-- gallery --> */}
            <div className="w-full lg:w-1/2 lg:max-w-[760px] lg:shrink-0">
              <div className="relative aspect-square lg:aspect-auto lg:min-h-[512px] rounded-lg shadow-1 bg-gray-2 overflow-hidden">
                {gallery[previewImg] ? (
                  <>
                    <button
                      type="button"
                      onClick={handlePreview}
                      aria-label="Zoom image"
                      className="w-11 h-11 rounded-[5px] bg-gray-1 shadow-1 flex items-center justify-center ease-out duration-200 text-dark hover:text-blue absolute top-4 lg:top-6 right-4 lg:right-6 z-10"
                    >
                      <ZoomIn size={20} />
                    </button>
                    <Image
                      src={gallery[previewImg]}
                      alt={apiProduct.title}
                      fill
                      unoptimized
                      priority
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-contain p-4 sm:p-7.5"
                    />
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-dark-4">
                    <div className="relative h-24 w-20 opacity-50">
                      <Image src="/images/logo/system-logo.png" alt="" fill sizes="80px" className="object-contain" />
                    </div>
                    <span className="text-sm">No photo yet</span>
                  </div>
                )}

                {discount > 0 && (
                  <span className="absolute left-4 top-4 lg:left-6 lg:top-6 rounded bg-red px-2.5 py-1 text-custom-sm font-semibold text-white">
                    -{discount}%
                  </span>
                )}
              </div>

              {gallery.length > 1 && (
                <div className="flex flex-wrap sm:flex-nowrap gap-4.5 mt-6">
                  {gallery.map((src, key) => (
                    <button
                      type="button"
                      onClick={() => setPreviewImg(key)}
                      key={src}
                      aria-label={`Show image ${key + 1}`}
                      className={`relative w-15 sm:w-25 h-15 sm:h-25 overflow-hidden rounded-lg bg-gray-2 shadow-1 ease-out duration-200 border-2 hover:border-blue ${
                        key === previewImg ? "border-blue" : "border-transparent"
                      }`}
                    >
                      <Image src={src} alt="" fill unoptimized sizes="100px" className="object-contain p-1" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* <!-- product content --> */}
            <div className="w-full lg:flex-1 lg:min-w-0">
              {apiProduct.brand?.brandName && (
                <Link
                  href={`/shop-with-sidebar?brandId=${apiProduct.brand.brandId}`}
                  className="mb-2 inline-block text-custom-sm font-semibold uppercase tracking-wider text-blue hover:underline"
                >
                  {apiProduct.brand.brandName}
                </Link>
              )}

              <h2 className="font-semibold text-xl sm:text-2xl xl:text-custom-3 text-dark mb-3">
                {apiProduct.title}
              </h2>

              <div className="flex flex-wrap items-center gap-x-5.5 gap-y-2 mb-4.5">
                <button
                  type="button"
                  onClick={() => setActiveTab("reviews")}
                  className="flex items-center gap-2.5 text-left transition hover:opacity-80"
                  title="View reviews"
                >
                  <span className="flex items-center gap-1" aria-label={`Rated ${rating.toFixed(1)} out of 5`}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon key={star} filled={star <= Math.round(rating)} className="w-4 h-4" />
                    ))}
                  </span>
                  <span className="text-sm text-gray-500 hover:text-blue hover:underline">
                    {rating > 0 && `${rating.toFixed(1)} · `}
                    {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
                  </span>
                </button>

                {totalSold > 0 && (
                  <span className="text-sm text-gray-500">{totalSold.toLocaleString()} sold</span>
                )}

                {soldOut ? (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-red">
                    <XCircle size={18} /> Sold out
                  </span>
                ) : selectedVariant && available === 0 ? (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-red">
                    <XCircle size={18} /> This option is sold out
                  </span>
                ) : selectedVariant ? (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-green">
                    <CheckCircle2 size={18} />
                    {available <= LOW_STOCK ? `Only ${available} left` : "In stock"}
                  </span>
                ) : null}
              </div>

              <div className="flex items-end gap-3 mb-5">
                <span className="text-heading-6 font-semibold text-dark">{formatMoney(salePrice)}</span>
                {discount > 0 && (
                  <span className="text-xl text-dark-4 line-through">{formatMoney(price)}</span>
                )}
                {!selectedVariant && variants.length > 1 && (
                  <span className="text-sm text-dark-4">from</span>
                )}
              </div>

              {apiProduct.description && (
                <p className="text-dark-4 line-clamp-3">{apiProduct.description}</p>
              )}

              <AvailableCoupons />

              <div className="flex flex-col gap-4.5 border-y border-gray-3 mt-7.5 mb-9 py-7.5">
                <VariantPicker product={apiProduct} selection={selection} onChange={changeSelection} />

                {apiProduct.productType && (
                  <div className="flex items-center gap-4">
                    <h4 className="font-medium text-dark">Type:</h4>
                    <span className="inline-flex rounded-full border border-blue px-3 py-0.5 text-custom-sm font-medium text-blue">
                      {PRODUCT_TYPE_LABELS[apiProduct.productType]}
                    </span>
                  </div>
                )}

                {selectedVariant?.sku && (
                  <p className="text-custom-sm text-dark-4">SKU: {selectedVariant.sku}</p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4.5">
                <div className="flex items-center rounded-md border border-gray-3">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                    className="flex items-center justify-center w-12 h-12 ease-out duration-200 hover:text-blue disabled:opacity-40"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="flex items-center justify-center w-16 h-12 border-x border-gray-4" aria-live="polite">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={!canAdd || quantity >= available}
                    onClick={() => setQuantity((value) => Math.min(available, value + 1))}
                    className="flex items-center justify-center w-12 h-12 ease-out duration-200 hover:text-blue disabled:opacity-40"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => addToCart(false)}
                  disabled={!canAdd || isAdding}
                  className="inline-flex items-center gap-2 font-medium text-white bg-dark py-3 px-7 rounded-md ease-out duration-200 hover:bg-blue disabled:cursor-not-allowed disabled:bg-gray-4"
                >
                  <ShoppingCart size={18} />
                  {soldOut ? "Sold out" : "Add to Cart"}
                </button>

                <button
                  type="button"
                  onClick={() => addToCart(true)}
                  disabled={!canAdd || isAdding}
                  className="inline-flex font-medium text-white bg-blue py-3 px-7 rounded-md ease-out duration-200 hover:bg-blue-dark disabled:cursor-not-allowed disabled:bg-gray-4"
                >
                  Buy Now
                </button>

                <button
                  type="button"
                  onClick={wishlist.toggle}
                  disabled={wishlist.pending}
                  aria-pressed={wishlist.saved}
                  aria-label={wishlist.saved ? "Remove from wishlist" : "Add to wishlist"}
                  className={`flex items-center justify-center w-12 h-12 rounded-md border border-gray-3 ease-out duration-200 hover:text-white hover:bg-dark hover:border-transparent disabled:opacity-60 ${
                    wishlist.saved ? "text-red" : "text-dark"
                  }`}
                >
                  <Heart size={20} fill={wishlist.saved ? "currentColor" : "none"} />
                </button>
              </div>

              {variants.length > 0 && !selectedVariant && (
                <p className="mt-3 text-custom-sm text-dark-4">Choose an option above to add it to your cart.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-gray-2 py-20">
        <div className="site-container">
          {/* <!--== tab header ==--> */}
          <div className="flex flex-wrap items-center bg-white rounded-[10px] shadow-1 gap-5 xl:gap-12.5 py-4.5 px-4 sm:px-6">
            {tabs.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`font-medium lg:text-lg ease-out duration-200 hover:text-blue relative before:h-0.5 before:bg-blue before:absolute before:left-0 before:bottom-0 before:ease-out before:duration-200 hover:before:w-full ${
                  activeTab === item.id ? "text-blue before:w-full" : "text-dark before:w-0"
                }`}
              >
                {item.title}
              </button>
            ))}
          </div>

          {/* <!-- description --> */}
          <div className={activeTab === "description" ? "block mt-12.5" : "hidden"}>
            <div className="rounded-xl bg-white shadow-1 p-4 sm:p-7.5">
              {apiProduct.description ? (
                <p className="whitespace-pre-line leading-relaxed text-dark">{apiProduct.description}</p>
              ) : (
                <p className="text-dark-4">No description has been added for this product yet.</p>
              )}
            </div>
          </div>

          {/* <!-- additional information --> */}
          <div className={activeTab === "information" ? "block mt-10" : "hidden"}>
            <div className="rounded-xl bg-white shadow-1 p-4 sm:p-6">
              {apiProduct.brand?.brandName && <InfoRow label="Brand" value={apiProduct.brand.brandName} />}
              {apiProduct.subCategory?.subCategoryName && (
                <InfoRow label="Category" value={apiProduct.subCategory.subCategoryName} />
              )}
              {apiProduct.productType && (
                <InfoRow label="Type" value={PRODUCT_TYPE_LABELS[apiProduct.productType]} />
              )}
              {variants.length > 0 && (
                <InfoRow
                  label="Available options"
                  value={variants
                    .map((variant) => [variant.color, variant.size?.name].filter(Boolean).join(" / ") || variant.sku)
                    .join(", ")}
                />
              )}
              {selectedVariant && (
                <>
                  <InfoRow label="SKU" value={selectedVariant.sku} />
                  <InfoRow
                    label="Stock"
                    value={available > 0 ? `${available} available` : "Sold out"}
                  />
                </>
              )}
              {totalSold > 0 && <InfoRow label="Sold" value={totalSold.toLocaleString()} />}
              <InfoRow
                label="Rating"
                value={reviewCount > 0 ? `${rating.toFixed(1)} / 5 (${reviewCount} reviews)` : "No reviews yet"}
              />
            </div>
          </div>

          {/* <!-- reviews --> */}
          <div className={activeTab === "reviews" ? "block mt-10" : "hidden"}>
            <ProductReviews
              productId={apiProduct.id}
              productName={apiProduct.title}
              onStatsChange={setReviewStats}
            />
          </div>
        </div>
      </section>

      <RelatedProducts productId={apiProduct.id} />
    </>
  );
};

const ShopDetails = () => (
  <>
    <Breadcrumb title="Product Details" pages={["shop", "/", "product details"]} />
    <Suspense
      fallback={<div className="site-container py-20 text-sm text-gray-500">Loading product...</div>}
    >
      <ShopDetailsContent />
    </Suspense>
    <Newsletter />
  </>
);

export default ShopDetails;
