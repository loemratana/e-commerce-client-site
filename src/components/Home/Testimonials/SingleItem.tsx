import React from "react";
import { Review } from "@/types/review";
import Image from "next/image";
import StarIcon from "@/components/Common/StarIcon";

const FALLBACK_AVATAR = "/images/users/user-01.jpg";

const SingleItem = ({ review }: { review: Review }) => {
  const authorName =
    `${review.user?.firstName ?? ""} ${review.user?.lastName ?? ""}`.trim() ||
    "Anonymous";
  const rating = Math.round(review.ratings);

  return (
    <div className="shadow-testimonial bg-white rounded-[10px] py-7.5 px-4 sm:px-8.5 m-1 h-full flex flex-col">
      <div
        className="flex items-center gap-1 mb-5"
        aria-label={`Rated ${rating} out of 5`}
      >
        {Array.from({ length: 5 }).map((_, index) => (
          <StarIcon key={index} filled={index < rating} size={15} />
        ))}
      </div>

      {review.title && (
        <h4 className="font-medium text-dark mb-2">{review.title}</h4>
      )}
      <p className="text-dark mb-6 line-clamp-4 flex-1">{review.comment}</p>

      <div className="flex items-center gap-4">
        <div className="w-12.5 h-12.5 shrink-0 rounded-full overflow-hidden">
          <Image
            src={review.user?.profileImage || FALLBACK_AVATAR}
            alt={authorName}
            className="w-12.5 h-12.5 rounded-full object-cover"
            width={50}
            height={50}
            unoptimized
          />
        </div>

        <div className="min-w-0">
          <h3 className="font-medium text-dark">{authorName}</h3>
          <p className="text-custom-sm truncate">{review.product?.name}</p>
        </div>
      </div>
    </div>
  );
};

export default SingleItem;
