"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import CustomerOrderDetailsModal from "./CustomerOrderDetailsModal";
import CancelOrderConfirmModal from "./CancelOrderConfirmModal";
import RequestReturnModal from "./RequestReturnModal";
import InvoiceButton from "./InvoiceButton";
import { ordersApi } from "@/lib/api/orders.api";
import { returnsApi } from "@/lib/api/returns.api";
import { OrderSummaryResponse } from "@/types/order-api";
import {
  ReturnableOrderResponse,
  ReturnEligibilityResponse,
  ReturnResponse,
} from "@/types/return-api";
import {
  canCancelOrder,
  formatDate,
  formatPrice,
  getApiErrorMessage,
  getStatusLabel,
  getStatusStyle,
} from "@/lib/order-utils";
import { canPayOrder, orderPaymentNote } from "@/lib/payment-utils";

const PAGE_SIZE = 10;

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<OrderSummaryResponse[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string | null>(null);
  const [cancelOrderNumber, setCancelOrderNumber] = useState<string | null>(null);
  const [returnOrderNumber, setReturnOrderNumber] = useState<string | null>(null);

  // Return management states per order
  const [orderReturns, setOrderReturns] = useState<Record<string, ReturnResponse[]>>({});
  const [eligibilityMap, setEligibilityMap] = useState<Record<string, ReturnEligibilityResponse>>({});
  const [returnInfoLoading, setReturnInfoLoading] = useState<Record<string, boolean>>({});
  const [returnInfoErrors, setReturnInfoErrors] = useState<Record<string, string>>({});
  // Orders a return can still be requested for, keyed by order number
  const [returnableOrders, setReturnableOrders] = useState<
    Record<string, ReturnableOrderResponse>
  >({});
  // false until the list loads; if it never does, the return form checks eligibility itself
  const [returnableLoaded, setReturnableLoaded] = useState(false);

  // Ref to avoid duplicate concurrent in-flight requests
  const inFlightRequests = useRef<Set<string>>(new Set());

  const fetchOrders = useCallback(async (page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await ordersApi.getMyOrders({
        page,
        size: PAGE_SIZE,
        sort: "orderDate,desc",
      });
      setOrders(data.content || []);
      setCurrentPage(data.currentPage ?? page);
      setTotalPages(data.totalPages ?? 0);
      setTotalElements(data.totalElements ?? 0);
      setHasNext(Boolean(data.hasNext));
      setHasPrevious(Boolean(data.hasPrevious));
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load your orders."));
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(currentPage);
  }, [fetchOrders, currentPage]);

  /**
   * Fetches return eligibility and existing returns for a specific order.
   * Caches results and avoids redundant requests unless force=true.
   */
  const fetchOrderReturnInfo = useCallback(
    async (orderNumber: string, force = false) => {
      if (!orderNumber) return;
      if (!force && inFlightRequests.current.has(orderNumber)) return;
      if (
        !force &&
        eligibilityMap[orderNumber] !== undefined &&
        orderReturns[orderNumber] !== undefined
      ) {
        return;
      }

      inFlightRequests.current.add(orderNumber);
      setReturnInfoLoading((prev) => ({ ...prev, [orderNumber]: true }));
      setReturnInfoErrors((prev) => {
        const next = { ...prev };
        delete next[orderNumber];
        return next;
      });

      try {
        const [eligibilityResult, returnsResult] = await Promise.allSettled([
          returnsApi.getEligibility(orderNumber),
          returnsApi.getForOrder(orderNumber),
        ]);

        if (eligibilityResult.status === "fulfilled") {
          setEligibilityMap((prev) => ({
            ...prev,
            [orderNumber]: eligibilityResult.value,
          }));
        } else {
          setReturnInfoErrors((prev) => ({
            ...prev,
            [orderNumber]: getApiErrorMessage(
              eligibilityResult.reason,
              "Failed to check return eligibility."
            ),
          }));
        }

        if (returnsResult.status === "fulfilled") {
          setOrderReturns((prev) => ({
            ...prev,
            [orderNumber]: returnsResult.value || [],
          }));
        } else {
          setOrderReturns((prev) => ({
            ...prev,
            [orderNumber]: prev[orderNumber] || [],
          }));
        }
      } catch (err) {
        setReturnInfoErrors((prev) => ({
          ...prev,
          [orderNumber]: getApiErrorMessage(err, "Failed to load return info."),
        }));
      } finally {
        setReturnInfoLoading((prev) => ({ ...prev, [orderNumber]: false }));
        inFlightRequests.current.delete(orderNumber);
      }
    },
    [eligibilityMap, orderReturns]
  );

  // Load user's returns on mount so the details modal can list them straight away
  useEffect(() => {
    returnsApi
      .getMyReturns({ size: 100 })
      .then((data) => {
        const items = data.content || [];
        const map: Record<string, ReturnResponse[]> = {};
        items.forEach((r) => {
          if (!map[r.orderNumber]) map[r.orderNumber] = [];
          map[r.orderNumber].push(r);
        });
        setOrderReturns((prev) => ({ ...map, ...prev }));
      })
      .catch(() => {});
  }, []);

  const fetchReturnableOrders = useCallback(() => {
    returnsApi
      .getReturnableOrders()
      .then((items) => {
        const map: Record<string, ReturnableOrderResponse> = {};
        (items || []).forEach((item) => {
          if (item.returnableItemCount > 0) map[item.orderNumber] = item;
        });
        setReturnableOrders(map);
        setReturnableLoaded(true);
      })
      .catch(() => {
        setReturnableLoaded(false);
      });
  }, []);

  useEffect(() => {
    fetchReturnableOrders();
  }, [fetchReturnableOrders]);

  const handleOpenDetails = (orderNumber: string) => {
    setSelectedOrderNumber(orderNumber);
    void fetchOrderReturnInfo(orderNumber);
  };

  const handleOpenCancel = (orderNumber: string) => {
    setCancelOrderNumber(orderNumber);
  };

  const handleOpenReturnModal = (orderNumber: string) => {
    setReturnOrderNumber(orderNumber);
  };

  const handleCancelSuccess = () => {
    fetchOrders(currentPage);
  };

  const handleReturnSuccess = () => {
    if (returnOrderNumber) {
      void fetchOrderReturnInfo(returnOrderNumber, true);
    }
    fetchReturnableOrders();
  };

  // Shown on every delivered order; disabled once the return period is over or every item is returned
  const renderReturnButton = (order: OrderSummaryResponse) => {
    if (order.status !== "DELIVERED") return null;

    const returnable = returnableOrders[order.orderNumber];
    const canReturn = !returnableLoaded || Boolean(returnable);
    const title = !canReturn
      ? "This order can no longer be returned"
      : returnable?.returnableUntil
        ? `Return available until ${formatDate(returnable.returnableUntil)}`
        : "Request a return for this order";

    return (
      <button
        type="button"
        disabled={!canReturn}
        onClick={() => handleOpenReturnModal(order.orderNumber)}
        className="rounded border border-orange/50 px-2 py-0.5 text-[11px] font-medium text-orange-dark hover:bg-orange hover:text-white transition-colors disabled:border-gray-3 disabled:text-gray-4 disabled:hover:bg-transparent disabled:cursor-not-allowed"
        title={title}
      >
        Request Return
      </button>
    );
  };

  return (
    <>
      <div className="w-full">
        {/* Loading State */}
        {isLoading && (
          <div className="py-16 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue border-r-transparent"></div>
            <p className="mt-3 text-sm text-gray-500">Loading your orders...</p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="my-6 rounded-xl bg-red-light-6 p-6 text-center text-red">
            <p className="text-sm font-medium">{error}</p>
            <button
              type="button"
              onClick={() => fetchOrders(currentPage)}
              className="mt-3 rounded-lg bg-blue px-4 py-2 text-xs font-semibold text-white hover:bg-blue-dark transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && orders.length === 0 && (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-2 text-gray-400">
              <svg
                className="h-8 w-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-dark">No orders yet</h3>
            <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
              You haven&apos;t placed any orders yet. Once you place an order, you can
              track its status here.
            </p>
            <Link
              href="/shop-with-sidebar"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-dark transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        )}

        {/* Orders Table & Cards */}
        {!isLoading && !error && orders.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-gray-3 bg-white shadow-1">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full table-auto text-left">
                <thead className="bg-gray-1 border-b border-gray-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-5 whitespace-nowrap">Order Number</th>
                    <th className="py-3.5 px-3 sm:px-4 whitespace-nowrap">Date</th>
                    <th className="py-3.5 px-3 sm:px-4 whitespace-nowrap">Status</th>
                    <th className="py-3.5 px-3 text-center whitespace-nowrap">Items</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">Total</th>
                    <th className="py-3.5 px-4 sm:px-5 text-right whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-3 text-sm">
                  {orders.map((order) => {
                    const isCancellable = canCancelOrder(order.status);

                    return (
                      <tr
                        key={order.orderNumber}
                        className="hover:bg-gray-1/40 transition-colors"
                      >
                        <td className="py-3.5 px-4 sm:px-5 font-mono font-semibold text-dark whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(order.orderNumber)}
                            className="text-blue hover:underline text-left"
                            title="Click to view details"
                          >
                            #{order.orderNumber}
                          </button>
                        </td>

                        <td className="py-3.5 px-3 sm:px-4 text-gray-600 whitespace-nowrap">
                          {formatDate(order.orderDate)}
                        </td>

                        <td className="py-3.5 px-3 sm:px-4 whitespace-nowrap">
                          <span
                            className={`inline-block text-xs font-semibold py-0.5 px-2.5 rounded-full ${getStatusStyle(
                              order.status
                            )}`}
                          >
                            {getStatusLabel(order.status)}
                          </span>
                          {orderPaymentNote(order.status, order.paymentMethod) && (
                            <span className="mt-1 block text-[11px] text-gray-500">
                              {orderPaymentNote(order.status, order.paymentMethod)}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-center text-dark font-medium whitespace-nowrap">
                          {order.itemCount}
                        </td>

                        <td className="py-3.5 px-4 text-right font-bold text-dark whitespace-nowrap">
                          {formatPrice(order.totalOrderPrice)}
                        </td>

                        <td className="py-3 px-4 sm:px-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {canPayOrder(order.status, order.paymentMethod) && (
                              <Link
                                href={`/orders/${encodeURIComponent(order.orderNumber)}`}
                                className="rounded bg-green px-2.5 py-0.5 text-[11px] font-medium text-white hover:opacity-90 transition-opacity"
                              >
                                Pay now
                              </Link>
                            )}
                            {isCancellable && (
                              <button
                                type="button"
                                onClick={() => handleOpenCancel(order.orderNumber)}
                                className="rounded border border-red/40 px-2 py-0.5 text-[11px] font-medium text-red hover:bg-red hover:text-white transition-colors"
                              >
                                Cancel
                              </button>
                            )}

                            {renderReturnButton(order)}

                            <InvoiceButton
                              orderNumber={order.orderNumber}
                              status={order.status}
                              compact
                            />

                            <button
                              type="button"
                              onClick={() => handleOpenDetails(order.orderNumber)}
                              className="rounded bg-blue px-2.5 py-0.5 text-[11px] font-medium text-white hover:bg-blue-dark transition-colors"
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden divide-y divide-gray-3">
              {orders.map((order) => {
                const isCancellable = canCancelOrder(order.status);

                return (
                  <div
                    key={order.orderNumber}
                    className="p-4 space-y-3 hover:bg-gray-1/40 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenDetails(order.orderNumber)}
                        className="font-mono font-bold text-sm text-blue hover:underline text-left"
                      >
                        #{order.orderNumber}
                      </button>
                      <span
                        className={`inline-block text-xs font-semibold py-0.5 px-2.5 rounded-full ${getStatusStyle(
                          order.status
                        )}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Date: {formatDate(order.orderDate)}</span>
                      <span>
                        {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                      </span>
                    </div>
                    {orderPaymentNote(order.status, order.paymentMethod) && (
                      <p className="text-xs text-gray-500">{orderPaymentNote(order.status, order.paymentMethod)}</p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-gray-2">
                      <div>
                        <span className="text-xs text-gray-400">Total: </span>
                        <span className="text-sm font-bold text-dark">
                          {formatPrice(order.totalOrderPrice)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {canPayOrder(order.status, order.paymentMethod) && (
                          <Link
                            href={`/orders/${encodeURIComponent(order.orderNumber)}`}
                            className="rounded bg-green px-2.5 py-0.5 text-[11px] font-medium text-white hover:opacity-90 transition-opacity"
                          >
                            Pay now
                          </Link>
                        )}
                        {isCancellable && (
                          <button
                            type="button"
                            onClick={() => handleOpenCancel(order.orderNumber)}
                            className="rounded border border-red/40 px-2 py-0.5 text-[11px] font-medium text-red hover:bg-red hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                        )}

                        {renderReturnButton(order)}

                        <InvoiceButton
                          orderNumber={order.orderNumber}
                          status={order.status}
                          compact
                        />

                        <button
                          type="button"
                          onClick={() => handleOpenDetails(order.orderNumber)}
                          className="rounded bg-blue px-2.5 py-0.5 text-[11px] font-medium text-white hover:bg-blue-dark transition-colors"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-gray-3 bg-gray-1/50 text-sm">
                <p className="text-xs text-gray-500">
                  Showing page <span className="font-semibold text-dark">{currentPage + 1}</span> of{" "}
                  <span className="font-semibold text-dark">{totalPages}</span> ({totalElements} orders total)
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!hasPrevious || currentPage === 0}
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    className="rounded-lg border border-gray-3 bg-white px-3 py-1.5 text-xs font-medium text-dark hover:bg-gray-2 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                  >
                    Previous
                  </button>

                  <span className="px-2 text-xs font-medium text-gray-600">
                    {currentPage + 1} / {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={!hasNext || currentPage >= totalPages - 1}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="rounded-lg border border-gray-3 bg-white px-3 py-1.5 text-xs font-medium text-dark hover:bg-gray-2 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Details Modal */}
      <CustomerOrderDetailsModal
        orderNumber={selectedOrderNumber}
        isOpen={Boolean(selectedOrderNumber)}
        onClose={() => setSelectedOrderNumber(null)}
        onRequestCancel={(orderNum) => {
          setSelectedOrderNumber(null);
          setCancelOrderNumber(orderNum);
        }}
        onRequestReturn={(orderNum) => {
          setSelectedOrderNumber(null);
          setReturnOrderNumber(orderNum);
        }}
        existingReturns={selectedOrderNumber ? orderReturns[selectedOrderNumber] || [] : []}
        eligibility={selectedOrderNumber ? eligibilityMap[selectedOrderNumber] || null : null}
      />

      {/* Cancel Confirmation Modal */}
      <CancelOrderConfirmModal
        orderNumber={cancelOrderNumber}
        isOpen={Boolean(cancelOrderNumber)}
        onClose={() => setCancelOrderNumber(null)}
        onSuccess={handleCancelSuccess}
        paidAmount={(() => {
          // Customers can cancel PENDING or PAID orders; only PAID ones have taken money.
          const target = orders.find((o) => o.orderNumber === cancelOrderNumber);
          return target?.status === "PAID" ? target.totalOrderPrice : null;
        })()}
      />

      {/* Return Request Modal */}
      {returnOrderNumber && (
        <RequestReturnModal
          orderNumber={returnOrderNumber}
          isOpen={Boolean(returnOrderNumber)}
          onClose={() => setReturnOrderNumber(null)}
          onSuccess={handleReturnSuccess}
        />
      )}
    </>
  );
};

export default Orders;
