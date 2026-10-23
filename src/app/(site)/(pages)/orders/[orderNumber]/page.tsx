import React from "react";
import { Metadata } from "next";
import CustomerOrderDetailsPage from "@/components/Orders/CustomerOrderDetailsPage";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ orderNumber: string }> | { orderNumber: string };
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  return {
    title: `Order #${resolvedParams.orderNumber} | Details`,
    description: `Order details and status for order #${resolvedParams.orderNumber}`,
  };
}

const OrderPage = async ({ params }: PageProps) => {
  const resolvedParams = await Promise.resolve(params);

  return (
    <main>
      <CustomerOrderDetailsPage orderNumber={resolvedParams.orderNumber} />
    </main>
  );
};

export default OrderPage;
