"use client";
import React, { useState } from "react";
import { ordersApi } from "@/lib/api/orders.api";
import { formatPrice, getApiErrorMessage } from "@/lib/order-utils";
import toast from "react-hot-toast";

type CancelOrderConfirmModalProps = {
  orderNumber: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (orderNumber: string) => void;
  /** Set when the order is already paid: cancelling refunds this amount automatically. */
  paidAmount?: number | null;
};

const CancelOrderConfirmModal: React.FC<CancelOrderConfirmModalProps> = ({
  orderNumber,
  isOpen,
  onClose,
  onSuccess,
  paidAmount,
}) => {
  const isPaid = Boolean(paidAmount && paidAmount > 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !orderNumber) return null;

  const handleConfirmCancel = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await ordersApi.cancelMyOrder(orderNumber);
      toast.success(
        isPaid
          ? `Order #${orderNumber} cancelled. ${formatPrice(paidAmount)} is being refunded to your card.`
          : `Order #${orderNumber} has been cancelled successfully.`
      );
      onSuccess(orderNumber);
      onClose();
    } catch (err) {
      const message = getApiErrorMessage(err, "Unable to cancel this order.");
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
      aria-labelledby="cancel-modal-title"
      className="fixed inset-0 z-[100000] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-light-6 text-red">
            <svg
              className="h-6 w-6"
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
          <div>
            <h3
              id="cancel-modal-title"
              className="text-lg font-bold text-dark"
            >
              Cancel Order
            </h3>
            <p className="text-xs text-gray-500">Order #{orderNumber}</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-gray-600">
          Are you sure you want to cancel this order? This action cannot be
          undone, and any reserved items will be returned to stock.
        </p>
        {isPaid && (
          <p className="mt-3 rounded-lg bg-blue-light-5 p-3 text-sm text-blue">
            You&apos;ve already paid {formatPrice(paidAmount)}. It will be refunded to your
            card automatically; it can take 5–10 business days to show on your statement.
          </p>
        )}

        {error && (
          <div className="mt-3 rounded-lg bg-red-light-6 p-3 text-xs text-red">
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-gray-3 px-4 py-2 text-sm font-medium text-dark hover:bg-gray-1 transition-colors disabled:opacity-50"
          >
            Keep Order
          </button>
          <button
            type="button"
            onClick={handleConfirmCancel}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-red px-5 py-2 text-sm font-medium text-white hover:bg-red-dark transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                Cancelling...
              </>
            ) : (
              "Yes, Cancel Order"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelOrderConfirmModal;
