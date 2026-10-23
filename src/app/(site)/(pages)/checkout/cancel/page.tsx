import React from "react";
import { Metadata } from "next";
import PaymentReturn from "@/components/Checkout/PaymentReturn";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Payment cancelled | NextCommerce Nextjs E-commerce template",
  description: "The payment was not completed",
};

type PageProps = {
  searchParams: Promise<{ order?: string }> | { order?: string };
};

// Stripe Checkout's cancel_url: /checkout/cancel?order={orderNumber}
const PaymentCancelPage = async ({ searchParams }: PageProps) => {
  const { order } = await Promise.resolve(searchParams);
  return (
    <main>
      <PaymentReturn outcome="cancel" orderNumber={order ?? null} />
    </main>
  );
};

export default PaymentCancelPage;
