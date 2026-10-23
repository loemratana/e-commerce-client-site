import React from "react";
import { Metadata } from "next";
import PaymentReturn from "@/components/Checkout/PaymentReturn";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Payment | NextCommerce Nextjs E-commerce template",
  description: "Payment confirmation",
};

type PageProps = {
  searchParams: Promise<{ order?: string }> | { order?: string };
};

// Stripe Checkout's success_url: /checkout/success?order={orderNumber}
const PaymentSuccessPage = async ({ searchParams }: PageProps) => {
  const { order } = await Promise.resolve(searchParams);
  return (
    <main>
      <PaymentReturn outcome="success" orderNumber={order ?? null} />
    </main>
  );
};

export default PaymentSuccessPage;
