import Image from "next/image";
import { Review } from "@/types/review";

export type ReviewCardProps = {
  review: Review;
  isOwner?: boolean;
  onEdit?: (review: Review) => void;
  onDelete?: (review: Review) => void;
  showProductName?: boolean;
};

import StarIcon from "@/components/Common/StarIcon";

const ReviewCard = ({
  review,
  isOwner = false,
  onEdit,
  onDelete,
  showProductName = false,
}: ReviewCardProps) => {
  const roundedRating = Math.max(0, Math.min(5, Math.round(review.ratings)));
  const formattedDate = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  const isEdited =
    review.updatedAt &&
    review.createdAt &&
    new Date(review.updatedAt).getTime() - new Date(review.createdAt).getTime() > 60000;

  const initials = `${(review.user?.firstName?.[0] ?? "U").toUpperCase()}${(
    review.user?.lastName?.[0] ?? ""
  ).toUpperCase()}`;

  const fullName =
    [review.user?.firstName, review.user?.lastName].filter(Boolean).join(" ") ||
    "Customer";

  return (
    <article className="rounded-xl border border-gray-3 bg-white p-5 shadow-xs transition hover:shadow-md sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {review.user?.profileImage ? (
            <Image
              src={review.user.profileImage}
              alt={fullName}
              width={44}
              height={44}
              unoptimized
              className="h-11 w-11 rounded-full object-cover ring-2 ring-gray-2"
            />
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue/10 text-sm font-semibold text-blue ring-2 ring-blue/20">
              {initials}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-medium text-dark">{fullName}</p>
              {isOwner && (
                <span className="inline-flex items-center rounded-full bg-blue/10 px-2 py-0.5 text-xs font-medium text-blue">
                  Your review
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
              {formattedDate && <time dateTime={review.createdAt}>{formattedDate}</time>}
              {isEdited && <span className="text-gray-400">(edited)</span>}
              {showProductName && review.product?.name && (
                <span className="truncate text-blue">on {review.product.name}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-1"
            aria-label={`${review.ratings} out of 5 stars`}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon key={star} filled={star <= roundedRating} />
            ))}
            <span className="ml-1 text-xs font-semibold text-dark">
              {review.ratings}
              <span className="text-gray-400">/5</span>
            </span>
          </div>

          {(onEdit || onDelete) && isOwner && (
            <div className="flex items-center gap-2 border-l border-gray-3 pl-3">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(review)}
                  className="rounded p-1 text-gray-500 transition hover:bg-gray-1 hover:text-blue"
                  title="Edit review"
                  aria-label="Edit review"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(review)}
                  className="rounded p-1 text-gray-500 transition hover:bg-red/10 hover:text-red"
                  title="Delete review"
                  aria-label="Delete review"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {review.title && (
        <h3 className="mt-3.5 text-base font-semibold text-dark">{review.title}</h3>
      )}

      {review.comment && (
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
          {review.comment}
        </p>
      )}
    </article>
  );
};

export default ReviewCard;
