"use client";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { returnsApi } from "@/lib/api/returns.api";
import { ReturnResponse, ReturnStatus } from "@/types/return-api";
import ReturnStatusBadge from "./ReturnStatusBadge";
import CancelReturnModal from "./CancelReturnModal";
import SelectReturnOrderModal from "./SelectReturnOrderModal";
import RequestReturnModal from "@/components/Orders/RequestReturnModal";
import { hasAccessToken, requestAuthentication } from "@/lib/auth-prompt";
import { formatDate, formatPrice, getApiErrorMessage } from "@/lib/order-utils";
import { canCancelReturn } from "@/lib/return-utils";

const itemCount = (r: ReturnResponse) =>
  r.items.reduce((sum, item) => sum + (item.quantity ?? 1), 0);

const ItemsSummary = ({ r }: { r: ReturnResponse }) => {
  const first = r.items[0];
  if (!first) return <span className="text-gray-400">—</span>;

  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-gray-3 bg-white">
        {first.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={first.imageUrl}
            alt={first.productName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">
            No img
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate max-w-[200px] font-medium text-dark">
          {first.productName}
        </p>
        <p className="text-xs text-gray-500">
          {itemCount(r)} {itemCount(r) === 1 ? "item" : "items"}
          {r.items.length > 1 ? ` · +${r.items.length - 1} more` : ""}
        </p>
      </div>
    </div>
  );
};

const RefundAmount = ({ r }: { r: ReturnResponse }) =>
  r.refundAmount !== null ? (
    <span className="font-bold text-green">{formatPrice(r.refundAmount)}</span>
  ) : (
    <span className="text-dark font-semibold" title="Estimated refund">
      ~{formatPrice(r.estimatedRefund)}
    </span>
  );

const PAGE_SIZE = 10;

type FilterStatus = "ALL" | ReturnStatus;

const MyReturnsList: React.FC = () => {
  const [returns, setReturns] = useState<ReturnResponse[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  // "Request a return": pick a delivered order, then the item/reason form for it.
  const [isPickingOrder, setIsPickingOrder] = useState(false);
  const [returnOrderNumber, setReturnOrderNumber] = useState<string | null>(null);
  const [cancelReturnNumber, setCancelReturnNumber] = useState<string | null>(null);

  const fetchReturns = useCallback(async (page: number) => {
    if (!hasAccessToken()) {
      requestAuthentication();
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await returnsApi.getMyReturns({
        page,
        size: PAGE_SIZE,
      });

      setReturns(data.content || []);
      setCurrentPage(data.currentPage ?? page);
      setTotalPages(data.totalPages ?? 0);
      setTotalElements(data.totalElements ?? 0);
      setHasNext(Boolean(data.hasNext));
      setHasPrevious(Boolean(data.hasPrevious));
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load your returns."));
      setReturns([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReturns(currentPage);
  }, [fetchReturns, currentPage]);

  const startReturnRequest = () => {
    if (!hasAccessToken()) {
      requestAuthentication();
      return;
    }
    setIsPickingOrder(true);
  };

  const closePicker = useCallback(() => setIsPickingOrder(false), []);

  const handleOrderSelected = (orderNumber: string) => {
    setIsPickingOrder(false);
    setReturnOrderNumber(orderNumber);
  };

  // Newest first, so the new return is at the top of page 1.
  const handleReturnRequested = () => {
    if (currentPage === 0) {
      fetchReturns(0);
    } else {
      setCurrentPage(0);
    }
  };

  // Client-side filtering by status or search keyword (return number or order number)
  const filteredReturns = returns.filter((r) => {
    if (statusFilter !== "ALL" && r.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const matchesReturnNumber = r.returnNumber.toLowerCase().includes(query);
      const matchesOrderNumber = r.orderNumber.toLowerCase().includes(query);
      const matchesProduct = r.items.some((item) =>
        item.productName.toLowerCase().includes(query)
      );
      return matchesReturnNumber || matchesOrderNumber || matchesProduct;
    }
    return true;
  });

  return (
    <div className="w-full">
      {/* Header filter & search bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-gray-3 bg-white p-1">
          {(
            [
              { id: "ALL", label: "All" },
              { id: "REQUESTED", label: "Requested" },
              { id: "APPROVED", label: "Approved" },
              { id: "RECEIVED", label: "Refunded" },
              { id: "REJECTED", label: "Rejected" },
              { id: "CANCELLED", label: "Cancelled" },
            ] as const
          ).map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setStatusFilter(filter.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === filter.id
                  ? "bg-blue text-white"
                  : "text-dark hover:bg-gray-1"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search Input */}
        <div className="relative min-w-[200px] max-w-xs">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search return or order #"
            className="w-full rounded-lg border border-gray-3 bg-white px-3.5 py-2 pl-9 text-xs text-dark outline-none focus:border-blue"
          />
          <svg
            className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <button
          type="button"
          onClick={startReturnRequest}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue px-4 py-2 text-xs font-semibold text-white hover:bg-blue-dark transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Request a Return
        </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="overflow-hidden rounded-xl border border-gray-3 bg-white shadow-1">
          <div className="h-11 bg-gray-1 border-b border-gray-3" />
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="flex animate-pulse items-center gap-4 border-b border-gray-3 px-5 py-4 last:border-b-0"
            >
              <div className="h-4 w-28 rounded bg-gray-2" />
              <div className="h-10 w-10 rounded bg-gray-2" />
              <div className="h-4 flex-1 rounded bg-gray-2" />
              <div className="h-5 w-20 rounded-full bg-gray-2" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="rounded-xl border border-red/30 bg-red-light-6 p-6 text-center text-red shadow-1">
          <p className="text-sm font-medium">{error}</p>
          <button
            type="button"
            onClick={() => fetchReturns(currentPage)}
            className="mt-4 rounded-lg bg-blue px-4 py-2 text-xs font-semibold text-white hover:bg-blue-dark transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && returns.length === 0 && (
        <div className="rounded-xl border border-gray-3 bg-white p-12 text-center shadow-1">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-light-5 text-blue">
            <svg
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-dark">No returns found</h3>
          <p className="mt-2 text-sm text-gray-500">
            You have not requested any returns yet. If you have an issue with an
            item from a delivered order, you can request a return here.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={startReturnRequest}
              className="inline-block rounded-lg bg-blue px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-dark transition-colors"
            >
              Request a Return
            </button>
            <Link
              href="/my-account?tab=orders"
              className="inline-block rounded-lg border border-gray-3 bg-white px-6 py-2.5 text-sm font-medium text-dark hover:bg-gray-1 transition-colors"
            >
              View My Orders
            </Link>
          </div>
        </div>
      )}

      {/* No Results from Filter */}
      {!isLoading && !error && returns.length > 0 && filteredReturns.length === 0 && (
        <div className="rounded-xl border border-gray-3 bg-white p-8 text-center text-sm text-gray-500 shadow-1">
          No returns matched your selected filter or search criteria.
          <button
            type="button"
            onClick={() => {
              setStatusFilter("ALL");
              setSearchQuery("");
            }}
            className="mt-3 block mx-auto text-xs font-semibold text-blue hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Returns List */}
      {!isLoading && !error && filteredReturns.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-3 bg-white shadow-1">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full table-auto text-left">
              <thead className="bg-gray-1 border-b border-gray-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="py-3.5 px-4 sm:px-5 whitespace-nowrap">Return Number</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Order</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Requested</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Items</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Reason</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Status</th>
                  <th className="py-3.5 px-3 text-right whitespace-nowrap">Refund</th>
                  <th className="py-3.5 px-4 sm:px-5 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-3 text-sm">
                {filteredReturns.map((r) => (
                  <tr key={r.returnNumber} className="hover:bg-gray-1/40 transition-colors">
                    <td className="py-3.5 px-4 sm:px-5 font-mono font-semibold whitespace-nowrap">
                      <Link
                        href={`/account/returns/${encodeURIComponent(r.returnNumber)}`}
                        className="text-blue hover:underline"
                      >
                        #{r.returnNumber}
                      </Link>
                    </td>
                    <td className="py-3.5 px-3 font-mono whitespace-nowrap">
                      <Link
                        href={`/orders/${encodeURIComponent(r.orderNumber)}`}
                        className="text-dark hover:text-blue hover:underline"
                      >
                        #{r.orderNumber}
                      </Link>
                    </td>
                    <td className="py-3.5 px-3 text-gray-600 whitespace-nowrap">
                      {formatDate(r.createdAt)}
                    </td>
                    <td className="py-3.5 px-3">
                      <ItemsSummary r={r} />
                    </td>
                    <td className="py-3.5 px-3 text-gray-600">
                      <span className="line-clamp-2 max-w-[180px]" title={r.reason}>
                        {r.reason}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <ReturnStatusBadge status={r.status} />
                    </td>
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      <RefundAmount r={r} />
                    </td>
                    <td className="py-3 px-4 sm:px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {canCancelReturn(r.status) && (
                          <button
                            type="button"
                            onClick={() => setCancelReturnNumber(r.returnNumber)}
                            className="rounded border border-red/40 px-2 py-0.5 text-[11px] font-medium text-red hover:bg-red hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                        <Link
                          href={`/account/returns/${encodeURIComponent(r.returnNumber)}`}
                          className="rounded bg-blue px-2.5 py-0.5 text-[11px] font-medium text-white hover:bg-blue-dark transition-colors"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden divide-y divide-gray-3">
            {filteredReturns.map((r) => (
              <div key={r.returnNumber} className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/account/returns/${encodeURIComponent(r.returnNumber)}`}
                    className="font-mono font-bold text-sm text-blue hover:underline"
                  >
                    #{r.returnNumber}
                  </Link>
                  <ReturnStatusBadge status={r.status} />
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    Order{" "}
                    <Link
                      href={`/orders/${encodeURIComponent(r.orderNumber)}`}
                      className="font-mono text-dark hover:text-blue"
                    >
                      #{r.orderNumber}
                    </Link>
                  </span>
                  <span>{formatDate(r.createdAt)}</span>
                </div>

                <div className="text-sm">
                  <ItemsSummary r={r} />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-2">
                  <div className="text-sm">
                    <span className="text-xs text-gray-400">Refund: </span>
                    <RefundAmount r={r} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {canCancelReturn(r.status) && (
                      <button
                        type="button"
                        onClick={() => setCancelReturnNumber(r.returnNumber)}
                        className="rounded border border-red/40 px-2 py-0.5 text-[11px] font-medium text-red hover:bg-red hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    <Link
                      href={`/account/returns/${encodeURIComponent(r.returnNumber)}`}
                      className="rounded bg-blue px-2.5 py-0.5 text-[11px] font-medium text-white hover:bg-blue-dark transition-colors"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-3 bg-gray-1/50 p-4 text-xs">
              <span className="text-gray-500">
                Page {currentPage + 1} of {totalPages} ({totalElements} total)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!hasPrevious}
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  className="rounded-lg border border-gray-3 bg-white px-3 py-1.5 font-medium text-dark hover:bg-gray-1 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={!hasNext}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="rounded-lg border border-gray-3 bg-white px-3 py-1.5 font-medium text-dark hover:bg-gray-1 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <CancelReturnModal
        returnNumber={cancelReturnNumber ?? ""}
        isOpen={Boolean(cancelReturnNumber)}
        onClose={() => setCancelReturnNumber(null)}
        onSuccess={() => fetchReturns(currentPage)}
      />

      {isPickingOrder && (
        <SelectReturnOrderModal onClose={closePicker} onSelect={handleOrderSelected} />
      )}

      {returnOrderNumber && (
        <RequestReturnModal
          orderNumber={returnOrderNumber}
          isOpen
          onClose={() => setReturnOrderNumber(null)}
          onSuccess={handleReturnRequested}
        />
      )}
    </div>
  );
};

export default MyReturnsList;
