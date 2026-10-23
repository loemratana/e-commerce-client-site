import React from "react";
import { Metadata } from "next";
import ReturnRequestForm from "@/components/Returns/ReturnRequestForm";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ orderNumber: string }> | { orderNumber: string };
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  return {
    title: `Return Items for Order #${resolvedParams.orderNumber}`,
    description: `Request a return for items from order #${resolvedParams.orderNumber}.`,
  };
}

const RequestReturnPage = async ({ params }: PageProps) => {
  const resolvedParams = await Promise.resolve(params);

  return (
    <main>
      <ReturnRequestForm orderNumber={resolvedParams.orderNumber} />
    </main>
  );
};

export default RequestReturnPage;
