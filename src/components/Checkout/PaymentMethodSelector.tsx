import React from "react";
import { PAYMENT_METHOD_DESCRIPTIONS, PAYMENT_METHOD_LABELS } from "@/lib/payment-utils";
import { PaymentMethod } from "@/types/payment-api";

type Props = {
  methods: PaymentMethod[];
  isLoading: boolean;
  selected: PaymentMethod | null;
  onSelect: (method: PaymentMethod) => void;
  /** Radio group name; must be unique on the page. */
  name?: string;
};

const PaymentMethodSelector = ({ methods, isLoading, selected, onSelect, name = "paymentMethod" }: Props) => {
  if (isLoading) {
    return <p className="text-custom-sm text-dark-4">Loading payment methods…</p>;
  }
  if (methods.length === 0) {
    return <p className="text-custom-sm text-red">No payment methods are available right now. Please try again later.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {methods.map((method) => (
        <label
          key={method}
          className={`flex cursor-pointer items-start gap-3.5 rounded-md border py-3.5 px-5 duration-200 ${
            selected === method ? "border-blue bg-gray-1" : "border-gray-3 hover:bg-gray-1"
          }`}
        >
          <input
            type="radio"
            name={name}
            className="mt-1 accent-blue"
            checked={selected === method}
            onChange={() => onSelect(method)}
          />
          <span>
            <span className="block font-medium text-dark">{PAYMENT_METHOD_LABELS[method] ?? method}</span>
            <span className="block text-custom-sm text-dark-4">{PAYMENT_METHOD_DESCRIPTIONS[method]}</span>
          </span>
        </label>
      ))}
    </div>
  );
};

export default PaymentMethodSelector;
