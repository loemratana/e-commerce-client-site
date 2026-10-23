import React from "react";
import { Metadata } from "next";
import AdminOrderDetails from "@/components/Admin/Orders/AdminOrderDetails";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ orderNumber: string }> | { orderNumber: string };
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  return {
    title: `Admin Order #${resolvedParams.orderNumber} | Details`,
    description: `Administrative details for order #${resolvedParams.orderNumber}`,
  };
}

const AdminOrderDetailPage = async ({ params }: PageProps) => {
  const resolvedParams = await Promise.resolve(params);

  return (
    <main>
      <AdminOrderDetails orderNumber={resolvedParams.orderNumber} />
    </main>
  );
};

export default AdminOrderDetailPage;
