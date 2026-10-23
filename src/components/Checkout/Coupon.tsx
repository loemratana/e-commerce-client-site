import React, { useState } from "react";
import { couponsApi } from "@/lib/api/coupons.api";
import { formatPrice, getApiErrorMessage } from "@/lib/order-utils";
import { CouponResponse } from "@/types/order-api";

type Props = {
  orderAmount: number;
  appliedCoupon: CouponResponse | null;
  onApply: (coupon: CouponResponse) => void;
  onRemove: () => void;
};

const Coupon = ({ orderAmount, appliedCoupon, onApply, onRemove }: Props) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const handleApply = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;

    setIsChecking(true);
    setError(null);
    try {
      onApply(await couponsApi.validate(trimmed, orderAmount));
      setCode("");
    } catch (err) {
      setError(getApiErrorMessage(err, "This coupon can't be applied."));
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="bg-white shadow-1 rounded-[10px] mt-7.5">
      <div className="border-b border-gray-3 py-5 px-4 sm:px-8.5">
        <h3 className="font-medium text-xl text-dark">Have any Coupon Code?</h3>
      </div>

      <div className="py-8 px-4 sm:px-8.5">
        {appliedCoupon ? (
          <div className="flex items-center justify-between gap-4 rounded-md bg-green-light-6 py-3 px-5">
            <p className="text-green">
              <span className="font-medium">{appliedCoupon.code}</span> applied
              {appliedCoupon.discountAmount != null &&
                ` (−${formatPrice(appliedCoupon.discountAmount)})`}
            </p>
            <button
              type="button"
              onClick={onRemove}
              className="text-custom-sm text-dark-4 hover:text-red"
            >
              Remove
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-4">
              <input
                type="text"
                id="coupon"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => {
                  // Enter would otherwise submit the whole checkout form
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleApply();
                  }
                }}
                placeholder="Enter coupon code"
                maxLength={50}
                className="rounded-md border border-gray-3 bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20"
              />

              <button
                type="button"
                onClick={handleApply}
                disabled={isChecking || !code.trim()}
                className="inline-flex font-medium text-white bg-blue py-3 px-6 rounded-md ease-out duration-200 hover:bg-blue-dark disabled:opacity-60"
              >
                {isChecking ? "Checking…" : "Apply"}
              </button>
            </div>
            {error && <p className="mt-3 text-custom-sm text-red">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
};

export default Coupon;
