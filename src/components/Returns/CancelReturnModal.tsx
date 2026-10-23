"use client";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { returnsApi } from "@/lib/api/returns.api";
import { getApiErrorMessage } from "@/lib/order-utils";

type CancelReturnModalProps = {
  returnNumber: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const CancelReturnModal: React.FC<CancelReturnModalProps> = ({
  returnNumber,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCancel = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await returnsApi.cancel(returnNumber);
      toast.success(`Return #${returnNumber} has been cancelled.`);
      onSuccess();
      onClose();
    } catch (err) {
      const message = getApiErrorMessage(
        err,
        "Failed to cancel return request. Please try again."
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
      aria-labelledby="cancel-return-title"
      className="fixed inset-0 z-[100000] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-light-6 text-red">
          <svg
            className="h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h3
          id="cancel-return-title"
          className="text-center text-xl font-bold text-dark"
        >
          Cancel Return #{returnNumber}?
        </h3>

        <p className="mt-3 text-center text-sm text-gray-600">
          Are you sure you want to cancel this return request? Once cancelled,
          this action <strong className="text-dark">cannot be undone</strong>,
          and you will need to submit a new return request if you still wish to
          return items within the return window.
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-light-6 p-3 text-sm text-red">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full rounded-lg border border-gray-3 bg-white px-5 py-2.5 text-sm font-medium text-dark hover:bg-gray-1 disabled:opacity-50 sm:w-auto"
          >
            Keep Return
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="w-full rounded-lg bg-red px-5 py-2.5 text-sm font-medium text-white hover:bg-red/90 disabled:opacity-50 sm:w-auto"
          >
            {isSubmitting ? "Cancelling…" : "Yes, Cancel Return"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelReturnModal;
