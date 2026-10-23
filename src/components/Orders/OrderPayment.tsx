"use client";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import PaymentMethodSelector from "@/components/Checkout/PaymentMethodSelector";
import { paymentsApi } from "@/lib/api/payments.api";
import { formatDateTime, formatPrice, getApiErrorMessage } from "@/lib/order-utils";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_STYLES,
  needsPaymentAction,
} from "@/lib/payment-utils";
import { OrderResponse } from "@/types/order-api";
import { PaymentMethod, PaymentResponse } from "@/types/payment-api";

type Props = {
  order: OrderResponse;
  /** Reload the order after a payment was started (its payment method changes). */
  onChange: () => void;
  /** "card" on a page; "inline" inside another card or modal. */
  variant?: "card" | "inline";
};

/** Payment status for an order, plus "Pay now" while it is still unpaid. */
const OrderPayment = ({ order, onChange, variant = "card" }: Props) => {
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selected, setSelected] = useState<PaymentMethod | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  const latest = payments[0];
  // The attempt that took the money, if any; refunds go back through it.
  const captured = payments.find((p) => p.status === "SUCCEEDED" || p.status === "PARTIALLY_REFUNDED" || p.status === "REFUNDED");
  const shown = captured ?? latest;
  const canPay = needsPaymentAction(order.status, latest?.status, latest?.method);

  useEffect(() => {
    setIsLoading(true);
    // While unpaid, ask the API to check with Stripe: the customer may have paid but closed the
    // tab before coming back to the success page (there is no webhook to catch that).
    const load = order.status === "PENDING"
      ? paymentsApi.confirmForMyOrder(order.orderNumber).catch(() => paymentsApi.getForMyOrder(order.orderNumber))
      : paymentsApi.getForMyOrder(order.orderNumber);
    load
      .then((list) => {
        setPayments(list);
        // Confirmed just now: reload so the order shows as paid.
        if (order.status === "PENDING" && list.some((p) => p.status === "SUCCEEDED")) onChange();
      })
      .catch(() => setPayments([]))   // the order itself still shows
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.orderNumber, order.status, order.paymentMethod]);

  useEffect(() => {
    if (!canPay) return;
    paymentsApi
      .getMethods()
      .then((list) => {
        setMethods(list);
        setSelected((current) => current ?? order.paymentMethod ?? (list.length === 1 ? list[0] : null));
      })
      .catch(() => setMethods([]));
  }, [canPay, order.paymentMethod]);

  const pay = async () => {
    if (!selected) return;
    setIsPaying(true);
    try {
      const payment = await paymentsApi.initiate({ orderNumber: order.orderNumber, method: selected });
      if (payment.redirectUrl) {
        window.location.assign(payment.redirectUrl);
        return;
      }
      toast.success(`You'll pay ${formatPrice(order.totalOrderPrice)} on delivery.`);
      onChange();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to start the payment."));
    } finally {
      setIsPaying(false);
    }
  };

  // An open online attempt can be resumed instead of starting over.
  const resumeUrl = latest?.status === "PENDING" ? latest.redirectUrl : null;

  // A cancelled order that was never paid has nothing to show.
  if (order.status === "CANCELLED" && !isLoading && !captured) return null;

  return (
    <div className={variant === "card" ? "rounded-2xl bg-white p-6 sm:p-8 shadow-1" : "rounded-xl border border-gray-3 p-4 sm:p-5"}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className={variant === "card" ? "text-lg font-bold text-dark" : "text-xs font-semibold uppercase tracking-wider text-gray-500"}>Payment</h2>
        {shown && (
          <span className={`inline-block text-xs font-semibold py-1 px-3.5 rounded-full ${PAYMENT_STATUS_STYLES[shown.status]}`}>
            {PAYMENT_STATUS_LABELS[shown.status]}
          </span>
        )}
      </div>

      {isLoading ? (
        <p className="mt-3 text-sm text-gray-500">Loading payment…</p>
      ) : (
        <div className="mt-3 space-y-1 text-sm text-gray-600">
          <p>
            Method:{" "}
            <span className="font-medium text-dark">
              {order.paymentMethod ? PAYMENT_METHOD_LABELS[order.paymentMethod] : "Not chosen yet"}
            </span>
          </p>
          {latest?.status === "PENDING" && latest.method === "CASH_ON_DELIVERY" && (
            <p>Please have {formatPrice(order.totalOrderPrice)} ready for the courier.</p>
          )}
          {shown?.paidAt && <p>Paid on {formatDateTime(shown.paidAt)}</p>}
          {captured && captured.refundedAmount > 0 && (
            <p className="font-medium text-green">
              {captured.status === "REFUNDED" ? "Refunded" : "Partly refunded"}: {formatPrice(captured.refundedAmount)}
              {captured.method === "STRIPE"
                ? " to your card. It can take 5–10 business days to show on your statement."
                : ", handed back in cash."}
            </p>
          )}
          {!captured && latest?.failureReason && <p className="text-red">{latest.failureReason}</p>}
        </div>
      )}

      {canPay && !isLoading && (
        <div className="mt-5 border-t border-gray-3 pt-5">
          {resumeUrl ? (
            <a
              href={resumeUrl}
              className="inline-flex rounded-lg bg-blue px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-dark transition-colors"
            >
              Continue payment
            </a>
          ) : (
            <>
              <p className="mb-3 text-sm text-gray-600">
                This order hasn&apos;t been paid yet. Choose how you&apos;d like to pay:
              </p>
              <PaymentMethodSelector
                methods={methods}
                isLoading={false}
                selected={selected}
                onSelect={setSelected}
                name={`pay-${order.orderNumber}`}
              />
              <button
                type="button"
                onClick={pay}
                disabled={!selected || isPaying}
                className="mt-4 rounded-lg bg-blue px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-dark transition-colors disabled:opacity-60"
              >
                {isPaying ? "Starting payment…" : selected === "STRIPE" ? "Pay now" : "Confirm"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderPayment;
