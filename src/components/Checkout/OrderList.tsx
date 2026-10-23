import React from "react";
import { CartItem } from "@/redux/features/cart-slice";
import { formatPrice } from "@/lib/order-utils";

type Props = {
  items: CartItem[];
  subtotal: number;
  discount: number;
};

const OrderList = ({ items, subtotal, discount }: Props) => (
  <div className="bg-white shadow-1 rounded-[10px]">
    <div className="border-b border-gray-3 py-5 px-4 sm:px-8.5">
      <h3 className="font-medium text-xl text-dark">Your Order</h3>
    </div>

    <div className="pt-2.5 pb-8.5 px-4 sm:px-8.5">
      <div className="flex items-center justify-between py-5 border-b border-gray-3">
        <h4 className="font-medium text-dark">Product</h4>
        <h4 className="font-medium text-dark text-right">Subtotal</h4>
      </div>

      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between gap-4 py-5 border-b border-gray-3"
        >
          <p className="text-dark">
            {item.title} <span className="text-dark-4">× {item.quantity}</span>
          </p>
          <p className="text-dark text-right">
            {formatPrice(item.discountedPrice * item.quantity)}
          </p>
        </div>
      ))}

      <div className="flex items-center justify-between py-5 border-b border-gray-3">
        <p className="text-dark">Subtotal</p>
        <p className="text-dark text-right">{formatPrice(subtotal)}</p>
      </div>

      {discount > 0 && (
        <div className="flex items-center justify-between py-5 border-b border-gray-3">
          <p className="text-dark">Coupon discount</p>
          <p className="text-green text-right">−{formatPrice(discount)}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-5">
        <p className="font-medium text-lg text-dark">Estimated total</p>
        <p className="font-medium text-lg text-dark text-right">
          {formatPrice(Math.max(0, subtotal - discount))}
        </p>
      </div>
      <p className="mt-2 text-custom-xs text-dark-4">
        Tax and shipping are calculated when your order is placed.
      </p>
    </div>
  </div>
);

export default OrderList;
