"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ApiError } from "@/lib/api/client";
import { reviewsApi } from "@/lib/api/reviews.api";
import { clearAuthTokens } from "@/lib/auth-session";
import {
  hasAccessToken,
  requestAuthentication,
} from "@/lib/auth-prompt";
import { Review, ReviewPage, ReviewRequest } from "@/types/review";
import Pagination from "./Pagination";
import ReviewCard from "./ReviewCard";
import StarIcon from "@/components/Common/StarIcon";

const PAGE_SIZE = 5;

type ProductReviewsProps = {
  productId: number;
  productName?: string;
  onStatsChange?: (stats: { count: number; averageRating: number }) => void;
};

const notifyReviewError = (error: unknown, fallbackMessage: string) => {
  if (error instanceof ApiError && error.status === 401) {
    clearAuthTokens();
    requestAuthentication();
  }
  toast.error(error instanceof Error ? error.message : fallbackMessage);
};

const RATING_LABELS: Record<number, string> = {
  5: "5 - Excellent",
  4: "4 - Good",
  3: "3 - Average",
  2: "2 - Poor",
  1: "1 - Terrible",
};

const ProductReviews = ({
  productId,
  productName,
  onStatsChange,
}: ProductReviewsProps) => {
  // Navigation & views
  const [viewMode, setViewMode] = useState<"product" | "mine" | "all">("product");
  const [page, setPage] = useState(0);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  // Data states
  const [result, setResult] = useState<ReviewPage | null>(null);
  const [allProductReviews, setAllProductReviews] = useState<Review[]>([]);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  // Form states
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [ratings, setRatings] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [titleValue, setTitleValue] = useState("");
  const [commentValue, setCommentValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [deletingReview, setDeletingReview] = useState<Review | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const formRef = useRef<HTMLDivElement | null>(null);

  // Load user's own reviews if authenticated (GET /api/v1/review/me)
  const loadMyReviews = useCallback(async () => {
    if (!hasAccessToken()) {
      setMyReviews([]);
      return;
    }
    try {
      const response = await reviewsApi.getMine(0, 50);
      setMyReviews(response.content ?? []);
    } catch {
      // Non-fatal if fetching user reviews fails silently
      setMyReviews([]);
    }
  }, []);

  // Set of review IDs authored by current user
  const myReviewIds = useMemo(() => {
    return new Set(myReviews.map((r) => r.id));
  }, [myReviews]);

  // Current user's review for this specific product
  const myReviewForThisProduct = useMemo(() => {
    return myReviews.find((r) => r.product?.id === productId) || null;
  }, [myReviews, productId]);

  // Load reviews depending on active viewMode
  const loadReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      let pageData: ReviewPage;
      if (viewMode === "mine") {
        // GET /api/v1/review/me
        pageData = await reviewsApi.getMine(page, PAGE_SIZE);
      } else if (viewMode === "all") {
        // GET /api/v1/review
        pageData = await reviewsApi.getAll(page, PAGE_SIZE);
      } else {
        // GET /api/v1/review/product/{productId}
        pageData = await reviewsApi.getProductReviews(productId, page, PAGE_SIZE);
      }
      setResult(pageData);

      // If viewing product reviews, also fetch a larger batch for metrics if on page 0
      if (viewMode === "product" && page === 0) {
        if (pageData.totalElements <= PAGE_SIZE) {
          setAllProductReviews(pageData.content);
        } else {
          try {
            const allBatch = await reviewsApi.getProductReviews(
              productId,
              0,
              Math.min(pageData.totalElements, 50)
            );
            setAllProductReviews(allBatch.content);
          } catch {
            setAllProductReviews(pageData.content);
          }
        }
      }
    } catch (error) {
      notifyReviewError(error, "Unable to load reviews.");
    } finally {
      setIsLoading(false);
    }
  }, [page, productId, viewMode]);

  // Calculate review metrics and statistics
  const stats = useMemo(() => {
    const list =
      viewMode === "product"
        ? allProductReviews.length > 0
          ? allProductReviews
          : result?.content ?? []
        : result?.content ?? [];

    const totalCount =
      viewMode === "product" && result ? result.totalElements : list.length;

    if (totalCount === 0 || list.length === 0) {
      return {
        count: totalCount,
        average: 5,
        breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }

    const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;

    for (const r of list) {
      const rounded = Math.max(1, Math.min(5, Math.round(r.ratings)));
      breakdown[rounded] = (breakdown[rounded] || 0) + 1;
      sum += r.ratings;
    }

    const average = Math.round((sum / list.length) * 10) / 10;
    const percentages: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    for (let star = 1; star <= 5; star++) {
      percentages[star] = Math.round(((breakdown[star] || 0) / list.length) * 100);
    }

    return {
      count: totalCount,
      average,
      breakdown,
      percentages,
    };
  }, [allProductReviews, result, viewMode]);

  // Report stats to parent (e.g. ShopDetails)
  useEffect(() => {
    if (viewMode === "product" && onStatsChange) {
      onStatsChange({
        count: stats.count,
        averageRating: stats.average,
      });
    }
  }, [onStatsChange, stats.average, stats.count, viewMode]);

  // Initial and reactive loading
  useEffect(() => {
    if (productId > 0) {
      void loadReviews();
      void loadMyReviews();
    }
  }, [loadMyReviews, loadReviews, productId, reloadKey]);

  // Filter items by rating if user selected a star filter
  const displayedReviews = useMemo(() => {
    if (!result?.content) return [];
    if (ratingFilter === null) return result.content;
    return result.content.filter(
      (rev) => Math.round(rev.ratings) === ratingFilter
    );
  }, [ratingFilter, result]);

  // Start editing a review (PUT /api/v1/review/{id})
  const handleStartEdit = (review: Review) => {
    setEditingReview(review);
    setRatings(review.ratings);
    setTitleValue(review.title ?? "");
    setCommentValue(review.comment ?? "");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCancelEdit = () => {
    setEditingReview(null);
    setRatings(5);
    setTitleValue("");
    setCommentValue("");
  };

  // Form submit: Create (POST /api/v1/review/product/{productId}) or Update (PUT /api/v1/review/{id})
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasAccessToken()) {
      requestAuthentication();
      return;
    }

    const request: ReviewRequest = {
      title: titleValue.trim(),
      ratings,
      comment: commentValue.trim(),
    };

    setIsSubmitting(true);
    try {
      if (editingReview) {
        // PUT /api/v1/review/{id}
        await reviewsApi.update(editingReview.id, request);
        toast.success("Your review was updated successfully.");
        setEditingReview(null);
      } else {
        // POST /api/v1/review/product/{productId}
        await reviewsApi.create(productId, request);
        toast.success("Thank you! Your review was submitted.");
        setPage(0);
      }

      setRatings(5);
      setTitleValue("");
      setCommentValue("");
      setReloadKey((k) => k + 1);
    } catch (error) {
      notifyReviewError(
        error,
        editingReview ? "Unable to update review." : "Unable to submit review."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete confirm & submit (DELETE /api/v1/review/{id})
  const handleDeleteConfirm = async () => {
    if (!deletingReview) return;
    setIsDeleting(true);
    try {
      await reviewsApi.delete(deletingReview.id);
      toast.success("Your review was deleted.");
      if (editingReview?.id === deletingReview.id) {
        handleCancelEdit();
      }
      setDeletingReview(null);
      setReloadKey((k) => k + 1);
    } catch (error) {
      notifyReviewError(error, "Unable to delete review.");
    } finally {
      setIsDeleting(false);
    }
  };

  const activeRating = hoverRating !== null ? hoverRating : ratings;

  return (
    <section className="w-full space-y-8">
      {/* Top Header & View Modes */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-3 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-dark sm:text-3xl">
            Customer Reviews & Ratings
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {viewMode === "product"
              ? `Real feedback for ${productName || "this product"}`
              : viewMode === "mine"
                ? "Reviews written by your account"
                : "Recent reviews from all customers"}
          </p>
        </div>

        {/* View mode toggle tabs: Product Reviews | My Reviews | All Store Reviews */}
        <div className="inline-flex rounded-xl bg-gray-1 p-1 shadow-inner">
          <button
            type="button"
            onClick={() => {
              setViewMode("product");
              setPage(0);
              setRatingFilter(null);
            }}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition sm:text-sm ${
              viewMode === "product"
                ? "bg-white text-blue shadow-sm"
                : "text-gray-600 hover:text-dark"
            }`}
          >
            Product ({stats.count})
          </button>
          <button
            type="button"
            onClick={() => {
              if (!hasAccessToken()) {
                requestAuthentication();
                return;
              }
              setViewMode("mine");
              setPage(0);
              setRatingFilter(null);
            }}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition sm:text-sm ${
              viewMode === "mine"
                ? "bg-white text-blue shadow-sm"
                : "text-gray-600 hover:text-dark"
            }`}
          >
            My Reviews ({myReviews.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode("all");
              setPage(0);
              setRatingFilter(null);
            }}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition sm:text-sm ${
              viewMode === "all"
                ? "bg-white text-blue shadow-sm"
                : "text-gray-600 hover:text-dark"
            }`}
          >
            All Store Reviews
          </button>
        </div>
      </div>

      {/* Main Grid: Left = Metrics & Review List, Right = Form */}
      <div className="grid w-full gap-8 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.9fr)]">
        {/* Left Column: Metrics & List */}
        <div className="space-y-6">
          {/* Review Score Summary & Breakdown Card */}
          <div className="rounded-2xl border border-gray-3 bg-white p-6 shadow-xs sm:p-7">
            <div className="grid gap-6 sm:grid-cols-[160px_minmax(0,1fr)] sm:items-center">
              <div className="flex flex-col items-center justify-center border-b border-gray-3 pb-6 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-6 text-center">
                <span className="text-5xl font-extrabold text-dark tracking-tight">
                  {stats.count > 0 ? stats.average.toFixed(1) : "5.0"}
                </span>
                <div className="mt-2 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon
                      key={star}
                      filled={star <= Math.round(stats.average)}
                      className="w-5 h-5"
                    />
                  ))}
                </div>
                <p className="mt-1 text-xs font-medium text-gray-500">
                  Based on {stats.count} {stats.count === 1 ? "review" : "reviews"}
                </p>
              </div>

              {/* Star Rating Progress Bars */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = stats.breakdown[star] || 0;
                  const pct = stats.percentages[star] || 0;
                  const isSelected = ratingFilter === star;

                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setRatingFilter(isSelected ? null : star)
                      }
                      className={`flex w-full items-center gap-3 rounded-lg px-2 py-1 text-left transition hover:bg-gray-1 ${
                        isSelected ? "bg-blue/5 font-semibold text-blue ring-1 ring-blue/20" : "text-gray-600"
                      }`}
                      title={`Filter by ${star} stars`}
                    >
                      <div className="w-14 shrink-0 flex items-center gap-1 text-xs font-medium text-dark">
                        <span>{star}</span>
                        <StarIcon filled={true} className="w-3.5 h-3.5" />
                      </div>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-2">
                        <div
                          className="h-full rounded-full bg-[#FBBF24] transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-xs text-gray-400">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rating Filter Pills */}
            <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-gray-2 pt-4">
              <span className="text-xs font-medium text-gray-500">Filter by:</span>
              <button
                type="button"
                onClick={() => setRatingFilter(null)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  ratingFilter === null
                    ? "bg-dark text-white"
                    : "bg-gray-1 text-gray-600 hover:bg-gray-2"
                }`}
              >
                All ratings
              </button>
              {[5, 4, 3, 2, 1].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() =>
                    setRatingFilter(ratingFilter === star ? null : star)
                  }
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition ${
                    ratingFilter === star
                      ? "bg-blue text-white"
                      : "bg-gray-1 text-gray-600 hover:bg-gray-2"
                  }`}
                >
                  <span>{star}</span>
                  <StarIcon
                    filled={true}
                    className={`w-3.5 h-3.5 ${
                      ratingFilter === star ? "text-white" : "text-[#FBBF24]"
                    }`}
                  />
                </button>
              ))}
              {ratingFilter !== null && (
                <button
                  type="button"
                  onClick={() => setRatingFilter(null)}
                  className="ml-auto text-xs font-medium text-red hover:underline"
                >
                  Clear filter
                </button>
              )}
            </div>
          </div>

          {/* User's existing review callout on this product if present */}
          {viewMode === "product" && myReviewForThisProduct && !editingReview && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-blue/20 bg-blue/5 p-4 sm:p-5">
              <div className="space-y-1">
                <span className="inline-flex items-center rounded-full bg-blue text-white text-xs font-medium px-2 py-0.5">
                  Your feedback on this product
                </span>
                <div className="flex items-center gap-1.5 text-sm text-dark font-medium">
                  <span>You rated this product</span>
                  <div className="inline-flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon
                        key={star}
                        filled={star <= myReviewForThisProduct.ratings}
                        className="w-3.5 h-3.5"
                      />
                    ))}
                  </div>
                  <span className="text-xs text-dark-4">
                    ({myReviewForThisProduct.ratings}/5)
                  </span>
                </div>
                {myReviewForThisProduct.title && (
                  <p className="text-xs text-gray-500 italic truncate max-w-md">
                    &ldquo;{myReviewForThisProduct.title}&rdquo;
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleStartEdit(myReviewForThisProduct)}
                  className="rounded-lg bg-blue px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-dark"
                >
                  Edit review
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingReview(myReviewForThisProduct)}
                  className="rounded-lg border border-red/30 px-3.5 py-1.5 text-xs font-semibold text-red transition hover:bg-red/10"
                >
                  Delete
                </button>
              </div>
            </div>
          )}

          {/* Reviews List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-xl border border-gray-2 bg-white p-6 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-2" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 rounded bg-gray-2" />
                      <div className="h-3 w-20 rounded bg-gray-2" />
                    </div>
                  </div>
                  <div className="h-4 w-3/4 rounded bg-gray-2" />
                  <div className="h-3 w-full rounded bg-gray-2" />
                </div>
              ))}
            </div>
          ) : displayedReviews.length > 0 ? (
            <>
              <div className="space-y-4">
                {displayedReviews.map((review) => {
                  const isOwner = myReviewIds.has(review.id);
                  return (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      isOwner={isOwner}
                      showProductName={viewMode !== "product"}
                      onEdit={isOwner ? handleStartEdit : undefined}
                      onDelete={isOwner ? (r) => setDeletingReview(r) : undefined}
                    />
                  );
                })}
              </div>

              {result && (
                <Pagination
                  page={page}
                  totalPages={result.totalPages}
                  onPageChange={setPage}
                />
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-3 bg-white p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue/10 text-blue">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-dark">
                {ratingFilter !== null
                  ? `No ${ratingFilter}-star reviews yet`
                  : viewMode === "mine"
                    ? "You haven't written any reviews yet"
                    : "No reviews for this product yet"}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {ratingFilter !== null
                  ? "Try selecting another star rating or reset the filter."
                  : viewMode === "mine"
                    ? "Submit your review for products you've purchased to see them here."
                    : "Be the first to share your experience with other customers!"}
              </p>
              {ratingFilter !== null ? (
                <button
                  type="button"
                  onClick={() => setRatingFilter(null)}
                  className="mt-4 inline-flex items-center rounded-lg bg-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-dark"
                >
                  View all reviews
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setReloadKey((k) => k + 1)}
                  className="mt-4 inline-flex items-center text-sm font-semibold text-blue hover:underline"
                >
                  Refresh reviews
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Write a Review or Edit Form */}
        <div ref={formRef} className="h-fit">
          <div
            className={`rounded-2xl bg-white p-6 shadow-1 transition-all sm:p-7 ${
              editingReview ? "ring-2 ring-blue" : "border border-gray-3"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue">
                  {editingReview ? "Update Review" : "Feedback"}
                </span>
                <h3 className="mt-1 text-xl font-bold text-dark sm:text-2xl">
                  {editingReview ? "Edit Your Review" : "Write a Review"}
                </h3>
                <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                  {editingReview
                    ? `Editing review for ${editingReview.product?.name || productName || "product"}`
                    : "Your honest rating helps others make informed purchases."}
                </p>
              </div>

              {editingReview && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded-lg border border-gray-3 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-1 hover:text-dark"
                >
                  Cancel edit
                </button>
              )}
            </div>

            {/* Authentication Prompt */}
            {!hasAccessToken() && (
              <div className="mt-5 rounded-xl border border-blue/20 bg-blue/5 p-4 text-sm text-gray-700">
                <p className="font-medium text-dark">Have you purchased this product?</p>
                <p className="mt-1 text-xs text-gray-500">
                  Please sign in to publish your customer review.
                </p>
                <Link
                  href="/signin"
                  className="mt-3 inline-flex items-center rounded-lg bg-blue px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-dark"
                >
                  Sign in to write a review
                </Link>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {/* Star Rating Picker */}
              <fieldset>
                <div className="flex items-center justify-between mb-2">
                  <legend className="text-sm font-semibold text-dark">
                    Your Rating <span className="text-red">*</span>
                  </legend>
                  <span className="text-xs font-medium text-[#FBBF24]">
                    {RATING_LABELS[activeRating] || `${activeRating} stars`}
                  </span>
                </div>

                <div
                  className="flex items-center gap-2"
                  role="radiogroup"
                  aria-label="Rating out of 5 stars"
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      role="radio"
                      aria-checked={ratings === star}
                      aria-label={`${star} star${star === 1 ? "" : "s"}`}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setRatings(star)}
                      className="p-1 transition-transform hover:scale-125 focus:outline-none"
                    >
                      <StarIcon
                        filled={star <= activeRating}
                        className="w-7 h-7 sm:w-8 sm:h-8"
                      />
                    </button>
                  ))}
                </div>
              </fieldset>

              {/* Review Title Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="review-title" className="text-sm font-semibold text-dark">
                    Review Title <span className="text-xs font-normal text-gray-400">(optional)</span>
                  </label>
                  <span className="text-xs text-gray-400">{titleValue.length}/255</span>
                </div>
                <input
                  id="review-title"
                  type="text"
                  name="title"
                  maxLength={255}
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  placeholder="Summarize your experience (e.g. Great build quality!)"
                  className="w-full rounded-xl border border-gray-3 px-4 py-3 text-sm text-dark placeholder:text-gray-4 outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/10"
                />
              </div>

              {/* Review Comment Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="review-comment" className="text-sm font-semibold text-dark">
                    Review Comment <span className="text-xs font-normal text-gray-400">(optional)</span>
                  </label>
                  <span className="text-xs text-gray-400">{commentValue.length}/5000</span>
                </div>
                <textarea
                  id="review-comment"
                  name="comment"
                  rows={4}
                  maxLength={5000}
                  value={commentValue}
                  onChange={(e) => setCommentValue(e.target.value)}
                  placeholder="What did you like or dislike about this product? How is the quality, performance, or value?"
                  className="w-full rounded-xl border border-gray-3 p-4 text-sm text-dark placeholder:text-gray-4 outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/10"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || productId <= 0}
                  className="w-full rounded-xl bg-blue py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting
                    ? editingReview
                      ? "Updating review…"
                      : "Submitting review…"
                    : editingReview
                      ? "Update review"
                      : "Submit review"}
                </button>

                {editingReview && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="w-full rounded-xl border border-gray-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-1"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Review Deletion (DELETE /api/v1/review/{id}) */}
      {deletingReview && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-9999 flex items-center justify-center bg-dark/60 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red/10 text-red">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <h4 className="mt-4 text-lg font-bold text-dark">Delete review?</h4>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to permanently delete this review? This action cannot be undone.
            </p>
            {deletingReview.title && (
              <p className="mt-3 rounded-lg bg-gray-1 p-3 text-xs italic text-gray-700">
                &ldquo;{deletingReview.title}&rdquo;
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingReview(null)}
                className="rounded-xl border border-gray-3 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-1"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="rounded-xl bg-red px-5 py-2 text-sm font-semibold text-white transition hover:bg-red/90 disabled:opacity-60"
              >
                {isDeleting ? "Deleting…" : "Delete review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ProductReviews;
