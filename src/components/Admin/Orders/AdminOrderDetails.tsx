"use client";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/Common/Breadcrumb";
import { ordersApi } from "@/lib/api/orders.api";
import { OrderResponse, OrderStatus } from "@/types/order-api";
import {
  ALLOWED_STATUS_TRANSITIONS,
  formatAddress,
  formatDateTime,
  formatPrice,
  getApiErrorMessage,
  getStatusLabel,
  getStatusStyle,
} from "@/lib/order-utils";
import UpdateStatusModal from "./UpdateStatusModal";

type AdminOrderDetailsProps = {
  orderNumber: string;
};

const AdminOrderDetails: React.FC<AdminOrderDetailsProps> = ({
  orderNumber,
}) => {
  const router = useRouter();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const fetchOrder = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await ordersApi.getOrderByNumber(orderNumber);
      setOrder(data);
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to load administrative order details. Order may not exist or require admin privileges."
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    if (orderNumber) {
      fetchOrder();
    }
  }, [orderNumber, fetchOrder]);

  const handleStatusUpdated = (_num: string, newStatus: OrderStatus) => {
    if (order) {
      setOrder({
        ...order,
        status: newStatus,
        updateDate: new Date().toISOString(),
      });
    }
    fetchOrder();
  };

  const allowedNext = order
    ? ALLOWED_STATUS_TRANSITIONS[order.status] || []
    : [];

  return (
    <>
      <Breadcrumb
        title="Admin Order Details"
        pages={["Admin", "Orders", `Order #${orderNumber}`]}
      />

      <section className="bg-gray-2 py-10 sm:py-14">
        <div className="site-container">
          {/* Loading */}
          {isLoading && (
            <div className="rounded-2xl bg-white p-12 text-center shadow-1">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-blue border-r-transparent"></div>
              <p className="mt-4 text-sm font-medium text-gray-500">
                Loading administrative order details...
              </p>
            </div>
          )}

          {/* Error */}
          {!isLoading && error && (
            <div className="rounded-2xl bg-white p-10 text-center shadow-1">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-light-6 text-red">
                <svg
                  className="h-8 w-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-dark">Order Not Found</h2>
              <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">
                {error}
              </p>
              <div className="mt-6 flex justify-center gap-4">
                <button
                  type="button"
                  onClick={fetchOrder}
                  className="rounded-lg bg-blue px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-dark transition-colors"
                >
                  Retry
                </button>
                <Link
                  href="/admin/orders"
                  className="rounded-lg border border-gray-3 bg-white px-5 py-2.5 text-sm font-medium text-dark hover:bg-gray-1 transition-colors"
                >
                  Back to All Orders
                </Link>
              </div>
            </div>
          )}

          {/* Order Details View */}
          {!isLoading && !error && order && (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-1 border border-gray-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-3 pb-6">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs uppercase font-bold text-gray-500 tracking-wider bg-gray-2 px-2.5 py-1 rounded">
                        Admin View
                      </span>
                      <h1 className="text-2xl sm:text-3xl font-bold text-dark font-mono">
                        #{order.orderNumber}
                      </h1>
                      <span
                        className={`inline-block text-xs font-semibold py-1 px-3.5 rounded-full ${getStatusStyle(
                          order.status
                        )}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs sm:text-sm text-gray-500">
                      Created: {formatDateTime(order.orderDate)}
                      {order.updateDate && (
                        <span>
                          {" "}
                          &bull; Last updated: {formatDateTime(order.updateDate)}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setIsStatusModalOpen(true)}
                      className="rounded-lg bg-blue px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-dark transition-colors"
                    >
                      Update Order Status
                    </button>
                    <Link
                      href="/admin/orders"
                      className="rounded-lg border border-gray-3 bg-white px-4 py-2.5 text-sm font-medium text-dark hover:bg-gray-1 transition-colors"
                    >
                      &larr; Back to Orders
                    </Link>
                  </div>
                </div>

                {/* Status Transition Banner */}
                <div className="mt-4 rounded-xl bg-gray-1 p-4 border border-gray-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-gray-600">
                    <span className="font-semibold text-dark">Current Status:</span>{" "}
                    <span className="font-medium text-blue">
                      {getStatusLabel(order.status)}
                    </span>
                    {allowedNext.length > 0 ? (
                      <span className="ml-2 text-gray-500">
                        &bull; Allowed transitions:{" "}
                        <span className="font-medium text-dark">
                          {allowedNext.map(getStatusLabel).join(", ")}
                        </span>
                      </span>
                    ) : (
                      <span className="ml-2 text-gray-500">
                        &bull; Terminal status (no further transitions allowed)
                      </span>
                    )}
                  </div>
                </div>

                {/* Customer and Shipping Grid */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Shipping Address */}
                  <div className="rounded-xl bg-gray-1 p-5 border border-gray-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                      Shipping Details
                    </h2>
                    {order.shippingAddress ? (
                      <div className="text-sm text-dark space-y-1">
                        {order.shippingAddress.recipientName && (
                          <p className="font-semibold">
                            {order.shippingAddress.recipientName}
                          </p>
                        )}
                        {order.shippingAddress.phone && (
                          <p className="text-gray-600">
                            Phone: {order.shippingAddress.phone}
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

                  {/* Customer Information */}
                  <div className="rounded-xl bg-gray-1 p-5 border border-gray-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                      Customer Profile
                    </h2>
                    {order.customer ? (
                      <div className="text-sm text-dark space-y-1">
                        <p className="font-semibold">
                          {order.customer.name} (ID: #{order.customer.id})
                        </p>
                        <p className="text-gray-600">
                          Email: {order.customer.email}
                        </p>
                        {order.customer.phone && (
                          <p className="text-gray-600">
                            Phone: {order.customer.phone}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Registered customer
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Items and Financial Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Items Table */}
                <div className="lg:col-span-2 rounded-2xl bg-white p-6 sm:p-8 shadow-1 border border-gray-3">
                  <h2 className="text-lg font-bold text-dark mb-4">
                    Order Items ({order.items?.length || 0})
                  </h2>

                  <div className="overflow-x-auto rounded-xl border border-gray-3">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-1 text-xs uppercase tracking-wider text-gray-500 border-b border-gray-3">
                        <tr>
                          <th className="py-3 px-4">Product Name</th>
                          <th className="py-3 px-3">SKU</th>
                          <th className="py-3 px-3">Variant (Color / Size)</th>
                          <th className="py-3 px-3 text-center">Qty</th>
                          <th className="py-3 px-3 text-right">Price</th>
                          <th className="py-3 px-4 text-right">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-3">
                        {order.items?.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-1/40">
                            <td className="py-3 px-4 font-medium text-dark">
                              <span className="flex items-center gap-3">
                                {item.imageUrl && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={item.imageUrl} alt="" className="h-10 w-10 shrink-0 rounded-md bg-gray-1 object-cover" />
                                )}
                                <span>
                                  {item.productName}
                                  <span className="block text-[11px] text-gray-400 font-mono">
                                    Variant ID: {item.productVariantId}
                                  </span>
                                </span>
                              </span>
                            </td>
                            <td className="py-3 px-3 text-xs font-mono text-gray-500">
                              {item.sku || "-"}
                            </td>
                            <td className="py-3 px-3 text-xs text-gray-600">
                              {[item.color, item.sizeName]
                                .filter(Boolean)
                                .join(" / ") || "-"}
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-dark">
                              {item.quantity}
                            </td>
                            <td className="py-3 px-3 text-right text-gray-700">
                              {item.priceAfterDiscount &&
                              item.priceAfterDiscount < item.price ? (
                                <div>
                                  <span>
                                    {formatPrice(item.priceAfterDiscount)}
                                  </span>
                                  <span className="ml-1 text-xs line-through text-gray-400">
                                    {formatPrice(item.price)}
                                  </span>
                                </div>
                              ) : (
                                formatPrice(item.price)
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-dark">
                              {formatPrice(item.lineTotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-1 border border-gray-3 h-fit">
                  <h2 className="text-lg font-bold text-dark mb-4">
                    Pricing Breakdown
                  </h2>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span className="font-semibold text-dark">
                        {formatPrice(order.subtotal)}
                      </span>
                    </div>

                    {order.discountAmount > 0 && (
                      <div className="flex justify-between text-green font-medium">
                        <span>
                          Discount
                          {order.couponCodes?.length > 0 && (
                            <span className="block text-xs text-gray-500 font-normal">
                              Coupons: {order.couponCodes.join(", ")}
                            </span>
                          )}
                        </span>
                        <span>-{formatPrice(order.discountAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-gray-600">
                      <span>Tax Amount</span>
                      <span className="font-semibold text-dark">
                        {formatPrice(order.taxPrice)}
                      </span>
                    </div>

                    <div className="flex justify-between text-gray-600">
                      <span>Shipping Price</span>
                      <span className="font-semibold text-dark">
                        {order.shippingPrice === 0
                          ? "Free"
                          : formatPrice(order.shippingPrice)}
                      </span>
                    </div>

                    <div className="border-t border-gray-3 pt-3 flex justify-between text-base font-bold text-dark">
                      <span>Total Order Price</span>
                      <span className="text-xl text-blue">
                        {formatPrice(order.totalOrderPrice)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-3 space-y-2">
                    <button
                      type="button"
                      onClick={() => setIsStatusModalOpen(true)}
                      className="w-full rounded-lg bg-blue py-2.5 text-center text-sm font-semibold text-white hover:bg-blue-dark transition-colors"
                    >
                      Change Status
                    </button>
                    <Link
                      href="/admin/orders"
                      className="block w-full rounded-lg border border-gray-3 py-2 text-center text-sm font-medium text-dark hover:bg-gray-1 transition-colors"
                    >
                      Return to Orders List
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Status Modal */}
      <UpdateStatusModal
        orderNumber={order?.orderNumber ?? null}
        currentStatus={order?.status ?? null}
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onSuccess={handleStatusUpdated}
      />
    </>
  );
};

export default AdminOrderDetails;
