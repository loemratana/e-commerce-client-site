"use client";
import React, { useCallback, useEffect, useState } from "react";
import { returnsApi } from "@/lib/api/returns.api";
import { formatDate, formatPrice, getApiErrorMessage } from "@/lib/order-utils";
import { ReturnableOrderResponse } from "@/types/return-api";

type SelectReturnOrderModalProps = {
  onClose: () => void;
  onSelect: (orderNumber: string) => void;
};

/**
 * First step of "Request a return" from the returns page: choose the order. The server only
 * lists orders that can still be returned (delivered, inside the return period, not fully
 * returned); RequestReturnModal then lets the customer pick items.
 * Mount it only while open, so each opening loads a fresh list.
 */
const SelectReturnOrderModal: React.FC<SelectReturnOrderModalProps> = ({
  onClose,
  onSelect,
}) => {
  const [orders, setOrders] = useState<ReturnableOrderResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State changes only in the promise callbacks, so the mount effect can start the load
  // (the initial state already says "loading"). Retrying goes through retry().
  const fetchOrders = useCallback(
    () =>
      returnsApi
        .getReturnableOrders()
        .then(setOrders)
        .catch((err) => setError(getApiErrorMessage(err, "Unable to load your orders.")))
        .finally(() => setIsLoading(false)),
    []
  );

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const retry = () => {
    setIsLoading(true);
    setError(null);
    void fetchOrders();
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="select-return-order-title"
      className="fixed inset-0 z-[100000] flex items-center justify-center overflow-y-auto bg-black/60 p-4 sm:p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-3 p-5 sm:p-6">
          <div>
            <h2 id="select-return-order-title" className="text-lg sm:text-xl font-bold text-dark">
              Request a Return
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              Choose the order you want to return items from.
            </p>
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

        {/* Body */}
        <div className="overflow-y-auto p-5 sm:p-6 flex-1">
          {isLoading && (
            <div className="py-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue border-r-transparent" />
              <p className="mt-3 text-sm text-gray-500">Loading your orders...</p>
            </div>
          )}

          {!isLoading && error && (
            <div className="rounded-xl border border-red/30 bg-red-light-6 p-5 text-center text-red">
              <p className="text-sm font-medium">{error}</p>
              <button
                type="button"
                onClick={retry}
                className="mt-3 inline-block rounded-lg bg-red px-4 py-1.5 text-xs font-semibold text-white hover:bg-red/80 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {!isLoading && !error && orders.length === 0 && (
            <div className="py-10 text-center">
              <h3 className="text-base font-semibold text-dark">No orders to return</h3>
              <p className="mt-2 text-sm text-gray-500">
                Returns can be requested for delivered orders during the return period.
                Orders whose items are all already being returned aren&apos;t listed.
              </p>
            </div>
          )}

          {!isLoading && !error && orders.length > 0 && (
            <ul className="space-y-2.5">
              {orders.map((order) => (
                <li key={order.orderNumber}>
                  <button
                    type="button"
                    onClick={() => onSelect(order.orderNumber)}
                    className="flex w-full items-center justify-between gap-4 rounded-xl border border-gray-3 p-4 text-left transition-colors hover:border-blue hover:bg-blue/5"
                  >
                    <div>
                      <p className="font-mono text-sm font-semibold text-dark">
                        #{order.orderNumber}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {order.deliveredAt
                          ? `Delivered ${formatDate(order.deliveredAt)}`
                          : `Ordered ${formatDate(order.orderDate)}`}
                        {" · "}
                        {order.returnableItemCount < order.itemCount
                          ? `${order.returnableItemCount} of ${order.itemCount} items left to return`
                          : `${order.itemCount} ${order.itemCount === 1 ? "item" : "items"}`}
                      </p>
                      {order.returnableUntil && (
                        <p className="mt-0.5 text-xs font-medium text-blue">
                          Return by {formatDate(order.returnableUntil)}
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-dark">
                      {formatPrice(order.totalOrderPrice)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelectReturnOrderModal;
