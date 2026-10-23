"use client";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ordersApi } from "@/lib/api/orders.api";
import { OrderStatus, OrderSummaryResponse } from "@/types/order-api";
import {
  ALL_ORDER_STATUSES,
  formatDateTime,
  formatPrice,
  getApiErrorMessage,
  getStatusLabel,
  getStatusStyle,
} from "@/lib/order-utils";
import UpdateStatusModal from "./UpdateStatusModal";

type AdminOrdersListProps = {
  onOrderUpdated?: () => void;
};

const PAGE_SIZE = 10;

const AdminOrdersList: React.FC<AdminOrdersListProps> = ({
  onOrderUpdated,
}) => {
  const [orders, setOrders] = useState<OrderSummaryResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status modal state
  const [statusModalOrder, setStatusModalOrder] = useState<{
    orderNumber: string;
    status: OrderStatus;
  } | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(0);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await ordersApi.getOrders({
        search: debouncedSearch,
        status: (selectedStatus as OrderStatus) || undefined,
        page: currentPage,
        size: PAGE_SIZE,
        sort: "orderDate,desc",
      });

      setOrders(data.content || []);
      setCurrentPage(data.currentPage ?? 0);
      setTotalPages(data.totalPages ?? 0);
      setTotalElements(data.totalElements ?? 0);
      setHasNext(Boolean(data.hasNext));
      setHasPrevious(Boolean(data.hasPrevious));
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Failed to load administrative orders. Please verify backend connection."
        )
      );
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, selectedStatus, currentPage]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusUpdateSuccess = () => {
    fetchOrders();
    onOrderUpdated?.();
  };

  return (
    <div className="rounded-2xl bg-white p-6 sm:p-7 shadow-1 border border-gray-3">
      {/* Search and Filters Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-gray-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-dark">
            All Customer Orders
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Search, filter, and manage order statuses across the system
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <input
              type="text"
              placeholder="Search order #, name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-3 bg-gray-1 py-2 pl-9 pr-3 text-xs sm:text-sm text-dark placeholder:text-gray-400 focus:border-blue focus:outline-none"
            />
            <svg
              className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-2.5 text-xs text-gray-400 hover:text-dark"
              >
                &times;
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(0);
            }}
            className="rounded-lg border border-gray-3 bg-gray-1 py-2 px-3 text-xs sm:text-sm text-dark focus:border-blue focus:outline-none"
          >
            <option value="">All Statuses</option>
            {ALL_ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {getStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content Section */}
      <div className="mt-6">
        {/* Loading Spinner */}
        {isLoading && (
          <div className="py-16 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue border-r-transparent"></div>
            <p className="mt-3 text-xs sm:text-sm text-gray-500">
              Fetching orders from backend...
            </p>
          </div>
        )}

        {/* Error Notice */}
        {!isLoading && error && (
          <div className="my-6 rounded-xl bg-red-light-6 p-6 text-center text-red">
            <p className="text-sm font-medium">{error}</p>
            <button
              type="button"
              onClick={fetchOrders}
              className="mt-3 rounded-lg bg-blue px-4 py-2 text-xs font-semibold text-white hover:bg-blue-dark transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && orders.length === 0 && (
          <div className="py-16 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-2 text-gray-400">
              <svg
                className="h-7 w-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-base font-bold text-dark">No orders found</h3>
            <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
              {searchTerm || selectedStatus
                ? "No orders match your filter criteria. Try adjusting your search query or status filter."
                : "No customer orders have been placed in the system yet."}
            </p>
            {(searchTerm || selectedStatus) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedStatus("");
                }}
                className="mt-4 rounded-lg bg-gray-2 px-4 py-1.5 text-xs font-medium text-dark hover:bg-gray-3 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Orders Table */}
        {!isLoading && !error && orders.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-gray-3">
            <table className="w-full table-auto text-left text-sm">
              <thead className="bg-gray-1 text-xs uppercase tracking-wider text-gray-500 border-b border-gray-3">
                <tr>
                  <th className="py-3.5 px-4 whitespace-nowrap">Order Number</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Customer</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Order Date</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">Items</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Total Price</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-3">
                {orders.map((order) => (
                  <tr
                    key={order.orderNumber}
                    className="hover:bg-gray-1/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-dark text-xs sm:text-sm whitespace-nowrap">
                      <Link
                        href={`/admin/orders/${encodeURIComponent(
                          order.orderNumber
                        )}`}
                        className="text-blue hover:underline"
                        title="View order details"
                      >
                        #{order.orderNumber}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-medium text-dark text-xs sm:text-sm">
                        {order.customerName || "Customer"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.customerEmail}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-gray-600 whitespace-nowrap">
                      {formatDateTime(order.orderDate)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block text-xs font-semibold py-1 px-3 rounded-full ${getStatusStyle(
                          order.status
                        )}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-center font-medium text-dark text-xs sm:text-sm whitespace-nowrap">
                      {order.itemCount}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-dark text-xs sm:text-sm whitespace-nowrap">
                      {formatPrice(order.totalOrderPrice)}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setStatusModalOrder({
                              orderNumber: order.orderNumber,
                              status: order.status,
                            })
                          }
                          className="rounded-lg border border-gray-3 bg-white px-3 py-1.5 text-xs font-medium text-dark hover:bg-gray-1 hover:border-gray-4 transition-colors"
                        >
                          Change Status
                        </button>
                        <Link
                          href={`/admin/orders/${encodeURIComponent(
                            order.orderNumber
                          )}`}
                          className="rounded-lg bg-blue px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-dark transition-colors"
                        >
                          Details
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!isLoading && !error && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 mt-2 text-sm">
            <p className="text-xs text-gray-500">
              Page <span className="font-semibold text-dark">{currentPage + 1}</span> of{" "}
              <span className="font-semibold text-dark">{totalPages}</span> ({totalElements} orders total)
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!hasPrevious || currentPage === 0}
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                className="rounded-lg border border-gray-3 bg-white px-3 py-1.5 text-xs font-medium text-dark hover:bg-gray-1 transition-colors disabled:opacity-40 disabled:pointer-events-none"
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
                className="rounded-lg border border-gray-3 bg-white px-3 py-1.5 text-xs font-medium text-dark hover:bg-gray-1 transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status Modal */}
      <UpdateStatusModal
        orderNumber={statusModalOrder?.orderNumber ?? null}
        currentStatus={statusModalOrder?.status ?? null}
        isOpen={Boolean(statusModalOrder)}
        onClose={() => setStatusModalOrder(null)}
        onSuccess={handleStatusUpdateSuccess}
      />
    </div>
  );
};

export default AdminOrdersList;
