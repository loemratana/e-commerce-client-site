"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Breadcrumb from "@/components/Common/Breadcrumb";
import { ordersApi } from "@/lib/api/orders.api";
import { paymentsApi } from "@/lib/api/payments.api";
import { hasAccessToken, requestAuthentication } from "@/lib/auth-prompt";
import { formatPrice, getApiErrorMessage } from "@/lib/order-utils";
import { OrderResponse } from "@/types/order-api";

// There is no webhook: the success page asks the API to confirm the payment with Stripe, which
// marks the order PAID. Card payments are settled by the time Stripe redirects; a few retries
// cover a slow network or Stripe still finishing up.
const POLL_INTERVAL_MS = 2500;
const MAX_POLLS = 6;   // ~15 seconds

type Props = {
  /** "success": Stripe's success_url. "cancel": the customer left the payment page. */
  outcome: "success" | "cancel";
  orderNumber: string | null;
};

type State = "checking" | "paid" | "still-pending" | "cancelled" | "error";

const PaymentReturn = ({ outcome, orderNumber }: Props) => {
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [state, setState] = useState<State>("checking");
  const [error, setError] = useState<string | null>(null);
  const polls = useRef(0);

  useEffect(() => {
    if (!orderNumber) return;
    if (!hasAccessToken()) {
      requestAuthentication();
      return;
    }

    let timer: number | undefined;
    let stopped = false;

    const check = async () => {
      try {
        if (outcome === "success") {
          // A failed check isn't fatal: the order below still shows, and the next poll retries.
          await paymentsApi.confirmForMyOrder(orderNumber).catch(() => undefined);
          if (stopped) return;
        }
        const data = await ordersApi.getMyOrder(orderNumber);
        if (stopped) return;
        setOrder(data);

        if (data.status === "CANCELLED") {
          setState("cancelled");
        } else if (data.status !== "PENDING") {
          setState("paid");
        } else if (outcome === "cancel") {
          setState("still-pending");   // nothing to wait for: the customer didn't pay
        } else if (++polls.current >= MAX_POLLS) {
          setState("still-pending");
        } else {
          timer = window.setTimeout(check, POLL_INTERVAL_MS);
        }
      } catch (err) {
        if (stopped) return;
        setError(getApiErrorMessage(err, "Unable to load your order."));
        setState("error");
      }
    };

    void check();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [orderNumber, outcome]);

  const orderHref = orderNumber ? `/orders/${encodeURIComponent(orderNumber)}` : "/my-account?tab=orders";

  let icon = "⏳";
  let tone = "bg-blue-light-5 text-blue";
  let title = "Confirming your payment…";
  let body: React.ReactNode = "This usually takes a few seconds. Please don't close this page.";

  if (!orderNumber) {
    icon = "?";
    tone = "bg-gray-2 text-dark-4";
    title = "We couldn't tell which order this is";
    body = "Check your orders to see whether the payment went through.";
  } else if (state === "error") {
    icon = "!";
    tone = "bg-red-light-6 text-red";
    title = "We couldn't load your order";
    body = error;
  } else if (state === "paid") {
    icon = "✓";
    tone = "bg-green-light-6 text-green";
    title = "Payment received";
    body = <>Thank you! Order <strong>#{orderNumber}</strong>{order && <> ({formatPrice(order.totalOrderPrice)})</>} is confirmed and will be packed soon.</>;
  } else if (state === "cancelled") {
    icon = "✕";
    tone = "bg-red-light-6 text-red";
    title = "This order was cancelled";
    body = "If you were charged, the payment will be refunded. Contact us if you have questions.";
  } else if (state === "still-pending" && outcome === "cancel") {
    icon = "←";
    tone = "bg-yellow-light-2 text-yellow-dark";
    title = "Payment not completed";
    body = <>You left the payment page before paying. Order <strong>#{orderNumber}</strong> is kept for a limited time; you can pay for it from the order page.</>;
  } else if (state === "still-pending") {
    title = "Your payment is still being confirmed";
    body = "This is taking longer than usual. You don't need to pay again: the order page will update once the payment is confirmed.";
  }

  return (
    <>
      <Breadcrumb title={outcome === "success" ? "Payment" : "Payment cancelled"} pages={["checkout", "payment"]} />
      <section className="bg-gray-2 py-20">
        <div className="site-container">
          <div className="mx-auto max-w-[570px] rounded-[10px] bg-white p-8 text-center shadow-1 sm:p-10">
            <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold ${tone}`} aria-hidden="true">
              {state === "checking" && orderNumber ? (
                <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue border-r-transparent" />
              ) : (
                icon
              )}
            </div>
            <h1 className="text-xl font-bold text-dark sm:text-2xl" role="status">{title}</h1>
            <p className="mt-3 text-custom-sm text-dark-4">{body}</p>

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href={orderHref}
                className="rounded-md bg-blue px-6 py-3 text-sm font-medium text-white duration-200 hover:bg-blue-dark"
              >
                {state === "still-pending" && outcome === "cancel" ? "Pay for this order" : "View order"}
              </Link>
              <Link
                href="/shop-with-sidebar"
                className="rounded-md border border-gray-3 bg-white px-6 py-3 text-sm font-medium text-dark duration-200 hover:bg-gray-1"
              >
                Continue shopping
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default PaymentReturn;
