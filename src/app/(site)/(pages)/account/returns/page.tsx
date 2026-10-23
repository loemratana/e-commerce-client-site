import React from "react";
import { Metadata } from "next";
import MyReturnsList from "@/components/Returns/MyReturnsList";
import Breadcrumb from "@/components/Common/Breadcrumb";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Returns | NextCommerce",
  description:
    "Track your return requests, view refund progress, and manage return submissions.",
};

const ReturnsPage = () => {
  return (
    <main>
      <Breadcrumb title="My Returns" pages={["My Account", "My Returns"]} />

      <section className="bg-gray-2 py-10 sm:py-14 lg:py-18">
        <div className="site-container">
          <div className="mb-8">
            <p className="text-sm font-medium uppercase tracking-wider text-blue">
              Returns & Refunds
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-dark">
              My Returns
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Track your returned items, monitor review status, and inspect
              refund progress for your orders.
            </p>
          </div>

          <MyReturnsList />
        </div>
      </section>
    </main>
  );
};

export default ReturnsPage;
