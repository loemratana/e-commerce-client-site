"use client";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { returnsApi } from "@/lib/api/returns.api";
import { ordersApi } from "@/lib/api/orders.api";
import { ReturnEligibilityResponse } from "@/types/return-api";
import { OrderResponse } from "@/types/order-api";
import Breadcrumb from "@/components/Common/Breadcrumb";
import { formatDate, formatPrice, getApiErrorMessage } from "@/lib/order-utils";
import { hasAccessToken, requestAuthentication } from "@/lib/auth-prompt";

type ReturnRequestFormProps = {
  orderNumber: string;
};

const COMMON_REASONS = [
  "Wrong size / Does not fit",
  "Item is damaged or defective",
  "Item does not match description",
  "Received incorrect item",
  "Quality not as expected",
  "Changed my mind",
  "Other",
];

interface EnrichedReturnItem {
  orderItemId: number;
  productName: string;
  sku: string;
  color: string | null;
  sizeName: string | null;
  imageUrl: string | null;
  unitPrice: number;
  purchasedQuantity: number;
  returnableQuantity: number;
  eligible: boolean;
}

const ReturnRequestForm: React.FC<ReturnRequestFormProps> = ({
  orderNumber,
}) => {
  const router = useRouter();

  // Wizard step: 1 (Eligibility & Item Selection), 2 (Reason & Review)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Data states
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [eligibility, setEligibility] =
    useState<ReturnEligibilityResponse | null>(null);
  const [enrichedItems, setEnrichedItems] = useState<EnrichedReturnItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form states
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [reasonDetails, setReasonDetails] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!hasAccessToken()) {
      requestAuthentication();
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    try {
      const [orderData, eligibilityData] = await Promise.all([
        ordersApi.getMyOrder(orderNumber),
        returnsApi.getEligibility(orderNumber),
      ]);

      setOrder(orderData);
      setEligibility(eligibilityData);

      // Map order items with eligibility quantity limits
      const itemsMap = new Map<number, number>();
      (eligibilityData.items ?? []).forEach((elItem) => {
        const qty =
          elItem.quantity ?? elItem.returnableQuantity ?? 0;
        itemsMap.set(elItem.orderItemId, qty);
      });

      const enriched: EnrichedReturnItem[] = (orderData.items ?? []).map(
        (orderItem) => {
          const returnableQty = itemsMap.get(orderItem.id) ?? 0;
          return {
            orderItemId: orderItem.id,
            productName: orderItem.productName,
            sku: orderItem.sku,
            color: orderItem.color,
            sizeName: orderItem.sizeName,
            imageUrl: orderItem.imageUrl,
            unitPrice: orderItem.priceAfterDiscount ?? orderItem.price,
            purchasedQuantity: orderItem.quantity,
            returnableQuantity: returnableQty,
            eligible: returnableQty > 0 && eligibilityData.eligible,
          };
        }
      );

      setEnrichedItems(enriched);
    } catch (err) {
      setLoadError(
        getApiErrorMessage(
          err,
          "Unable to check return eligibility for this order."
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    if (orderNumber) {
      loadData();
    }
  }, [orderNumber, loadData]);

  // Selected items calculations
  const selectedItems = Object.entries(quantities)
    .filter(([, qty]) => qty > 0)
    .map(([orderItemIdStr, qty]) => {
      const orderItemId = Number(orderItemIdStr);
      const item = enrichedItems.find((i) => i.orderItemId === orderItemId);
      return {
        orderItemId,
        quantity: qty,
        item,
      };
    });

  const totalSelectedUnits = selectedItems.reduce(
    (sum, cur) => sum + cur.quantity,
    0
  );

  const rawGoodsEstimate = selectedItems.reduce((sum, cur) => {
    const price = cur.item?.unitPrice ?? 0;
    return sum + price * cur.quantity;
  }, 0);

  const handleQuantityChange = (orderItemId: number, value: number) => {
    const item = enrichedItems.find((i) => i.orderItemId === orderItemId);
    const maxQty = item?.returnableQuantity ?? 0;
    const sanitized = Math.max(0, Math.min(value, maxQty));

    setQuantities((prev) => ({
      ...prev,
      [orderItemId]: sanitized,
    }));
  };

  const handleNextToStep2 = () => {
    if (totalSelectedUnits === 0) {
      setFormError("Please select at least one item and quantity to return.");
      return;
    }
    setFormError(null);
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToStep1 = () => {
    setFormError(null);
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (totalSelectedUnits === 0) {
      setFormError("Please select at least one item to return.");
      return;
    }

    if (!selectedReason) {
      setFormError("Please choose a reason for returning the items.");
      return;
    }

    const fullReason = reasonDetails.trim()
      ? `${selectedReason}: ${reasonDetails.trim()}`
      : selectedReason;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const createdReturn = await returnsApi.requestReturn({
        orderNumber,
        reason: fullReason,
        items: selectedItems.map((sel) => ({
          orderItemId: sel.orderItemId,
          quantity: sel.quantity,
        })),
      });

      toast.success(
        `Return #${createdReturn.returnNumber} requested successfully!`
      );

      // Navigate to created return details if returnNumber is available
      if (createdReturn.returnNumber) {
        router.push(
          `/account/returns/${encodeURIComponent(createdReturn.returnNumber)}`
        );
      } else {
        router.push("/account/returns");
      }
    } catch (err) {
      const msg = getApiErrorMessage(
        err,
        "Failed to submit return request. Please try again."
      );
      setFormError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalReturnableUnits = enrichedItems.reduce(
    (sum, i) => sum + i.returnableQuantity,
    0
  );

  return (
    <>
      <Breadcrumb
        title="Request Return"
        pages={["My Account", `Order #${orderNumber}`, "Return Request"]}
      />

      <section className="bg-gray-2 py-10 sm:py-14 lg:py-18">
        <div className="mx-auto w-full max-w-[960px] px-4 sm:px-8 xl:px-0">
          {/* Back link */}
          <div className="mb-6">
            <Link
              href={`/orders/${encodeURIComponent(orderNumber)}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue transition-colors"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Order Details
            </Link>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="rounded-2xl bg-white p-16 text-center shadow-1">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-blue border-r-transparent" />
              <p className="mt-4 text-sm font-medium text-gray-500">
                Checking return eligibility for order #{orderNumber}…
              </p>
            </div>
          )}

          {/* Error loading */}
          {!isLoading && loadError && (
            <div className="rounded-2xl bg-white p-10 text-center shadow-1">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-light-6 text-red">
                <svg
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-dark">
                Unable to Load Order
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
                {loadError}
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => loadData()}
                  className="rounded-lg bg-blue px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-dark transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Ineligible Order State */}
          {!isLoading && !loadError && eligibility && !eligibility.eligible && (
            <div className="rounded-2xl bg-white p-8 sm:p-12 text-center shadow-1">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-light-2 text-yellow-dark">
                <svg
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-dark">
                This Order is Not Eligible for Return
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm text-gray-600">
                {eligibility.reason ||
                  "This order cannot be returned according to our return policy."}
              </p>
              {eligibility.returnableUntil && (
                <p className="mt-2 text-xs text-gray-500">
                  Return window expired on {formatDate(eligibility.returnableUntil)}.
                </p>
              )}
              <div className="mt-6 flex justify-center gap-3">
                <Link
                  href={`/orders/${encodeURIComponent(orderNumber)}`}
                  className="rounded-lg border border-gray-3 bg-white px-5 py-2.5 text-sm font-medium text-dark hover:bg-gray-1 transition-colors"
                >
                  View Order Details
                </Link>
                <Link
                  href="/account/returns"
                  className="rounded-lg bg-blue px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-dark transition-colors"
                >
                  My Returns
                </Link>
              </div>
            </div>
          )}

          {/* All items already returned */}
          {!isLoading &&
            !loadError &&
            eligibility?.eligible &&
            totalReturnableUnits === 0 && (
              <div className="rounded-2xl bg-white p-8 sm:p-12 text-center shadow-1">
                <h2 className="text-xl font-bold text-dark">
                  No Returnable Items Remaining
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
                  All items from Order #{orderNumber} have already been returned
                  or have active return requests pending.
                </p>
                <div className="mt-6">
                  <Link
                    href={`/orders/${encodeURIComponent(orderNumber)}`}
                    className="rounded-lg bg-blue px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-dark transition-colors"
                  >
                    View Order Returns
                  </Link>
                </div>
              </div>
            )}

          {/* Eligible Form Workflow */}
          {!isLoading &&
            !loadError &&
            eligibility?.eligible &&
            totalReturnableUnits > 0 && (
              <div className="space-y-6">
                {/* Stepper Header */}
                <div className="rounded-2xl bg-white p-6 shadow-1 sm:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-3 pb-6">
                    <div>
                      <h1 className="text-2xl font-bold text-dark sm:text-3xl">
                        Request a Return
                      </h1>
                      <p className="mt-1 text-sm text-gray-500">
                        Order #{orderNumber}
                        {eligibility.returnableUntil && (
                          <span>
                            {" "}
                            &bull; Return window closes on{" "}
                            <strong className="text-dark font-medium">
                              {formatDate(eligibility.returnableUntil)}
                            </strong>
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Step Indicators */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                          currentStep === 1
                            ? "bg-blue text-white"
                            : "bg-green text-white"
                        }`}
                      >
                        {currentStep > 1 ? "✓" : "1"}
                      </div>
                      <span className="text-xs font-medium text-dark">
                        Select Items
                      </span>
                      <span className="h-px w-6 bg-gray-3" />
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                          currentStep === 2
                            ? "bg-blue text-white"
                            : "bg-gray-2 text-gray-500"
                        }`}
                      >
                        2
                      </div>
                      <span className="text-xs font-medium text-dark">
                        Reason & Review
                      </span>
                    </div>
                  </div>

                  {formError && (
                    <div className="mt-4 rounded-lg bg-red-light-6 p-4 text-sm text-red">
                      {formError}
                    </div>
                  )}

                  {/* STEP 1: Select Items */}
                  {currentStep === 1 && (
                    <div className="mt-6">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <h2 className="text-base font-bold text-dark">
                            Select Items to Return
                          </h2>
                          <p className="text-xs text-gray-500">
                            Choose which items and the quantities you would like
                            to return.
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-blue">
                          {totalSelectedUnits} item{totalSelectedUnits === 1 ? "" : "s"} selected
                        </span>
                      </div>

                      <div className="divide-y divide-gray-3 rounded-xl border border-gray-3">
                        {enrichedItems.map((item) => {
                          const selectedQty = quantities[item.orderItemId] ?? 0;
                          const isEligible = item.returnableQuantity > 0;

                          return (
                            <div
                              key={item.orderItemId}
                              className={`flex flex-col gap-4 p-4 transition sm:flex-row sm:items-center sm:justify-between ${
                                !isEligible
                                  ? "bg-gray-1/70 opacity-60"
                                  : selectedQty > 0
                                  ? "bg-blue-light-5/20"
                                  : "bg-white"
                              }`}
                            >
                              {/* Product Info */}
                              <div className="flex items-center gap-4 min-w-0 flex-1">
                                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-3 bg-white">
                                  {item.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={item.imageUrl}
                                      alt={item.productName}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                                      No img
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="truncate text-sm font-semibold text-dark">
                                    {item.productName}
                                  </h4>
                                  <p className="text-xs text-gray-500">
                                    {[item.color, item.sizeName]
                                      .filter(Boolean)
                                      .join(" / ") || "Standard variant"}
                                    {item.sku ? ` · SKU: ${item.sku}` : ""}
                                  </p>
                                  <p className="mt-1 text-xs text-gray-500">
                                    Unit Price:{" "}
                                    <span className="font-medium text-dark">
                                      {formatPrice(item.unitPrice)}
                                    </span>
                                  </p>
                                  <p className="text-2xs text-gray-400">
                                    Ordered: {item.purchasedQuantity} &bull; Returnable:{" "}
                                    {item.returnableQuantity}
                                    {item.purchasedQuantity >
                                      item.returnableQuantity && (
                                      <span className="text-yellow-dark ml-1">
                                        ({item.purchasedQuantity - item.returnableQuantity} already requested/returned)
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>

                              {/* Quantity Selector */}
                              <div className="flex items-center justify-end gap-3 sm:w-44">
                                {isEligible ? (
                                  <label className="flex items-center gap-2 text-xs text-gray-600">
                                    <span className="text-xs font-medium text-dark">
                                      Return:
                                    </span>
                                    <select
                                      value={selectedQty}
                                      onChange={(e) =>
                                        handleQuantityChange(
                                          item.orderItemId,
                                          Number(e.target.value)
                                        )
                                      }
                                      className="rounded-lg border border-gray-3 bg-white px-3 py-1.5 text-sm font-semibold text-dark outline-none focus:border-blue"
                                    >
                                      {Array.from(
                                        { length: item.returnableQuantity + 1 },
                                        (_, idx) => (
                                          <option key={idx} value={idx}>
                                            {idx} {idx === 0 ? "(None)" : ""}
                                          </option>
                                        )
                                      )}
                                    </select>
                                    <span className="text-gray-400">
                                      / {item.returnableQuantity}
                                    </span>
                                  </label>
                                ) : (
                                  <span className="rounded bg-gray-2 px-2.5 py-1 text-2xs font-semibold text-gray-500">
                                    Not Returnable
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Step 1 Actions */}
                      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-gray-3 pt-6">
                        <div className="text-sm">
                          {totalSelectedUnits > 0 ? (
                            <p className="text-gray-600">
                              Selected {totalSelectedUnits} item
                              {totalSelectedUnits === 1 ? "" : "s"} worth approx.{" "}
                              <strong className="text-dark">
                                {formatPrice(rawGoodsEstimate)}
                              </strong>
                            </p>
                          ) : (
                            <p className="text-xs text-gray-400">
                              Select at least one item to proceed.
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          disabled={totalSelectedUnits === 0}
                          onClick={handleNextToStep2}
                          className="rounded-lg bg-blue px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-dark transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Continue to Reason & Review &rarr;
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: Reason, Review & Submit */}
                  {currentStep === 2 && (
                    <form onSubmit={handleSubmitReturn} className="mt-6">
                      {/* Selected Items Review */}
                      <div>
                        <h2 className="text-base font-bold text-dark mb-3">
                          1. Selected Items ({selectedItems.length})
                        </h2>
                        <div className="divide-y divide-gray-3 rounded-xl border border-gray-3 bg-gray-1 p-3">
                          {selectedItems.map((sel) => (
                            <div
                              key={sel.orderItemId}
                              className="flex items-center justify-between py-2 text-sm"
                            >
                              <div className="min-w-0 pr-4">
                                <p className="font-semibold text-dark truncate">
                                  {sel.item?.productName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {[sel.item?.color, sel.item?.sizeName]
                                    .filter(Boolean)
                                    .join(" / ") || "Standard"}
                                </p>
                              </div>
                              <div className="text-right text-xs">
                                <span className="font-bold text-dark">
                                  {sel.quantity} × {formatPrice(sel.item?.unitPrice)}
                                </span>
                                <p className="text-gray-500">
                                  {formatPrice(
                                    (sel.item?.unitPrice ?? 0) * sel.quantity
                                  )}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Reason Selection */}
                      <div className="mt-6">
                        <h2 className="text-base font-bold text-dark mb-3">
                          2. Return Reason <span className="text-red">*</span>
                        </h2>

                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                          Select the primary reason
                        </label>
                        <select
                          required
                          value={selectedReason}
                          onChange={(e) => setSelectedReason(e.target.value)}
                          className="w-full rounded-lg border border-gray-3 bg-white px-4 py-2.5 text-sm text-dark outline-none focus:border-blue"
                        >
                          <option value="">-- Please select a reason --</option>
                          {COMMON_REASONS.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>

                        <label className="block mt-4 text-xs font-semibold text-gray-600 mb-1.5">
                          Additional details (optional)
                        </label>
                        <textarea
                          rows={3}
                          maxLength={800}
                          value={reasonDetails}
                          onChange={(e) => setReasonDetails(e.target.value)}
                          placeholder="Provide any additional context regarding your return request…"
                          className="w-full rounded-lg border border-gray-3 bg-white p-3 text-sm text-dark outline-none focus:border-blue"
                        />
                      </div>

                      {/* Summary & Refund Notice */}
                      <div className="mt-6 rounded-xl border border-gray-3 bg-gray-1 p-5">
                        <h3 className="text-sm font-bold text-dark mb-2">
                          Refund Information & Terms
                        </h3>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          Items value:{" "}
                          <strong className="text-dark font-semibold">
                            {formatPrice(rawGoodsEstimate)}
                          </strong>
                          . The definitive refund amount will be calculated by our
                          system after applying any active promotional coupons and
                          tax adjustments. Refunds are credited upon receipt and
                          inspection.
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-gray-3 pt-6">
                        <button
                          type="button"
                          onClick={handleBackToStep1}
                          disabled={isSubmitting}
                          className="rounded-lg border border-gray-3 bg-white px-5 py-2.5 text-sm font-medium text-dark hover:bg-gray-1 transition-colors"
                        >
                          &larr; Back to Item Selection
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting || !selectedReason}
                          className="rounded-lg bg-blue px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-dark transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isSubmitting ? "Submitting…" : "Confirm & Submit Return"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}
        </div>
      </section>
    </>
  );
};

export default ReturnRequestForm;
