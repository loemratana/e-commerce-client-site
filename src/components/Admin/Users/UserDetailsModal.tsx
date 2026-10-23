"use client";

import React, { useEffect } from "react";
import { UserResponse } from "@/types/auth-api";
import { X, User, MapPin, Shield, Calendar, Mail, Phone } from "lucide-react";

interface UserDetailsModalProps {
  user: UserResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
};

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  user,
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-details-title"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-dark/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl transition-all max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-2 px-6 py-4.5 bg-gray-1">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue/10 text-blue font-bold text-base">
              {user.firstName ? user.firstName[0].toUpperCase() : user.name ? user.name[0].toUpperCase() : "U"}
            </div>
            <div>
              <h2 id="user-details-title" className="text-lg font-bold text-dark">
                {user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User Details"}
              </h2>
              <p className="text-xs text-gray-500">User ID: #{user.id}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-2 hover:text-dark transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* General Information Grid */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-dark-4 mb-3">
              Account Overview
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-gray-2 bg-gray-1/50 p-4">
              <div className="flex items-start gap-3">
                <Mail size={18} className="text-blue mt-0.5 shrink-0" />
                <div>
                  <span className="block text-2xs uppercase text-gray-400 font-semibold">
                    Email
                  </span>
                  <p className="text-sm font-medium text-dark break-all">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone size={18} className="text-blue mt-0.5 shrink-0" />
                <div>
                  <span className="block text-2xs uppercase text-gray-400 font-semibold">
                    Phone
                  </span>
                  <p className="text-sm font-medium text-dark">
                    {user.phone || "Not specified"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User size={18} className="text-blue mt-0.5 shrink-0" />
                <div>
                  <span className="block text-2xs uppercase text-gray-400 font-semibold">
                    Status
                  </span>
                  <span
                    className={`inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      user.active
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {user.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar size={18} className="text-blue mt-0.5 shrink-0" />
                <div>
                  <span className="block text-2xs uppercase text-gray-400 font-semibold">
                    Joined Date
                  </span>
                  <p className="text-sm font-medium text-dark">
                    {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Roles */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-dark-4 mb-3">
              Roles &amp; Permissions
            </h3>
            {user.role && user.role.length > 0 ? (
              <div className="space-y-2">
                {user.role.map((r) => (
                  <div
                    key={r.roleId}
                    className="flex items-center justify-between rounded-xl border border-gray-2 p-3.5 bg-white"
                  >
                    <div className="flex items-center gap-2.5">
                      <Shield size={18} className="text-blue shrink-0" />
                      <div>
                        <span className="text-sm font-bold text-dark">
                          {r.roleName}
                        </span>
                        {r.description && (
                          <p className="text-xs text-gray-500">{r.description}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-2xs bg-blue-light-5 text-blue font-semibold px-2.5 py-1 rounded-md">
                      ID: {r.roleId}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No roles assigned.</p>
            )}
          </div>

          {/* Saved Addresses */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-dark-4 mb-3">
              Shipping &amp; Billing Addresses ({user.addresses?.length ?? 0})
            </h3>
            {user.addresses && user.addresses.length > 0 ? (
              <div className="space-y-3">
                {user.addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="flex items-start justify-between rounded-xl border border-gray-2 p-3.5 bg-white"
                  >
                    <div className="flex items-start gap-2.5">
                      <MapPin size={18} className="text-blue mt-0.5 shrink-0" />
                      <div className="text-sm text-dark space-y-0.5">
                        <p className="font-semibold">{addr.street || "Street not set"}</p>
                        <p className="text-gray-500 text-xs">
                          {[addr.city, addr.state, addr.zipCode, addr.country]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                    </div>

                    {addr.isDefault && (
                      <span className="text-2xs bg-green-50 text-green-700 font-semibold px-2 py-0.5 rounded-md border border-green-200">
                        Default
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No saved addresses.</p>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end border-t border-gray-2 px-6 py-4 bg-gray-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-white border border-gray-3 px-5 py-2 text-sm font-medium text-dark hover:bg-gray-2 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
