// Mirrors the Spring DTOs in ecommerce-api/returns/dto.
export type ReturnStatus =
  | "REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "RECEIVED"
  | "CANCELLED";

export type ReturnItemCondition = "RESTOCK" | "DAMAGED";

export type ReturnItemResponse = {
  id: number;
  orderItemId: number;
  productVariantId?: number;
  productName: string;
  sku?: string | null;
  color?: string | null;
  sizeName?: string | null;
  imageUrl?: string | null;
  quantity: number;
  unitPrice: number;
  condition?: ReturnItemCondition | string | null;
};

export type ReturnResponse = {
  returnNumber: string;
  status: ReturnStatus;
  orderNumber: string;
  customerName?: string;
  customerEmail?: string;
  reason: string;
  /** Message from the store, e.g. why a return was rejected. */
  adminNote: string | null;
  estimatedRefund: number;
  /** Set once the store has received the items. */
  refundAmount: number | null;
  items: ReturnItemResponse[];
  createdAt: string;
  updatedAt: string;
  receivedAt: string | null;
};

export type ReturnEligibilityItem = {
  orderItemId: number;
  quantity?: number;
  productVariantId?: number;
  productName?: string;
  sku?: string | null;
  color?: string | null;
  sizeName?: string | null;
  imageUrl?: string | null;
  unitPrice?: number;
  purchasedQuantity?: number;
  returnableQuantity?: number;
};

export type ReturnEligibilityResponse = {
  orderNumber: string;
  eligible: boolean;
  /** Why not, when eligible is false. */
  reason: string | null;
  returnableUntil: string | null;
  items: ReturnEligibilityItem[];
};

/** One of my orders a return can still be requested for. */
export type ReturnableOrderResponse = {
  orderNumber: string;
  orderDate: string;
  deliveredAt: string | null;
  /** null only for old orders delivered before the delivery date was recorded. */
  returnableUntil: string | null;
  totalOrderPrice: number;
  /** Units purchased across all lines. */
  itemCount: number;
  /** Units not yet in an open or completed return. */
  returnableItemCount: number;
};

export interface ReturnRequestItem {
  orderItemId: number;
  quantity: number;
}

export type CreateReturnRequest = {
  orderNumber: string;
  reason: string;
  items: ReturnRequestItem[];
};

// Section 4 Model Aliases for compatibility
export type ReturnItem = ReturnItemResponse;
export type ReturnRecord = ReturnResponse;
export type ReturnEligibility = ReturnEligibilityResponse;

export type ReturnPageResponse = {
  content: ReturnResponse[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

