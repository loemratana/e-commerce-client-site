import type { PaymentMethod } from "@/types/payment-api";

export type AddressResponse = {
  id: number;
  street: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
  isDefault: boolean | null;
};

export type AddressRequest = {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
};

export type CouponResponse = {
  id: number;
  code: string;
  discountType: "PERCENTAGE" | "FIXED" | string;
  discountValue: number;
  minOrderAmount: number | null;
  expiryDate: string | null;
  active: boolean;
  usageLimit: number | null;
  usedCount: number | null;
  remainingUses: number | null;
  /** Only set when validated against an order amount */
  discountAmount: number | null;
};

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type CheckoutRequest = {
  addressId: number;
  couponCode?: string;
};

export type OrderItemResponse = {
  id: number;
  productVariantId: number;
  productName: string;
  sku: string;
  color: string | null;
  sizeName: string | null;
  /** Image of the ordered color, captured at order time. */
  imageUrl: string | null;
  quantity: number;
  price: number;
  priceAfterDiscount: number | null;
  lineTotal: number;
};

export type ShippingAddressResponse = {
  recipientName: string | null;
  phone: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
};

export type OrderCouponResponse = {
  id: number;
  couponCode: string;
  discountAmount: number;
};

export type OrderCustomerResponse = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
};

export type OrderResponse = {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  /** Null until the customer starts paying. Cash on delivery skips PAID. */
  paymentMethod: PaymentMethod | null;
  customer: OrderCustomerResponse | null;
  shippingAddress: ShippingAddressResponse | null;
  subtotal: number;
  discountAmount: number;
  taxPrice: number;
  shippingPrice: number;
  totalOrderPrice: number;
  /** Money given back through received returns. */
  refundedAmount: number;
  /** Starts the return period; null if not delivered yet. */
  deliveredAt: string | null;
  items: OrderItemResponse[];
  couponCodes: string[];
  coupons: OrderCouponResponse[];
  orderDate: string;
  updateDate: string | null;
};

export type OrderSummaryResponse = {
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod | null;
  totalOrderPrice: number;
  customerName: string;
  customerEmail: string;
  itemCount: number;
  orderDate: string;
};

export type OrderItemRequest = {
  productVariantId: number;
  quantity: number;
};

export type PlaceOrderRequest = {
  addressId: number;
  items: OrderItemRequest[];
  couponCode?: string;
};

export type UpdateOrderStatusRequest = {
  status: OrderStatus;
};

export type OrderStatsResponse = {
  totalOrders: number;
  byStatus: Record<string, number>;
  totalRevenue: number;
};

export type GetOrdersParams = {
  status?: OrderStatus;
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
};

// Aliases matching requirements
export type OrderCustomer = OrderCustomerResponse;
export type OrderShippingAddress = ShippingAddressResponse;
export type OrderItem = OrderItemResponse;
export type OrderCoupon = OrderCouponResponse;
export type OrderDetails = OrderResponse;
export type OrderSummary = OrderSummaryResponse;
export type OrderStatistics = OrderStatsResponse;
