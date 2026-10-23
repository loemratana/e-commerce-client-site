"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Mail, Phone, X } from "lucide-react";
import { Category } from "@/types/category";
import { PublicSettings } from "@/lib/api/settings.api";
import { menuData } from "./menuData";
import Logo from "../Common/Logo";
import { ACCOUNT_LINKS } from "./AccountMenu";

const MAX_CATEGORIES = 8;

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  isActive: (path: string) => boolean;
  isAuthenticated: boolean;
  categories: Category[];
  store: PublicSettings | null;
}

/** Slide-in navigation for screens below xl. */
const MobileMenu = ({ open, onClose, isActive, isAuthenticated, categories, store }: MobileMenuProps) => {
  // Close on Escape and keep the page behind from scrolling while open.
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  const linkClass = (active: boolean) =>
    `flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      active ? "bg-blue/10 text-blue" : "text-dark hover:bg-gray-1"
    }`;

  return (
    <div
      className={`fixed inset-0 z-99999 xl:hidden ${open ? "visible" : "invisible"}`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-dark/60 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <nav
        aria-label="Main menu"
        className={`absolute left-0 top-0 flex h-full w-[min(86vw,360px)] flex-col bg-white shadow-3 transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-3 px-4">
          <Link href="/" onClick={onClose}>
            <Logo height={32} />
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-dark hover:bg-gray-1"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          <ul className="space-y-0.5">
            {menuData.map((item) => (
              <li key={item.id}>
                <Link href={item.path} onClick={onClose} className={linkClass(isActive(item.path))}>
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>

          {categories.length > 0 && (
            <div>
              <p className="px-3 pb-2 text-2xs font-semibold uppercase tracking-wide text-dark-4">Categories</p>
              <ul className="space-y-0.5">
                {categories.slice(0, MAX_CATEGORIES).map((category) => (
                  <li key={category.id}>
                    <Link
                      href={`/shop-with-sidebar?categoryId=${category.id}`}
                      onClick={onClose}
                      className={linkClass(false)}
                    >
                      <span className="truncate">{category.name}</span>
                      <ChevronRight size={16} className="shrink-0 text-dark-4" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
                {categories.length > MAX_CATEGORIES && (
                  <li>
                    <Link href="/shop-with-sidebar" onClick={onClose} className="block px-3 py-2 text-sm font-semibold text-blue">
                      View all categories
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          )}

          <div>
            <p className="px-3 pb-2 text-2xs font-semibold uppercase tracking-wide text-dark-4">Account</p>
            <ul className="space-y-0.5">
              {(isAuthenticated
                ? ACCOUNT_LINKS
                : [
                    { label: "Sign in", href: "/signin" },
                    { label: "Create account", href: "/signup" },
                    { label: "Wishlist", href: "/wishlist" },
                  ]
              ).map((link) => (
                <li key={link.href}>
                  <Link href={link.href} onClick={onClose} className={linkClass(false)}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {(store?.phone || store?.email) && (
          <div className="shrink-0 space-y-2 border-t border-gray-3 p-4 text-sm text-dark-4">
            {store.phone && (
              <a href={`tel:${store.phone.replace(/\s+/g, "")}`} className="flex items-center gap-2 hover:text-blue">
                <Phone size={15} aria-hidden="true" />
                {store.phone}
              </a>
            )}
            {store.email && (
              <a href={`mailto:${store.email}`} className="flex items-center gap-2 hover:text-blue">
                <Mail size={15} aria-hidden="true" />
                {store.email}
              </a>
            )}
          </div>
        )}
      </nav>
    </div>
  );
};

export default MobileMenu;
