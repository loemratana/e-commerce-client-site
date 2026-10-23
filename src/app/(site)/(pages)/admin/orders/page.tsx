import React from "react";
import { Metadata } from "next";
import AdminOrdersManagement from "@/components/Admin/Orders";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Orders Management | NextCommerce",
  description: "Administrative dashboard for managing and tracking customer orders",
};

const AdminOrdersPage: React.FC = () => {
  return (
    <main>
      <AdminOrdersManagement />
    </main>
  );
};

export default AdminOrdersPage;
