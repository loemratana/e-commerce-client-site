"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ordersApi } from "@/lib/api/orders.api";
import { OrderResponse } from "@/types/order-api";
import { ReturnEligibilityResponse, ReturnResponse } from "@/types/return-api";
import {
  canCancelOrder,
  formatAddress,
  formatDateTime,
  formatPrice,
  getApiErrorMessage,
  getStatusLabel,
  getStatusStyle,
} from "@/lib/order-utils";
import {
  RETURN_STATUS_LABELS,
  RETURN_STATUS_STYLES,
} from "@/lib/return-utils";
import InvoiceButton from "./InvoiceButton";
import OrderPayment from "./OrderPayment";

type CustomerOrderDetailsModalProps = {
  orderNumber: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRequestCancel: (orderNumber: string) => void;
  onRequestReturn?: (orderNumber: string) => void;
  existingReturns?: ReturnResponse[];
  eligibility?: ReturnEligibilityResponse | null;
};

const CustomerOrderDetailsModal: React.FC<CustomerOrderDetailsModalProps> = ({
  orderNumber,
  isOpen,
  onClose,
  onRequestCancel,
  onRequestReturn,
  existingReturns = [],
  eligibility,
}) => {
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !orderNumber) {
      setOrder(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    ordersApi
      .getMyOrder(orderNumber)
      .then((data) => {
        if (isMounted) {
          setOrder(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(getApiErrorMessage(err, "Failed to load order details."));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, orderNumber]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-details-title"
      className="fixed inset-0 z-[99999] flex items-center justify-center overflow-y-auto bg-black/60 p-4 sm:p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 sm:p-8 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-3 pb-5">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2
                id="order-details-title"
                className="text-xl sm:text-2xl font-bold text-dark"
              >
                Order #{orderNumber}
              </h2>
              {order && (
                <span
                  className={`inline-block text-xs font-semibold py-1 px-3 rounded-full ${getStatusStyle(
                    order.status
                  )}`}
                >
                  {getStatusLabel(order.status)}
                </span>
              )}
            </div>
            {order?.orderDate && (
              <p className="mt-1 text-xs sm:text-sm text-gray-500">
                Placed on {formatDateTime(order.orderDate)}
                {order.updateDate && (
                  <span> &bull; Updated {formatDateTime(order.updateDate)}</span>
                )}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-full p-2 text-gray-500 hover:bg-gray-2 hover:text-dark transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        {isLoading && (
          <div className="py-16 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue border-r-transparent"></div>
            <p className="mt-3 text-sm text-gray-600">Loading order details...</p>
          </div>
        )}

        {error && (
          <div className="my-6 rounded-lg bg-red-light-6 p-4 text-center text-sm text-red">
            <p>{error}</p>
            <button
              onClick={() => {
                if (orderNumber) {
                  setIsLoading(true);
                  setError(null);
                  ordersApi
                    .getMyOrder(orderNumber)
                    .then(setOrder)
                    .catch((err) =>
                      setError(
                        getApiErrorMessage(err, "Failed to load order details.")
                      )
                    )
                    .finally(() => setIsLoading(false));
                }
              }}
              className="mt-3 inline-block font-medium text-blue underline hover:text-blue-dark"
            >
              Retry
            </button>
          </div>
        )}

        {order && !isLoading && (
          <div className="mt-6 space-y-6">
            <OrderPayment
              order={order}
              variant="inline"
              onChange={() => {
                ordersApi.getMyOrder(order.orderNumber).then(setOrder).catch(() => undefined);
              }}
            />

            {/* Customer & Shipping info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl bg-gray-1 p-4 sm:p-5 border border-gray-3">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  Shipping Address
                </h3>
                {order.shippingAddress ? (
                  <div className="text-sm text-dark space-y-0.5">
                    {order.shippingAddress.recipientName && (
                      <p className="font-medium">
                        {order.shippingAddress.recipientName}
                      </p>
                    )}
                    {order.shippingAddress.phone && (
                      <p className="text-gray-600">
                        {order.shippingAddress.phone}
                      </p>
                    )}
                    <p className="text-gray-600">
                      {formatAddress(order.shippingAddress)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No shipping address provided
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  Customer Information
                </h3>
                {order.customer ? (
                  <div className="text-sm text-dark space-y-0.5">
                    <p className="font-medium">{order.customer.name}</p>
                    <p className="text-gray-600">{order.customer.email}</p>
                    {order.customer.phone && (
                      <p className="text-gray-600">{order.customer.phone}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Account customer
                  </p>
                )}
              </div>
            </div>

            {/* Items */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-dark mb-3">
                Order Items ({order.items?.length || 0})
              </h3>
              <div className="overflow-x-auto rounded-xl border border-gray-3">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-1 text-xs uppercase text-gray-500 border-b border-gray-3">
                    <tr>
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-3">SKU</th>
                      <th className="py-3 px-3">Variant</th>
                      <th className="py-3 px-3 text-center">Qty</th>
                      <th className="py-3 px-3 text-right">Unit Price</th>
                      <th className="py-3 px-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-3">
                    {order.items?.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-1/50">
                        <td className="py-3 px-4 font-medium text-dark">
                          <span className="flex items-center gap-3">
                            {item.imageUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.imageUrl} alt="" className="h-10 w-10 shrink-0 rounded-md bg-gray-1 object-cover" />
                            )}
                            {item.productName}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-500 font-mono text-xs">
                          {item.sku || "-"}
                        </td>
                        <td className="py-3 px-3 text-gray-600 text-xs">
                          {[item.color, item.sizeName]
                            .filter(Boolean)
                            .join(" / ") || "-"}
                        </td>
                        <td className="py-3 px-3 text-center text-dark font-medium">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-3 text-right text-gray-700">
                          {item.priceAfterDiscount &&
                          item.priceAfterDiscount < item.price ? (
                            <div>
                              <span>{formatPrice(item.priceAfterDiscount)}</span>
                              <span className="ml-1 text-xs line-through text-gray-400">
                                {formatPrice(item.price)}
                              </span>
                            </div>
                          ) : (
                            formatPrice(item.price)
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-dark">
                          {formatPrice(item.lineTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="rounded-xl bg-gray-1 p-5 border border-gray-3 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>

              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green font-medium">
                  <span>
                    Discount
                    {order.couponCodes?.length > 0 && (
                      <span className="ml-1 text-xs text-gray-500 font-normal">
                        ({order.couponCodes.join(", ")})
                      </span>
                    )}
                  </span>
                  <span>-{formatPrice(order.discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>{formatPrice(order.taxPrice)}</span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>
                  {order.shippingPrice === 0
                    ? "Free"
                    : formatPrice(order.shippingPrice)}
                </span>
              </div>

              <div className="flex justify-between border-t border-gray-3 pt-2 text-base font-bold text-dark">
                <span>Total</span>
                <span className="text-blue">
                  {formatPrice(order.totalOrderPrice)}
                </span>
              </div>
            </div>

            {/* Existing Returns Card */}
            {existingReturns.length > 0 && (
              <div className="rounded-xl border border-gray-3 p-5 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-dark uppercase tracking-wider">
                    Returns ({existingReturns.length})
                  </h3>
                  <Link
                    href="/account/returns"
                    className="text-xs font-semibold text-blue hover:underline"
                  >
                    All Returns &rarr;
                  </Link>
                </div>
                <div className="space-y-2">
                  {existingReturns.map((r) => (
                    <div
                      key={r.returnNumber}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-1 p-3 border border-gray-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-dark">
                          #{r.returnNumber}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            RETURN_STATUS_STYLES[r.status] || "text-gray-600 bg-gray-2"
                          }`}
                        >
                          {RETURN_STATUS_LABELS[r.status] || r.status}
                        </span>
                      </div>
                      <Link
                        href={`/account/returns/${encodeURIComponent(r.returnNumber)}`}
                        className="text-xs font-medium text-blue hover:underline"
                      >
                        View Return Details &rarr;
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ineligible Explanation (Only for Delivered orders) */}
            {order.status === "DELIVERED" &&
              eligibility &&
              !eligibility.eligible &&
              eligibility.reason && (
                <div className="rounded-lg bg-gray-1 p-3 border border-gray-2 text-xs text-gray-600 flex items-center gap-2">
                  <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span><strong>Return Status:</strong> {eligibility.reason}</span>
                </div>
              )}

            {/* Footer Actions */}
            <div className="flex items-center justify-between border-t border-gray-3 pt-4">
              {canCancelOrder(order.status) ? (
                <button
                  type="button"
                  onClick={() => onRequestCancel(order.orderNumber)}
                  className="rounded-lg border border-red px-4 py-2 text-sm font-medium text-red hover:bg-red hover:text-white transition-colors"
                >
                  Cancel Order
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <InvoiceButton orderNumber={order.orderNumber} status={order.status} />
                {order.status === "DELIVERED" && eligibility?.eligible && onRequestReturn && (
                  <button
                    type="button"
                    onClick={() => onRequestReturn(order.orderNumber)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-3 bg-white px-4 py-2 text-sm font-medium text-dark hover:border-blue hover:text-blue hover:bg-blue/5 transition-colors shadow-xs"
                  >
                    <svg className="h-4 w-4 text-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3" />
                    </svg>
                    <span>Request Return</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg bg-gray-2 px-5 py-2 text-sm font-medium text-dark hover:bg-gray-3 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerOrderDetailsModal;
