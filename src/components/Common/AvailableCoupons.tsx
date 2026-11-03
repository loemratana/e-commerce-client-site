"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { useAvailableCoupons } from "@/hooks/useAvailableCoupons";
import { couponDiscountLabel, couponTermsLabel } from "@/lib/coupon-utils";

/** Coupons the shopper can use now, with tap-to-copy codes; hidden when there are none. */
const AvailableCoupons = ({ max = 3 }: { max?: number }) => {
  const coupons = useAvailableCoupons();
  const [copied, setCopied] = useState<string | null>(null);

  if (coupons.length === 0) return null;

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      toast.success(`Copied ${code}. Use it at checkout.`);
    } catch {
      toast(`Use code ${code} at checkout.`);
    }
  };

  return (
    <div className="rounded-md border border-dashed border-blue/40 bg-blue-light-5/40 p-4">
      <p className="mb-3 font-medium text-dark">Available coupons</p>
      <ul className="flex flex-col gap-2.5">
        {coupons.slice(0, max).map((coupon) => (
          <li key={coupon.code} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-custom-sm text-dark">
                <span className="font-semibold">{couponDiscountLabel(coupon)}</span>{" "}
                <span className="text-dark-4">with</span>{" "}
                <span className="font-mono font-semibold tracking-wide text-blue">{coupon.code}</span>
              </p>
              <p className="text-custom-xs text-dark-4">{couponTermsLabel(coupon)}</p>
            </div>
            <button
              type="button"
              onClick={() => void copy(coupon.code)}
              className="shrink-0 rounded-md border border-blue px-3 py-1 text-custom-sm font-medium text-blue duration-200 hover:bg-blue hover:text-white"
            >
              {copied === coupon.code ? "Copied" : "Copy"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AvailableCoupons;
