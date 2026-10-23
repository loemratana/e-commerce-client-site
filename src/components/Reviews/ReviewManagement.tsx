"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
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

const PAGE_SIZE = 10;

const ReviewManagement = () => {
  const [view, setView] = useState<"mine" | "all">("mine");
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<ReviewPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const loadReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      setResult(
        view === "mine"
          ? await reviewsApi.getMine(page, PAGE_SIZE)
          : await reviewsApi.getAll(page, PAGE_SIZE)
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearAuthTokens();
        requestAuthentication();
      }
      toast.error(
        error instanceof Error ? error.message : "Unable to load reviews."
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, view]);

  useEffect(() => {
    if (hasAccessToken()) void loadReviews();
    else {
      requestAuthentication();
      setIsLoading(false);
    }
  }, [loadReviews, reloadKey]);

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingReview) return;

    const formData = new FormData(event.currentTarget);
    const request: ReviewRequest = {
      title: String(formData.get("title") ?? "").trim(),
      ratings: editRating,
      comment: String(formData.get("comment") ?? "").trim(),
    };
    setIsSubmitting(true);
    try {
      await reviewsApi.update(editingReview.id, request);
      setEditingReview(null);
      toast.success("Review updated.");
      setReloadKey((key) => key + 1);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearAuthTokens();
        requestAuthentication();
      }
      toast.error(
        error instanceof Error ? error.message : "Unable to update review."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (review: Review) => {
    if (!window.confirm("Delete this review? This action cannot be undone.")) {
      return;
    }
    try {
      await reviewsApi.delete(review.id);
      toast.success("Review deleted.");
      setReloadKey((key) => key + 1);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearAuthTokens();
        requestAuthentication();
      }
      toast.error(
        error instanceof Error ? error.message : "Unable to delete review."
      );
    }
  };

  return (
    <section className="rounded-xl bg-white p-5 shadow-1 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-dark">Reviews</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your reviews or browse customer feedback.
          </p>
        </div>
        <div className="flex rounded-lg bg-gray-1 p-1">
          {(["mine", "all"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setView(value);
                setPage(0);
                setEditingReview(null);
              }}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                view === value ? "bg-white text-blue shadow-sm" : "text-gray-600"
              }`}
            >
              {value === "mine" ? "My reviews" : "All reviews"}
            </button>
          ))}
        </div>
      </div>

      {editingReview && (
        <form
          key={editingReview.id}
          onSubmit={handleUpdate}
          className="mt-6 space-y-4 rounded-xl border border-blue/20 bg-blue/5 p-5"
        >
          <h3 className="font-medium text-dark">Edit your review</h3>
          <div>
            <span className="mb-2 block text-sm font-medium text-dark">
              Rating
            </span>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  aria-label={`Rate ${rating} stars`}
                  aria-pressed={editRating === rating}
                  onClick={() => setEditRating(rating)}
                  className="p-1 transition-transform hover:scale-125 focus:outline-none"
                >
                  <StarIcon
                    filled={rating <= editRating}
                    className="w-6 h-6"
                  />
                </button>
              ))}
            </div>
          </div>
          <label className="block text-sm font-medium text-dark">
            Title
            <input
              name="title"
              defaultValue={editingReview.title ?? ""}
              maxLength={255}
              className="mt-2 w-full rounded-lg border border-gray-3 px-4 py-3"
            />
          </label>
          <label className="block text-sm font-medium text-dark">
            Comment
            <textarea
              name="comment"
              defaultValue={editingReview.comment ?? ""}
              maxLength={5000}
              rows={4}
              className="mt-2 w-full rounded-lg border border-gray-3 px-4 py-3"
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-blue px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {isSubmitting ? "Saving…" : "Save review"}
            </button>
            <button
              type="button"
              onClick={() => setEditingReview(null)}
              className="rounded-lg border border-gray-3 px-5 py-2.5 text-sm font-medium text-dark"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 space-y-4">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-gray-600">
            Loading reviews…
          </p>
        ) : result?.content.length ? (
          result.content.map((review) => (
            <div key={review.id} className="space-y-3">
              <ReviewCard
                review={review}
                isOwner={view === "mine"}
                showProductName={view === "all"}
                onEdit={
                  view === "mine"
                    ? (rev) => {
                        setEditingReview(rev);
                        setEditRating(rev.ratings);
                      }
                    : undefined
                }
                onDelete={
                  view === "mine"
                    ? (rev) => void handleDelete(rev)
                    : undefined
                }
              />
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-gray-3 p-8 text-center">
            <p className="font-medium text-dark">
              {result === null
                ? "Unable to load reviews."
                : view === "mine"
                  ? "You have not written any reviews yet."
                  : "There are no reviews yet."}
            </p>
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="mt-3 text-sm font-medium text-blue hover:underline"
            >
              Try again
            </button>
          </div>
        )}
      </div>

      {result && (
        <div className="mt-6">
          <Pagination
            page={page}
            totalPages={result.totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </section>
  );
};

export default ReviewManagement;
