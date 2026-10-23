"use client";

import React, { useState } from "react";
import Breadcrumb from "@/components/Common/Breadcrumb";
import { useUsers } from "@/hooks/useUsers";
import { UserResponse } from "@/types/auth-api";
import UserDetailsModal from "./UserDetailsModal";
import {
  Search,
  Users,
  Shield,
  MapPin,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
};

const AdminUsersManagement: React.FC = () => {
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc");
  const [searchInput, setSearchInput] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const queryParams = {
    page,
    size,
    sortBy,
    sortDirection,
    search: searchInput.trim() || undefined,
    active: activeFilter === "ALL" ? undefined : activeFilter === "ACTIVE",
  };

  const { users, pagination, isLoading, error, retry } = useUsers(queryParams);

  const totalPages = pagination?.totalPages ?? 1;
  const totalElements = pagination?.totalElements ?? users.length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
  };

  const handleOpenDetails = (user: UserResponse) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  return (
    <>
      <Breadcrumb
        title="Admin Users Management"
        pages={["Admin", "Users Management"]}
      />

      <section className="bg-gray-2 py-10 sm:py-14">
        <div className="site-container">
          {/* Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue bg-blue-light-5 px-3 py-1 rounded-full">
                Administration Center
              </span>
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-dark flex items-center gap-2.5">
                <Users className="text-blue" size={28} />
                User Accounts Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                View, filter, and manage registered customer and administrator accounts.
              </p>
            </div>

            <button
              type="button"
              onClick={retry}
              className="inline-flex items-center gap-2 self-start sm:self-auto rounded-lg border border-gray-3 bg-white px-4 py-2.5 text-sm font-medium text-dark hover:bg-gray-1 hover:text-blue transition-colors shadow-sm"
            >
              <RefreshCw size={16} className={isLoading ? "animate-spin text-blue" : ""} />
              Refresh
            </button>
          </div>

          {/* Filters Bar */}
          <div className="mb-6 rounded-xl border border-gray-3 bg-white p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              {/* Search input */}
              <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full rounded-lg border border-gray-3 bg-gray-1 py-2.5 pl-10 pr-4 text-sm text-dark placeholder-gray-400 outline-none focus:border-blue transition-colors"
                />
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </form>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Sort By */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase">
                    Sort:
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setPage(0);
                    }}
                    className="rounded-lg border border-gray-3 bg-gray-1 px-3 py-2 text-xs font-medium text-dark outline-none focus:border-blue"
                  >
                    <option value="createdAt">Date Created</option>
                    <option value="name">Name</option>
                    <option value="email">Email</option>
                  </select>
                </div>

                {/* Direction */}
                <select
                  value={sortDirection}
                  onChange={(e) => {
                    setSortDirection(e.target.value as "desc" | "asc");
                    setPage(0);
                  }}
                  className="rounded-lg border border-gray-3 bg-gray-1 px-3 py-2 text-xs font-medium text-dark outline-none focus:border-blue"
                >
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>

                {/* Status Filter */}
                <select
                  value={activeFilter}
                  onChange={(e) => {
                    setActiveFilter(e.target.value);
                    setPage(0);
                  }}
                  className="rounded-lg border border-gray-3 bg-gray-1 px-3 py-2 text-xs font-medium text-dark outline-none focus:border-blue"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="INACTIVE">Inactive Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-hidden rounded-xl border border-gray-3 bg-white shadow-sm">
            {isLoading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className="flex items-center justify-between gap-4 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-2" />
                      <div className="space-y-1.5">
                        <div className="h-4 w-36 bg-gray-2 rounded" />
                        <div className="h-3 w-48 bg-gray-2 rounded" />
                      </div>
                    </div>
                    <div className="h-6 w-20 bg-gray-2 rounded" />
                    <div className="h-6 w-16 bg-gray-2 rounded" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="py-12 text-center">
                <XCircle size={40} className="mx-auto text-red-500 mb-3" />
                <h3 className="text-base font-semibold text-dark">
                  Failed to load users
                </h3>
                <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
                  {error.message || "Please make sure you are signed in with administrator privileges."}
                </p>
                <button
                  type="button"
                  onClick={retry}
                  className="mt-4 rounded-lg bg-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-dark transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : users.length === 0 ? (
              <div className="py-16 text-center">
                <Users size={44} className="mx-auto text-gray-300 mb-3" />
                <h3 className="text-base font-semibold text-dark">
                  No users found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchInput
                    ? "Try adjusting your search criteria or clear the filters."
                    : "No user accounts are currently registered in the database."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-2 bg-gray-1 text-2xs uppercase tracking-wider text-gray-500 font-semibold">
                      <th className="py-3.5 px-4 sm:px-6">User</th>
                      <th className="py-3.5 px-4">Roles</th>
                      <th className="py-3.5 px-4">Addresses</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Registered</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-2 text-sm text-dark">
                    {users.map((user) => {
                      const displayName =
                        user.name ||
                        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                        "Unnamed User";
                      const defaultAddress = user.addresses?.find((a) => a.isDefault) || user.addresses?.[0];

                      return (
                        <tr
                          key={user.id}
                          className="hover:bg-gray-1/60 transition-colors cursor-pointer"
                          onClick={() => handleOpenDetails(user)}
                        >
                          {/* User info */}
                          <td className="py-4 px-4 sm:px-6">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-light-5 text-blue font-bold text-sm">
                                {user.firstName ? user.firstName[0].toUpperCase() : displayName[0]?.toUpperCase() || "U"}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-dark truncate">
                                  {displayName}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Roles */}
                          <td className="py-4 px-4">
                            <div className="flex flex-wrap gap-1">
                              {user.role && user.role.length > 0 ? (
                                user.role.map((r) => (
                                  <span
                                    key={r.roleId}
                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-2xs font-bold uppercase tracking-wider ${
                                      r.roleName === "ADMIN"
                                        ? "bg-purple-50 text-purple-700 border border-purple-200"
                                        : "bg-blue-light-5 text-blue border border-blue/20"
                                    }`}
                                  >
                                    <Shield size={10} />
                                    {r.roleName}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </div>
                          </td>

                          {/* Address info */}
                          <td className="py-4 px-4">
                            {defaultAddress ? (
                              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                <MapPin size={13} className="text-gray-400 shrink-0" />
                                <span className="truncate max-w-[150px]" title={`${defaultAddress.city}, ${defaultAddress.country}`}>
                                  {[defaultAddress.city, defaultAddress.country].filter(Boolean).join(", ")}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">None</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                user.active
                                  ? "bg-green-50 text-green-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {user.active ? (
                                <>
                                  <CheckCircle2 size={12} /> Active
                                </>
                              ) : (
                                <>
                                  <XCircle size={12} /> Inactive
                                </>
                              )}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="py-4 px-4 text-xs text-gray-500 whitespace-nowrap">
                            {formatDate(user.createdAt)}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4 sm:px-6 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDetails(user);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-3 bg-white px-3 py-1.5 text-xs font-semibold text-dark hover:bg-blue hover:text-white hover:border-transparent transition-all shadow-sm"
                            >
                              <Eye size={13} />
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination footer */}
            {!isLoading && users.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-2 px-6 py-4 bg-gray-1">
                <span className="text-xs text-gray-500">
                  Showing page <strong className="text-dark">{page + 1}</strong> of{" "}
                  <strong className="text-dark">{totalPages}</strong> ({totalElements} total users)
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page === 0}
                    onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-3 bg-white px-3 py-1.5 text-xs font-medium text-dark hover:bg-gray-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>

                  <button
                    type="button"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((prev) => prev + 1)}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-3 bg-white px-3 py-1.5 text-xs font-medium text-dark hover:bg-gray-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* User Details Modal */}
      <UserDetailsModal
        user={selectedUser}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedUser(null);
        }}
      />
    </>
  );
};

export default AdminUsersManagement;
