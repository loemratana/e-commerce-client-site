"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { ChevronDown, LogOut, User } from "lucide-react";
import { usersApi } from "@/lib/api/users.api";
import { endSession } from "@/lib/sign-out";
import { resetCart } from "@/redux/features/cart-slice";
import { AppDispatch } from "@/redux/store";
import { UserResponse } from "@/types/auth-api";

export const ACCOUNT_LINKS = [
  { label: "My account", href: "/my-account" },
  { label: "My orders", href: "/my-account?tab=orders" },
  { label: "My returns", href: "/my-account?tab=returns" },
  { label: "Addresses", href: "/my-account?tab=addresses" },
  { label: "Wishlist", href: "/wishlist" },
];

const ADMIN_LINKS = [
  { label: "Manage orders", href: "/admin/orders" },
  { label: "Manage users", href: "/admin/users" },
];

/** Signed out: a "Sign in" link. Signed in: a menu of account pages and Sign out. */
const AccountMenu = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [open, setOpen] = useState(false);
  // Loaded the first time the menu opens, for the name and admin links.
  const [profile, setProfile] = useState<UserResponse | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const closeMenu = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!isAuthenticated) setProfile(null);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!open || profile || !isAuthenticated) return;
    usersApi.getProfile().then(setProfile).catch(() => undefined);
  }, [open, profile, isAuthenticated]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) closeMenu();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeMenu, open]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await endSession();
    dispatch(resetCart());
    setIsSigningOut(false);
    closeMenu();
    toast.success("You have been signed out.");
    router.push("/");
  };

  const label = (
    <span className="hidden text-left leading-tight lg:block">
      <span className="block text-2xs font-medium text-dark-4">
        {isAuthenticated ? `Hello${profile?.firstName ? `, ${profile.firstName}` : ""}` : "Welcome"}
      </span>
      <span className="block text-custom-sm font-semibold text-dark">
        {isAuthenticated ? "My account" : "Sign in"}
      </span>
    </span>
  );

  if (!isAuthenticated) {
    return (
      <Link
        href="/signin"
        className="flex h-11 items-center gap-2.5 rounded-lg px-2 transition-colors hover:bg-gray-1"
        aria-label="Sign in"
      >
        <User size={22} className="shrink-0 text-dark" aria-hidden="true" />
        {label}
      </Link>
    );
  }

  const isAdmin = Boolean(profile?.role?.some((role) => role.roleName.toUpperCase() === "ADMIN"));

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Account menu"
        onClick={() => setOpen((isOpen) => !isOpen)}
        className={`flex h-11 items-center gap-2.5 rounded-lg px-2 transition-colors hover:bg-gray-1 ${open ? "bg-gray-1" : ""}`}
      >
        <User size={22} className="shrink-0 text-dark" aria-hidden="true" />
        {label}
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={`hidden text-dark-4 transition-transform lg:block ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-gray-3 bg-white shadow-3"
        >
          <div className="border-b border-gray-3 px-4 py-3">
            <p className="truncate text-sm font-semibold text-dark">{profile?.name ?? "Your account"}</p>
            <p className="truncate text-xs text-dark-4">{profile?.email ?? " "}</p>
          </div>
          <ul className="p-1.5">
            {ACCOUNT_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={closeMenu}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-dark transition-colors hover:bg-gray-1 hover:text-blue"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          {isAdmin && (
            <ul className="border-t border-gray-3 p-1.5">
              <li className="px-3 pb-1 pt-1.5 text-2xs font-semibold uppercase tracking-wide text-dark-4">Admin</li>
              {ADMIN_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={closeMenu}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-dark transition-colors hover:bg-gray-1 hover:text-blue"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-gray-3 p-1.5">
            <button
              type="button"
              onClick={() => void handleSignOut()}
              disabled={isSigningOut}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red transition-colors hover:bg-red-light-6 disabled:opacity-60"
            >
              <LogOut size={16} aria-hidden="true" />
              {isSigningOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountMenu;
