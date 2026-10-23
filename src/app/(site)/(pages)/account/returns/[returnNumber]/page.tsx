import React from "react";
import { Metadata } from "next";
import ReturnDetailsView from "@/components/Returns/ReturnDetailsView";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ returnNumber: string }> | { returnNumber: string };
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  return {
    title: `Return #${resolvedParams.returnNumber} | Details`,
    description: `Track return request #${resolvedParams.returnNumber} and inspect refund status.`,
  };
}

const ReturnDetailsPage = async ({ params }: PageProps) => {
  const resolvedParams = await Promise.resolve(params);

  return (
    <main>
      <ReturnDetailsView returnNumber={resolvedParams.returnNumber} />
    </main>
  );
};

export default ReturnDetailsPage;
