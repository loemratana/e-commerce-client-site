"use client";
import React, { useState } from "react";
import { ordersApi } from "@/lib/api/orders.api";
import { OrderStatus } from "@/types/order-api";
import {
  ALL_ORDER_STATUSES,
  ALLOWED_STATUS_TRANSITIONS,
  getApiErrorMessage,
  getStatusLabel,
  getStatusStyle,
} from "@/lib/order-utils";
import toast from "react-hot-toast";

type UpdateStatusModalProps = {
  orderNumber: string | null;
  currentStatus: OrderStatus | string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (orderNumber: string, newStatus: OrderStatus) => void;
};

const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({
  orderNumber,
  currentStatus,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const normCurrentStatus = (currentStatus?.toUpperCase() ||
    "PENDING") as OrderStatus;
  const allowedNext =
    ALLOWED_STATUS_TRANSITIONS[normCurrentStatus] || [];

  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(
    allowedNext.length > 0 ? allowedNext[0] : normCurrentStatus
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !orderNumber) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatus) {
      toast.error("Please select a status.");
      return;
    }

    if (selectedStatus === normCurrentStatus) {
      toast.error("The selected status is identical to current status.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await ordersApi.updateOrderStatus(orderNumber, {
        status: selectedStatus,
      });
      toast.success(
        `Order #${orderNumber} status changed to ${getStatusLabel(
          selectedStatus
        )}`
      );
      onSuccess(orderNumber, selectedStatus);
      onClose();
    } catch (err) {
      const message = getApiErrorMessage(
        err,
        "Failed to update status. Transition may not be allowed."
      );
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="update-status-title"
      className="fixed inset-0 z-[100000] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-3 pb-4">
          <h3 id="update-status-title" className="text-lg font-bold text-dark">
            Update Order Status
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-2 hover:text-dark"
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Order Number</p>
            <p className="font-mono text-sm font-semibold text-dark">
              #{orderNumber}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">Current Status</p>
            <span
              className={`inline-block text-xs font-semibold py-1 px-3 rounded-full ${getStatusStyle(
                normCurrentStatus
              )}`}
            >
              {getStatusLabel(normCurrentStatus)}
            </span>
          </div>

          <div>
            <label
              htmlFor="status-select"
              className="block text-xs font-semibold uppercase text-gray-600 mb-1.5"
            >
              New Status
            </label>

            <select
              id="status-select"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value as OrderStatus);
                setError(null);
              }}
              className="w-full rounded-lg border border-gray-3 bg-gray-1 py-2.5 px-3.5 text-sm text-dark focus:border-blue focus:outline-none"
            >
              {ALL_ORDER_STATUSES.map((statusOption) => {
                const isRecommended = allowedNext.includes(statusOption);
                const isCurrent = statusOption === normCurrentStatus;
                return (
                  <option
                    key={statusOption}
                    value={statusOption}
                    disabled={isCurrent}
                  >
                    {getStatusLabel(statusOption)}
                    {isCurrent ? " (Current)" : ""}
                    {isRecommended ? " (Recommended)" : ""}
                  </option>
                );
              })}
            </select>

            {allowedNext.length > 0 ? (
              <p className="mt-1 text-xs text-gray-500">
                Valid standard transitions:{" "}
                <span className="font-semibold text-dark">
                  {allowedNext.map(getStatusLabel).join(", ")}
                </span>
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                This order is in a terminal status ({getStatusLabel(normCurrentStatus)}).
              </p>
            )}
          </div>

          {error && (
            <div className="rounded-lg bg-red-light-6 p-3 text-xs text-red">
              {error}
            </div>
          )}

          <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-gray-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-gray-3 px-4 py-2 text-sm font-medium text-dark hover:bg-gray-1 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedStatus === normCurrentStatus}
              className="inline-flex items-center gap-2 rounded-lg bg-blue px-5 py-2 text-sm font-medium text-white hover:bg-blue-dark transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateStatusModal;
