"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { returnsApi } from "@/lib/api/returns.api";
import { formatDate, formatPrice, getApiErrorMessage } from "@/lib/order-utils";
import { ReturnEligibilityResponse } from "@/types/return-api";

const REASONS = [
  "Wrong size / Does not fit",
  "Item is damaged or defective",
  "Item does not match description",
  "Received incorrect item",
  "Quality not as expected",
  "Changed my mind",
  "Other",
];

type RequestReturnModalProps = {
  orderNumber: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

/**
 * Clean, modern modal allowing customers to select items and quantities
 * to request a return for a delivered order.
 */
const RequestReturnModal: React.FC<RequestReturnModalProps> = ({
  orderNumber,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [eligibility, setEligibility] = useState<ReturnEligibilityResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setEligibility(null);
    setLoadError(null);
    setQuantities({});
    setReason("");
    setDetails("");
    setError(null);
    returnsApi
      .getEligibility(orderNumber)
      .then(setEligibility)
      .catch((err) => setLoadError(getApiErrorMessage(err, "Unable to load return eligibility.")));
  }, [isOpen, orderNumber]);

  if (!isOpen) return null;

  const selected = Object.entries(quantities).filter(([, quantity]) => quantity > 0);
  const selectedUnitsCount = selected.reduce((sum, [, q]) => sum + q, 0);

  const goodsValue = (eligibility?.items ?? []).reduce((sum, item) => {
    const qty = quantities[item.orderItemId] ?? 0;
    const price = item.unitPrice ?? 0;
    return sum + qty * price;
  }, 0);

  const submit = async () => {
    if (submitting) return;

    if (selected.length === 0) {
      setError("Please select at least one item to return.");
      return;
    }
    if (!reason.trim()) {
      setError("Please select a reason for returning the items.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const created = await returnsApi.requestReturn({
        orderNumber,
        reason: details.trim() ? `${reason.trim()}: ${details.trim()}` : reason.trim(),
        items: selected.map(([orderItemId, quantity]) => ({
          orderItemId: Number(orderItemId),
          quantity: Number(quantity),
        })),
      });
      const retNum = created?.returnNumber || "";
      toast.success(
        retNum
          ? `Return #${retNum} requested successfully! We'll review it shortly.`
          : "Return requested successfully."
      );
      onSuccess();
      onClose();
    } catch (err) {
      const message = getApiErrorMessage(err, "Unable to request this return.");
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="return-modal-title"
      className="fixed inset-0 z-[100000] flex items-center justify-center overflow-y-auto bg-black/60 p-4 sm:p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-3 p-5 sm:p-6">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 id="return-modal-title" className="text-lg sm:text-xl font-bold text-dark">
                Request Return
              </h2>
              <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue/10 text-blue">
                Order #{orderNumber}
              </span>
            </div>
            {eligibility?.returnableUntil && (
              <p className="mt-1 text-xs sm:text-sm text-gray-500">
                Returns accepted until{" "}
                <span className="font-medium text-dark">
                  {formatDate(eligibility.returnableUntil)}
                </span>
                . Shipping is non-refundable.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-1 hover:text-dark transition-colors"
            aria-label="Close dialog"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-5 flex-1">
          {/* Loading */}
          {!eligibility && !loadError && (
            <div className="py-16 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue border-r-transparent" />
              <p className="mt-3 text-sm text-gray-500">Checking return eligibility...</p>
            </div>
          )}

          {/* Load Error */}
          {loadError && (
            <div className="rounded-xl border border-red/30 bg-red-light-6 p-5 text-center text-red">
              <p className="text-sm font-medium">{loadError}</p>
              <button
                type="button"
                onClick={() => {
                  setLoadError(null);
                  setEligibility(null);
                  returnsApi
                    .getEligibility(orderNumber)
                    .then(setEligibility)
                    .catch((err) => setLoadError(getApiErrorMessage(err, "Unable to load return eligibility.")));
                }}
                className="mt-3 inline-block rounded-lg bg-red px-4 py-1.5 text-xs font-semibold text-white hover:bg-red/80 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Ineligible Order */}
          {eligibility && !eligibility.eligible && (
            <div className="rounded-xl border border-yellow/30 bg-yellow-light-2 p-5 text-yellow-dark">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Not Eligible for Return</span>
              </div>
              <p className="mt-1.5 text-xs text-gray-600">
                {eligibility.reason || "This order cannot be returned under our current return policy."}
              </p>
            </div>
          )}

          {/* Eligible Form */}
          {eligibility?.eligible && (
            <>
              {/* Item Selection Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-dark">
                    Select Items to Return
                  </h3>
                  <span className="text-xs font-semibold text-blue">
                    {selectedUnitsCount} {selectedUnitsCount === 1 ? "unit" : "units"} selected
                  </span>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {eligibility.items.map((item) => {
                    const max = item.returnableQuantity ?? item.quantity ?? 0;
                    const purchased = item.purchasedQuantity ?? max;
                    const value = quantities[item.orderItemId] ?? 0;
                    const isItemEligible = max > 0;
                    const isSelected = value > 0;

                    return (
                      <div
                        key={item.orderItemId}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                          isSelected
                            ? "border-blue bg-blue/5 shadow-xs"
                            : isItemEligible
                            ? "border-gray-3 bg-white hover:border-gray-4"
                            : "border-gray-2 bg-gray-1/60 opacity-60"
                        }`}
                      >
                        {/* Product Info */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-gray-3 bg-gray-1">
                            {item.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">
                                No img
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="truncate text-sm font-semibold text-dark">
                              {item.productName || `Item #${item.orderItemId}`}
                            </h4>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-gray-500">
                              {[item.color, item.sizeName].filter(Boolean).length > 0 && (
                                <span>{[item.color, item.sizeName].filter(Boolean).join(" / ")}</span>
                              )}
                              {item.unitPrice !== undefined && (
                                <span className="font-medium text-dark">{formatPrice(item.unitPrice)}</span>
                              )}
                            </div>
                            <p className="mt-0.5 text-[11px] text-gray-400">
                              Purchased: {purchased} &bull; Returnable: {max}
                              {purchased > max && (
                                <span className="text-amber-600 ml-1">
                                  ({purchased - max} already returned/pending)
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Quantity Selector */}
                        <div className="flex items-center justify-end shrink-0 sm:self-center">
                          {isItemEligible ? (
                            <label className="flex items-center gap-2 text-xs font-medium text-dark bg-gray-1 px-3 py-1.5 rounded-lg border border-gray-3">
                              <span className="text-gray-500">Return:</span>
                              <select
                                value={value}
                                disabled={submitting}
                                onChange={(e) =>
                                  setQuantities((current) => ({
                                    ...current,
                                    [item.orderItemId]: Number(e.target.value),
                                  }))
                                }
                                className="rounded-md border border-gray-3 bg-white px-2 py-1 text-xs font-bold text-dark outline-none focus:border-blue"
                              >
                                {Array.from({ length: max + 1 }, (_, n) => (
                                  <option key={n} value={n}>
                                    {n} {n === 0 ? "(None)" : ""}
                                  </option>
                                ))}
                              </select>
                              <span className="text-gray-400">/ {max}</span>
                            </label>
                          ) : (
                            <span className="rounded-md bg-gray-2 px-2.5 py-1 text-xs font-medium text-gray-500">
                              Not Returnable
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reason Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Return Reason <span className="text-red">*</span>
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={submitting}
                  className="w-full rounded-xl border border-gray-3 bg-white px-3.5 py-2.5 text-sm text-dark focus:border-blue outline-none transition"
                >
                  <option value="">-- Please select a reason --</option>
                  {REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Details Textarea */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Additional Details <span className="text-gray-400 font-normal lowercase">(optional)</span>
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  disabled={submitting}
                  rows={2}
                  maxLength={800}
                  placeholder="Provide any additional details or context for your return..."
                  className="w-full resize-y rounded-xl border border-gray-3 p-3 text-sm text-dark focus:border-blue outline-none transition"
                />
              </div>

              {/* Estimated Refund Summary */}
              {goodsValue > 0 && (
                <div className="rounded-xl border border-blue/20 bg-blue/5 p-4 text-xs text-gray-600">
                  <div className="flex items-center justify-between font-semibold text-dark text-sm mb-1">
                    <span>Selected: {selectedUnitsCount} {selectedUnitsCount === 1 ? "item" : "items"}</span>
                    <span>Estimated Goods Value: {formatPrice(goodsValue)}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    The definitive refund amount will be finalized after coupon adjustments and return inspection upon receipt.
                  </p>
                </div>
              )}
            </>
          )}

          {error && (
            <p className="rounded-lg bg-red-light-6 p-3 text-xs font-medium text-red border border-red/20">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-3 p-4 sm:p-5 bg-gray-1/50">
          <Link
            href={`/account/orders/${encodeURIComponent(orderNumber)}/return`}
            className="text-xs font-medium text-blue hover:underline"
            onClick={onClose}
          >
            Open Dedicated Return Page &rarr;
          </Link>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-gray-3 bg-white px-4 py-2 text-xs font-medium text-dark hover:bg-gray-1 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            {eligibility?.eligible && (
              <button
                type="button"
                onClick={submit}
                disabled={submitting || selected.length === 0 || !reason.trim()}
                className="rounded-lg bg-blue px-5 py-2 text-xs font-medium text-white hover:bg-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
              >
                {submitting ? "Submitting..." : `Submit Return Request (${selectedUnitsCount})`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestReturnModal;
