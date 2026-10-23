"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { ordersApi } from "@/lib/api/orders.api";
import { getApiErrorMessage, hasInvoice } from "@/lib/order-utils";

type Props = {
  orderNumber: string;
  status: string;
  /** Small pill for table rows; default is a regular button for detail views. */
  compact?: boolean;
};

/** Downloads the order's PDF invoice. Renders nothing for orders that have none (unpaid/cancelled). */
const InvoiceButton = ({ orderNumber, status, compact = false }: Props) => {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!hasInvoice(status)) return null;

  const download = async () => {
    setIsDownloading(true);
    try {
      await ordersApi.downloadMyInvoice(orderNumber);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to download the invoice."));
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void download()}
      disabled={isDownloading}
      title={`Download invoice for order #${orderNumber} (PDF)`}
      className={
        compact
          ? "inline-flex items-center gap-1 rounded border border-gray-3 bg-white px-2 py-0.5 text-[11px] font-medium text-dark hover:border-blue hover:text-blue transition-colors disabled:opacity-60"
          : "inline-flex items-center gap-1.5 rounded-lg border border-gray-3 bg-white px-4 py-2 text-sm font-medium text-dark hover:border-blue hover:text-blue transition-colors disabled:opacity-60"
      }
    >
      <svg
        className={compact ? "h-3 w-3" : "h-4 w-4"}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 10v6m0 0l-3-3m3 3l3-3M6 20h12a2 2 0 002-2V8l-6-6H6a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      </svg>
      {isDownloading ? "Downloading…" : "Invoice"}
    </button>
  );
};

export default InvoiceButton;
