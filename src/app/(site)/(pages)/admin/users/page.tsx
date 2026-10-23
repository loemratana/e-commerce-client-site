import React from "react";
import { Metadata } from "next";
import AdminUsersManagement from "@/components/Admin/Users";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Users Management | NextCommerce",
  description: "Administrative dashboard for managing customer and administrator accounts",
};

const AdminUsersPage: React.FC = () => {
  return (
    <main>
      <AdminUsersManagement />
    </main>
  );
};

export default AdminUsersPage;
