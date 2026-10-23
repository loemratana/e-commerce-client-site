"use client";
import React, { useEffect, useState } from "react";
import { ordersApi } from "@/lib/api/orders.api";
import { OrderStatsResponse } from "@/types/order-api";
import {
  formatPrice,
  getApiErrorMessage,
  getStatusLabel,
  getStatusStyle,
} from "@/lib/order-utils";

type OrderStatsWidgetProps = {
  refreshKey?: number;
  onRefresh?: () => void;
};

const OrderStatsWidget: React.FC<OrderStatsWidgetProps> = ({
  refreshKey = 0,
  onRefresh,
}) => {
  const [stats, setStats] = useState<OrderStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await ordersApi.getOrderStatistics();
      setStats(data);
    } catch (err) {
      setError(
        getApiErrorMessage(err, "Unable to load dashboard order statistics.")
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshKey]);

  return (
    <div className="mb-8 rounded-2xl bg-white p-6 sm:p-7 shadow-1 border border-gray-3">
      <div className="flex items-center justify-between pb-5 border-b border-gray-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-dark">
            Order Statistics Overview
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Real-time authoritative backend totals and status distribution
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            fetchStats();
            onRefresh?.();
          }}
          disabled={isLoading}
          title="Refresh order statistics"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-3 px-3 py-1.5 text-xs font-medium text-dark hover:bg-gray-1 transition-colors disabled:opacity-50"
        >
          <svg
            className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      {isLoading && (
        <div className="py-10 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue border-r-transparent"></div>
          <p className="mt-2 text-xs text-gray-500">Loading order statistics...</p>
        </div>
      )}

      {!isLoading && error && (
        <div className="my-4 rounded-xl bg-red-light-6 p-4 text-center text-xs text-red">
          <p>{error}</p>
          <button
            type="button"
            onClick={fetchStats}
            className="mt-2 font-semibold text-blue underline hover:text-blue-dark"
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !error && stats && (
        <div className="mt-6 space-y-6">
          {/* Top Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Total Revenue */}
            <div className="rounded-xl bg-gradient-to-br from-blue-light-5 to-white p-5 border border-blue/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue">
                    Total Revenue
                  </p>
                  <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-dark">
                    {formatPrice(stats.totalRevenue)}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue text-white">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Orders */}
            <div className="rounded-xl bg-gradient-to-br from-gray-1 to-white p-5 border border-gray-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Total Orders
                  </p>
                  <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-dark">
                    {stats.totalOrders}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-dark text-white">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Status Breakdown */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
              Orders Grouped by Status
            </h3>

            {stats.byStatus && Object.keys(stats.byStatus).length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {Object.entries(stats.byStatus).map(([statusKey, count]) => {
                  const percentage =
                    stats.totalOrders > 0
                      ? Math.round((count / stats.totalOrders) * 100)
                      : 0;
                  return (
                    <div
                      key={statusKey}
                      className="rounded-xl border border-gray-3 p-3.5 bg-gray-1/40 hover:bg-white hover:shadow-1 transition-all"
                    >
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span
                          className={`text-[10px] font-bold py-0.5 px-2 rounded-full uppercase ${getStatusStyle(
                            statusKey
                          )}`}
                        >
                          {getStatusLabel(statusKey)}
                        </span>
                        <span className="text-[11px] text-gray-400 font-medium">
                          {percentage}%
                        </span>
                      </div>
                      <p className="text-xl font-bold text-dark">{count}</p>
                      <p className="text-[11px] text-gray-500">
                        {count === 1 ? "order" : "orders"}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-400">
                No orders breakdown available.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderStatsWidget;
