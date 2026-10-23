import { ReturnResponse, ReturnStatus } from "@/types/return-api";

export const ALL_RETURN_STATUSES: ReturnStatus[] = [
  "REQUESTED",
  "APPROVED",
  "RECEIVED",
  "REJECTED",
  "CANCELLED",
];

export const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  REQUESTED: "Requested",
  APPROVED: "Approved – Ship Items",
  REJECTED: "Rejected",
  RECEIVED: "Refunded",
  CANCELLED: "Cancelled",
};

export const RETURN_STATUS_BADGE_LABELS: Record<ReturnStatus, string> = {
  REQUESTED: "Requested",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  RECEIVED: "Refunded",
  CANCELLED: "Cancelled",
};

export const RETURN_STATUS_STYLES: Record<ReturnStatus, string> = {
  REQUESTED: "text-yellow-dark bg-yellow-light-2 border border-yellow/30",
  APPROVED: "text-blue bg-blue-light-5 border border-blue/30",
  REJECTED: "text-red bg-red-light-6 border border-red/30",
  RECEIVED: "text-green bg-green-light-6 border border-green/30",
  CANCELLED: "text-gray-600 bg-gray-2 border border-gray-4",
};

export const RETURN_STAGE_DESCRIPTIONS: Record<ReturnStatus, string> = {
  REQUESTED:
    "Your return request is currently under review by our team.",
  APPROVED:
    "Your return request has been approved. Please ship the items back. Your refund will be processed once items are received and inspected.",
  REJECTED:
    "Your return request has been reviewed and rejected.",
  RECEIVED:
    "We have received and inspected your returned items. Your refund has been processed.",
  CANCELLED:
    "You have cancelled this return request.",
};

/**
 * Backend rule: cancellation is ONLY allowed while the return is in REQUESTED status.
 */
export const canCancelReturn = (status: ReturnStatus | string): boolean => {
  return status === "REQUESTED";
};

export const getReturnStatusLabel = (
  status: string | null | undefined
): string => {
  if (!status) return "-";
  const normalized = status.toUpperCase() as ReturnStatus;
  return RETURN_STATUS_BADGE_LABELS[normalized] || status;
};

export const getReturnStatusStyle = (
  status: string | null | undefined
): string => {
  if (!status) return "text-gray-600 bg-gray-2 border border-gray-3";
  const normalized = status.toUpperCase() as ReturnStatus;
  return (
    RETURN_STATUS_STYLES[normalized] ||
    "text-gray-600 bg-gray-2 border border-gray-3"
  );
};
