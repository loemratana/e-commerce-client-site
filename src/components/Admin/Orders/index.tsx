"use client";
import React, { useState } from "react";
import Breadcrumb from "@/components/Common/Breadcrumb";
import OrderStatsWidget from "./OrderStatsWidget";
import AdminOrdersList from "./AdminOrdersList";

const AdminOrdersManagement: React.FC = () => {
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);

  const handleOrderUpdated = () => {
    // Increment key to trigger stats refresh
    setStatsRefreshKey((prev) => prev + 1);
  };

  return (
    <>
      <Breadcrumb
        title="Admin Orders Management"
        pages={["Admin", "Orders Management"]}
      />

      <section className="bg-gray-2 py-10 sm:py-14">
        <div className="site-container">
          {/* Dashboard Header */}
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-blue bg-blue-light-5 px-3 py-1 rounded-full">
              Administration Center
            </span>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-dark">
              Orders &amp; Fulfillment Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage customer orders, track fulfillment stages, and monitor sales statistics.
            </p>
          </div>

          {/* 1. Statistics Overview Dashboard */}
          <OrderStatsWidget
            refreshKey={statsRefreshKey}
            onRefresh={() => setStatsRefreshKey((prev) => prev + 1)}
          />

          {/* 2. Orders Listing & Management */}
          <AdminOrdersList onOrderUpdated={handleOrderUpdated} />
        </div>
      </section>
    </>
  );
};

export default AdminOrdersManagement;
