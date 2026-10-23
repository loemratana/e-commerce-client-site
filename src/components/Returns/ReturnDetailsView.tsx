"use client";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { returnsApi } from "@/lib/api/returns.api";
import { ReturnResponse } from "@/types/return-api";
import ReturnStatusBadge from "./ReturnStatusBadge";
import CancelReturnModal from "./CancelReturnModal";
import Breadcrumb from "@/components/Common/Breadcrumb";
import {
  canCancelReturn,
  RETURN_STAGE_DESCRIPTIONS,
} from "@/lib/return-utils";
import {
  formatDate,
  formatDateTime,
  formatPrice,
  getApiErrorMessage,
} from "@/lib/order-utils";
import { hasAccessToken, requestAuthentication } from "@/lib/auth-prompt";

type ReturnDetailsViewProps = {
  returnNumber: string;
};

const ReturnDetailsView: React.FC<ReturnDetailsViewProps> = ({
  returnNumber,
}) => {
  const router = useRouter();
  const [returnRecord, setReturnRecord] = useState<ReturnResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const fetchReturnDetails = useCallback(async () => {
    if (!hasAccessToken()) {
      requestAuthentication();
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await returnsApi.getByReturnNumber(returnNumber);
      setReturnRecord(data);
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to load this return request. It may not exist or belong to another account."
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [returnNumber]);

  useEffect(() => {
    if (returnNumber) {
      fetchReturnDetails();
    }
  }, [returnNumber, fetchReturnDetails]);

  return (
    <>
      <Breadcrumb
        title="Return Details"
        pages={["My Account", "My Returns", `Return #${returnNumber}`]}
      />

      <section className="bg-gray-2 py-10 sm:py-14 lg:py-18">
        <div className="site-container">
          {/* Back Navigation Bar */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/account/returns"
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
              Back to My Returns
            </Link>

            {returnRecord && (
              <Link
                href={`/orders/${encodeURIComponent(returnRecord.orderNumber)}`}
                className="text-xs font-semibold text-blue hover:underline"
              >
                View Order #{returnRecord.orderNumber} &rarr;
              </Link>
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="rounded-2xl bg-white p-16 text-center shadow-1">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-blue border-r-transparent" />
              <p className="mt-4 text-sm font-medium text-gray-500">
                Loading return details…
              </p>
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div className="rounded-2xl bg-white p-12 text-center shadow-1">
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
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-dark">
                Return Not Found or Inaccessible
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
                {error}
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fetchReturnDetails()}
                  className="rounded-lg bg-blue px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-dark transition-colors"
                >
                  Try Again
                </button>
                <Link
                  href="/account/returns"
                  className="rounded-lg border border-gray-3 bg-white px-5 py-2.5 text-sm font-medium text-dark hover:bg-gray-1 transition-colors"
                >
                  Back to Returns
                </Link>
              </div>
            </div>
          )}

          {/* Details Content */}
          {!isLoading && !error && returnRecord && (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="rounded-2xl bg-white p-6 shadow-1 sm:p-8">
                <div className="flex flex-col gap-4 border-b border-gray-3 pb-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="text-2xl font-bold text-dark sm:text-3xl">
                        Return #{returnRecord.returnNumber}
                      </h1>
                      <ReturnStatusBadge status={returnRecord.status} />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Requested on {formatDateTime(returnRecord.createdAt)}
                      {returnRecord.updatedAt && (
                        <span>
                          {" "}
                          &bull; Last updated{" "}
                          {formatDateTime(returnRecord.updatedAt)}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    {canCancelReturn(returnRecord.status) && (
                      <button
                        type="button"
                        onClick={() => setIsCancelModalOpen(true)}
                        className="rounded-lg border border-red px-4 py-2 text-sm font-medium text-red hover:bg-red hover:text-white transition-colors"
                      >
                        Cancel Return
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Guidance Banner */}
                <div className="mt-6 rounded-xl border border-gray-3 bg-gray-1 p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Return Lifecycle Status
                  </h3>
                  <p className="mt-1.5 text-sm font-medium text-dark">
                    {RETURN_STAGE_DESCRIPTIONS[returnRecord.status] ||
                      "Status update pending."}
                  </p>
                </div>

                {/* Timeline Events supported by backend data */}
                <div className="mt-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
                    Activity Timeline
                  </h3>
                  <div className="relative pl-6 border-l-2 border-gray-3 space-y-6">
                    {/* Event 1: Created */}
                    <div className="relative">
                      <span className="absolute -left-[31px] top-0.5 flex h-4 w-4 rounded-full bg-blue ring-4 ring-white" />
                      <p className="text-sm font-semibold text-dark">
                        Return Requested
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDateTime(returnRecord.createdAt)}
                      </p>
                      <p className="mt-1 text-xs text-gray-600">
                        Customer submitted request: {returnRecord.reason}
                      </p>
                    </div>

                    {/* Event 2: Reviewed / Approved / Rejected */}
                    {(returnRecord.status === "APPROVED" ||
                      returnRecord.status === "REJECTED" ||
                      returnRecord.status === "RECEIVED") && (
                      <div className="relative">
                        <span
                          className={`absolute -left-[31px] top-0.5 flex h-4 w-4 rounded-full ring-4 ring-white ${
                            returnRecord.status === "REJECTED"
                              ? "bg-red"
                              : "bg-blue"
                          }`}
                        />
                        <p className="text-sm font-semibold text-dark">
                          {returnRecord.status === "REJECTED"
                            ? "Return Rejected"
                            : "Return Approved"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(returnRecord.updatedAt)}
                        </p>
                        {returnRecord.adminNote && (
                          <p className="mt-1 text-xs text-gray-600">
                            <strong>Store Note:</strong> {returnRecord.adminNote}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Event 3: Received / Refund Processed */}
                    {returnRecord.receivedAt && (
                      <div className="relative">
                        <span className="absolute -left-[31px] top-0.5 flex h-4 w-4 rounded-full bg-green ring-4 ring-white" />
                        <p className="text-sm font-semibold text-dark">
                          Items Received by Store
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(returnRecord.receivedAt)}
                        </p>
                        {returnRecord.refundAmount !== null && (
                          <p className="mt-1 text-xs font-medium text-green">
                            Refunded to your original payment method: {formatPrice(returnRecord.refundAmount)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Event 4: Cancelled */}
                    {returnRecord.status === "CANCELLED" && (
                      <div className="relative">
                        <span className="absolute -left-[31px] top-0.5 flex h-4 w-4 rounded-full bg-gray-500 ring-4 ring-white" />
                        <p className="text-sm font-semibold text-dark">
                          Return Cancelled
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(returnRecord.updatedAt)}
                        </p>
                        <p className="mt-1 text-xs text-gray-600">
                          This return was cancelled by the customer.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Card */}
              <div className="rounded-2xl bg-white p-6 shadow-1 sm:p-8">
                <h2 className="text-lg font-bold text-dark mb-4">
                  Returned Items ({returnRecord.items.length})
                </h2>

                <div className="divide-y divide-gray-3 border-y border-gray-3">
                  {returnRecord.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4"
                    >
                      <div className="flex items-center gap-4">
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
                              No image
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-dark">
                            {item.productName}
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {[item.color, item.sizeName].filter(Boolean).join(" / ") ||
                              "Default variant"}
                          </p>
                          {item.sku && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              SKU: {item.sku}
                            </p>
                          )}
                          {item.condition && (
                            <span className="mt-1 inline-block rounded bg-gray-2 px-2 py-0.5 text-2xs font-semibold uppercase text-gray-700">
                              Condition: {item.condition}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-end justify-between sm:justify-center text-right">
                        <span className="text-xs text-gray-500">
                          Quantity: <strong className="text-dark font-semibold">{item.quantity}</strong>
                        </span>
                        <span className="text-xs text-gray-500 mt-0.5">
                          Unit price: {formatPrice(item.unitPrice)}
                        </span>
                        <span className="text-sm font-bold text-dark mt-1">
                          Subtotal: {formatPrice(item.unitPrice * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Information & Refund Summary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Return Information Card */}
                <div className="rounded-2xl bg-white p-6 shadow-1 sm:p-8">
                  <h3 className="text-base font-bold text-dark mb-4">
                    Return Information
                  </h3>
                  <dl className="space-y-3.5 text-sm">
                    <div>
                      <dt className="text-xs text-gray-500">Customer Reason</dt>
                      <dd className="mt-0.5 font-medium text-dark">
                        {returnRecord.reason}
                      </dd>
                    </div>

                    {returnRecord.adminNote && (
                      <div>
                        <dt className="text-xs text-gray-500">
                          Store Administrator Note
                        </dt>
                        <dd className="mt-0.5 font-medium text-blue">
                          {returnRecord.adminNote}
                        </dd>
                      </div>
                    )}

                    <div>
                      <dt className="text-xs text-gray-500">Associated Order</dt>
                      <dd className="mt-0.5 font-medium text-dark">
                        <Link
                          href={`/orders/${encodeURIComponent(returnRecord.orderNumber)}`}
                          className="text-blue hover:underline"
                        >
                          Order #{returnRecord.orderNumber}
                        </Link>
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs text-gray-500">Request Date</dt>
                      <dd className="mt-0.5 font-medium text-dark">
                        {formatDateTime(returnRecord.createdAt)}
                      </dd>
                    </div>

                    {returnRecord.receivedAt && (
                      <div>
                        <dt className="text-xs text-gray-500">Received Date</dt>
                        <dd className="mt-0.5 font-medium text-dark">
                          {formatDateTime(returnRecord.receivedAt)}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Refund Summary Card */}
                <div className="rounded-2xl bg-white p-6 shadow-1 sm:p-8">
                  <h3 className="text-base font-bold text-dark mb-4">
                    Refund Summary
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Estimated Refund</span>
                      <span className="font-semibold text-dark">
                        {formatPrice(returnRecord.estimatedRefund)}
                      </span>
                    </div>

                    <div className="border-t border-gray-3 pt-3 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-dark text-base block">
                          Final Refund Amount
                        </span>
                        <span className="text-2xs text-gray-500 block">
                          {returnRecord.refundAmount !== null
                            ? "Confirmed & recorded on original order"
                            : "Pending receipt & inspection"}
                        </span>
                      </div>
                      <span
                        className={`text-xl font-bold ${
                          returnRecord.refundAmount !== null
                            ? "text-green"
                            : "text-gray-400"
                        }`}
                      >
                        {returnRecord.refundAmount !== null
                          ? formatPrice(returnRecord.refundAmount)
                          : "—"}
                      </span>
                    </div>

                    <div className="mt-4 rounded-lg bg-blue-light-5/50 p-3 text-xs text-gray-600">
                      Refunds are credited back to the original order payment
                      method once items are received and inspected at our
                      facility.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {returnRecord && (
        <CancelReturnModal
          returnNumber={returnRecord.returnNumber}
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          onSuccess={() => {
            fetchReturnDetails();
          }}
        />
      )}
    </>
  );
};

export default ReturnDetailsView;
