import { formatDate, formatPrice } from "@/lib/order-utils";
import { AvailableCoupon } from "@/types/order-api";

/** "10% off" or "$5.00 off". */
export const couponDiscountLabel = (coupon: AvailableCoupon) =>
  coupon.discountType === "FIXED"
    ? `${formatPrice(coupon.discountValue)} off`
    : `${Number(coupon.discountValue)}% off`;

/** "On orders over $50.00 · Ends Oct 30, 2026". */
export const couponTermsLabel = (coupon: AvailableCoupon) =>
  [
    coupon.minOrderAmount ? `On orders over ${formatPrice(coupon.minOrderAmount)}` : "No minimum",
    `Ends ${formatDate(coupon.expiryDate)}`,
  ].join(" · ");
