"use client";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/Common/Breadcrumb";
import CancelOrderConfirmModal from "@/components/Orders/CancelOrderConfirmModal";
import RequestReturnModal from "@/components/Orders/RequestReturnModal";
import OrderReturns from "@/components/Orders/OrderReturns";
import { ordersApi } from "@/lib/api/orders.api";
import { returnsApi } from "@/lib/api/returns.api";
import { OrderResponse } from "@/types/order-api";
import { ReturnResponse } from "@/types/return-api";
import {
  canCancelOrder,
  formatAddress,
  formatDateTime,
  formatPrice,
  getApiErrorMessage,
  getStatusLabel,
  getStatusStyle,
} from "@/lib/order-utils";
import InvoiceButton from "./InvoiceButton";
import OrderPayment from "./OrderPayment";

type CustomerOrderDetailsPageProps = {
  orderNumber: string;
};

const CustomerOrderDetailsPage: React.FC<CustomerOrderDetailsPageProps> = ({
  orderNumber,
}) => {
  const router = useRouter();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returns, setReturns] = useState<ReturnResponse[]>([]);

  const fetchReturns = useCallback(async () => {
    try {
      setReturns(await returnsApi.getForOrder(orderNumber));
    } catch {
      setReturns([]);   // the order itself still shows
    }
  }, [orderNumber]);

  const fetchOrder = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await ordersApi.getMyOrder(orderNumber);
      setOrder(data);
      if (data.status === "DELIVERED") fetchReturns();
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to load this order. It may not exist or you may not have permission to view it."
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [orderNumber, fetchReturns]);

  useEffect(() => {
    if (orderNumber) {
      fetchOrder();
    }
  }, [orderNumber, fetchOrder]);

  return (
    <>
      <Breadcrumb
        title={`Order Details`}
        pages={["My Account", `Order #${orderNumber}`]}
      />

      <section className="bg-gray-2 py-12 sm:py-16 lg:py-20">
        <div className="site-container">
          {/* Loading */}
          {isLoading && (
            <div className="rounded-2xl bg-white p-12 text-center shadow-1">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-blue border-r-transparent"></div>
              <p className="mt-4 text-sm font-medium text-gray-500">
                Loading order details...
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
                  href="/my-account?tab=orders"
                  className="rounded-lg border border-gray-3 bg-white px-5 py-2.5 text-sm font-medium text-dark hover:bg-gray-1 transition-colors"
                >
                  Go to My Account
                </Link>
              </div>
            </div>
          )}

          {/* Order Details View */}
          {!isLoading && !error && order && (
            <div className="space-y-6">
              {/* Order Header Card */}
              <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-3 pb-6">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-2xl sm:text-3xl font-bold text-dark">
                        Order #{order.orderNumber}
                      </h1>
                      <span
                        className={`inline-block text-xs font-semibold py-1 px-3.5 rounded-full ${getStatusStyle(
                          order.status
                        )}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Placed on {formatDateTime(order.orderDate)}
                      {order.updateDate && (
                        <span>
                          {" "}
                          &bull; Last updated {formatDateTime(order.updateDate)}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <InvoiceButton orderNumber={order.orderNumber} status={order.status} />
                    {order.status === "DELIVERED" && (
                      <Link
                        href={`/account/orders/${encodeURIComponent(order.orderNumber)}/return`}
                        className="rounded-lg border border-blue bg-blue/5 px-4 py-2 text-sm font-medium text-blue hover:bg-blue hover:text-white transition-colors"
                      >
                        Return Items
                      </Link>
                    )}
                    {canCancelOrder(order.status) && (
                      <button
                        type="button"
                        onClick={() => setIsCancelModalOpen(true)}
                        className="rounded-lg border border-red px-4 py-2 text-sm font-medium text-red hover:bg-red hover:text-white transition-colors"
                      >
                        Cancel Order
                      </button>
                    )}
                    <Link
                      href="/my-account?tab=orders"
                      className="rounded-lg border border-gray-3 bg-white px-4 py-2 text-sm font-medium text-dark hover:bg-gray-1 transition-colors"
                    >
                      Back to My Orders
                    </Link>
                  </div>
                </div>

                {/* Customer and Address Information */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-xl bg-gray-1 p-5 border border-gray-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                      Shipping Address
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

                  <div className="rounded-xl bg-gray-1 p-5 border border-gray-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                      Customer Information
                    </h2>
                    {order.customer ? (
                      <div className="text-sm text-dark space-y-1">
                        <p className="font-semibold">{order.customer.name}</p>
                        <p className="text-gray-600">{order.customer.email}</p>
                        {order.customer.phone && (
                          <p className="text-gray-600">{order.customer.phone}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Authenticated customer
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Also on cancelled orders, to show the refund; hides itself if nothing was paid */}
              <OrderPayment order={order} onChange={fetchOrder} />

              {/* Items and Financial Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Items Table */}
                <div className="lg:col-span-2 rounded-2xl bg-white p-6 sm:p-8 shadow-1">
                  <h2 className="text-lg font-bold text-dark mb-4">
                    Items in this Order ({order.items?.length || 0})
                  </h2>

                  <div className="overflow-x-auto rounded-xl border border-gray-3">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-1 text-xs uppercase text-gray-500 border-b border-gray-3">
                        <tr>
                          <th className="py-3 px-4">Item</th>
                          <th className="py-3 px-3">SKU</th>
                          <th className="py-3 px-3">Variant</th>
                          <th className="py-3 px-3 text-center">Qty</th>
                          <th className="py-3 px-3 text-right">Price</th>
                          <th className="py-3 px-4 text-right">Total</th>
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
                                {item.productName}
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
                            <td className="py-3 px-3 text-center text-dark font-medium">
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

                {/* Summary Card */}
                <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-1 h-fit">
                  <h2 className="text-lg font-bold text-dark mb-4">
                    Order Summary
                  </h2>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span className="font-medium text-dark">
                        {formatPrice(order.subtotal)}
                      </span>
                    </div>

                    {order.discountAmount > 0 && (
                      <div className="flex justify-between text-green font-medium">
                        <span>
                          Discount
                          {order.couponCodes?.length > 0 && (
                            <span className="block text-xs text-gray-500 font-normal">
                              Code: {order.couponCodes.join(", ")}
                            </span>
                          )}
                        </span>
                        <span>-{formatPrice(order.discountAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-gray-600">
                      <span>Estimated Tax</span>
                      <span className="font-medium text-dark">
                        {formatPrice(order.taxPrice)}
                      </span>
                    </div>

                    <div className="flex justify-between text-gray-600">
                      <span>Shipping Fee</span>
                      <span className="font-medium text-dark">
                        {order.shippingPrice === 0
                          ? "Free"
                          : formatPrice(order.shippingPrice)}
                      </span>
                    </div>

                    <div className="border-t border-gray-3 pt-3 flex justify-between text-base font-bold text-dark">
                      <span>Total</span>
                      <span className="text-xl text-blue">
                        {formatPrice(order.totalOrderPrice)}
                      </span>
                    </div>

                    {order.refundedAmount > 0 && (
                      <div className="flex justify-between text-green font-medium">
                        <span>Refunded</span>
                        <span>-{formatPrice(order.refundedAmount)}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-3">
                    <Link
                      href="/shop-with-sidebar"
                      className="block w-full rounded-lg bg-blue py-3 text-center text-sm font-medium text-white hover:bg-blue-dark transition-colors"
                    >
                      Continue Shopping
                    </Link>
                  </div>
                </div>
              </div>

              <OrderReturns returns={returns} onChange={fetchOrder} />
            </div>
          )}
        </div>
      </section>

      <RequestReturnModal
        orderNumber={orderNumber}
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        onSuccess={fetchReturns}
      />

      {/* Cancel Order Modal */}
      <CancelOrderConfirmModal
        orderNumber={orderNumber}
        isOpen={isCancelModalOpen}
        paidAmount={order?.status === "PAID" ? order.totalOrderPrice : null}
        onClose={() => setIsCancelModalOpen(false)}
        onSuccess={() => {
          setIsCancelModalOpen(false);
          fetchOrder();
        }}
      />
    </>
  );
};

export default CustomerOrderDetailsPage;
