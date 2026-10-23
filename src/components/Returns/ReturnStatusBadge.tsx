"use client";
import React from "react";
import { ReturnStatus } from "@/types/return-api";
import { getReturnStatusLabel, getReturnStatusStyle } from "@/lib/return-utils";

type ReturnStatusBadgeProps = {
  status: ReturnStatus | string;
  size?: "sm" | "md";
};

const ReturnStatusBadge: React.FC<ReturnStatusBadgeProps> = ({
  status,
  size = "md",
}) => {
  const sizeClasses =
    size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3.5 py-1 text-xs font-semibold";

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium transition-colors ${sizeClasses} ${getReturnStatusStyle(
        status
      )}`}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {getReturnStatusLabel(status)}
    </span>
  );
};

export default ReturnStatusBadge;
