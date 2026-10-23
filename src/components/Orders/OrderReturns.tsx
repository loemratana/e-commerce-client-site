"use client";
import React, { useState } from "react";
import Link from "next/link";
import { RETURN_STATUS_LABELS, RETURN_STATUS_STYLES } from "@/lib/api/returns.api";
import { canCancelReturn } from "@/lib/return-utils";
import { formatDateTime, formatPrice } from "@/lib/order-utils";
import { ReturnResponse } from "@/types/return-api";
import CancelReturnModal from "@/components/Returns/CancelReturnModal";

// What the customer should expect next, per status.
const NEXT_STEP: Partial<Record<ReturnResponse["status"], string>> = {
  REQUESTED: "We're reviewing your request.",
  APPROVED: "Please send the items back. Your refund is sent to your original payment method when they arrive.",
  REJECTED: "Your return request was not approved.",
  RECEIVED: "Items received and inspected. Your refund was sent to your original payment method; card refunds can take 5–10 business days to appear.",
  CANCELLED: "This return was cancelled.",
};

type OrderReturnsProps = {
  returns: ReturnResponse[];
  onChange: () => void;
};

/** The customer's returns for one order, with status, refund and a cancel option while still under review. */
const OrderReturns: React.FC<OrderReturnsProps> = ({ returns, onChange }) => {
  const [cancellingReturnNumber, setCancellingReturnNumber] = useState<
    string | null
  >(null);

  if (returns.length === 0) return null;

  return (
    <>
      <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-1">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-dark">
            Returns ({returns.length})
          </h2>
          <Link
            href="/account/returns"
            className="text-xs font-semibold text-blue hover:underline"
          >
            All Returns &rarr;
          </Link>
        </div>
        <div className="space-y-4">
          {returns.map((r) => (
            <div
              key={r.returnNumber}
              className="rounded-xl border border-gray-3 p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-3 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-dark">
                    Return #{r.returnNumber}
                  </span>
                  <span
                    className={`rounded-full px-3 py-0.5 text-xs font-semibold ${RETURN_STATUS_STYLES[r.status]}`}
                  >
                    {RETURN_STATUS_LABELS[r.status]}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  Requested {formatDateTime(r.createdAt)}
                </span>
              </div>

              <ul className="mt-3 space-y-1 text-sm text-gray-600">
                {r.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-2">
                    <span className="font-medium text-dark">{item.quantity} ×</span>{" "}
                    {item.productName}
                    {(item.color || item.sizeName) && (
                      <span className="text-gray-400">
                        {" "}
                        (
                        {[item.color, item.sizeName]
                          .filter(Boolean)
                          .join(" / ")}
                        )
                      </span>
                    )}
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-gray-3 pt-3">
                <div className="text-sm">
                  {r.refundAmount !== null ? (
                    <p className="font-semibold text-green">
                      Refunded {formatPrice(r.refundAmount)}
                    </p>
                  ) : r.status === "REQUESTED" || r.status === "APPROVED" ? (
                    <p className="text-gray-600">
                      Expected refund{" "}
                      <span className="font-semibold text-dark">
                        {formatPrice(r.estimatedRefund)}
                      </span>
                    </p>
                  ) : null}
                  {NEXT_STEP[r.status] && (
                    <p className="mt-0.5 text-xs text-gray-500">
                      {NEXT_STEP[r.status]}
                    </p>
                  )}
                  {r.adminNote && (
                    <p className="mt-1 text-xs text-gray-600">
                      <span className="font-medium">Message from store:</span>{" "}
                      {r.adminNote}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {canCancelReturn(r.status) && (
                    <button
                      type="button"
                      onClick={() => setCancellingReturnNumber(r.returnNumber)}
                      className="rounded-lg border border-red/40 px-3 py-1.5 text-xs font-medium text-red hover:bg-red-light-6 transition-colors"
                    >
                      Cancel Return
                    </button>
                  )}
                  <Link
                    href={`/account/returns/${encodeURIComponent(r.returnNumber)}`}
                    className="rounded-lg bg-blue px-3.5 py-1.5 text-xs font-medium text-white hover:bg-blue-dark transition-colors"
                  >
                    View Details &rarr;
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {cancellingReturnNumber && (
        <CancelReturnModal
          returnNumber={cancellingReturnNumber}
          isOpen={Boolean(cancellingReturnNumber)}
          onClose={() => setCancellingReturnNumber(null)}
          onSuccess={() => {
            setCancellingReturnNumber(null);
            onChange();
          }}
        />
      )}
    </>
  );
};

export default OrderReturns;
