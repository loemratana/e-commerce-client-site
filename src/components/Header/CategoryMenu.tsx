"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, LayoutGrid } from "lucide-react";
import { Category } from "@/types/category";

interface CategoryMenuProps {
  categories: Category[];
  emptyMessage: string;
  onRetry?: () => void;
}

/** Desktop "All categories" button with a grid of categories; opens on hover or click. */
const CategoryMenu = ({ categories, emptyMessage, onRetry }: CategoryMenuProps) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const closeMenu = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) closeMenu();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeMenu, open]);

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={closeMenu}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white transition-colors ${
          open ? "bg-blue-dark" : "bg-blue hover:bg-blue-dark"
        }`}
      >
        <LayoutGrid aria-hidden="true" size={16} />
        All categories
        <ChevronDown
          aria-hidden="true"
          size={16}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Opens from the button's left edge so it never runs off-screen. */}
      <div
        id={panelId}
        aria-hidden={!open}
        className={`absolute left-0 top-full z-50 w-[min(92vw,760px)] pt-2 transition duration-150 ${
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"
        }`}
      >
        <div className="overflow-hidden rounded-xl border border-gray-3 bg-white p-5 shadow-3">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-dark">Shop by category</h2>
              <p className="mt-0.5 text-xs text-dark-4">Browse our collections</p>
            </div>
            <Link
              href="/shop-with-sidebar"
              onClick={closeMenu}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue hover:underline"
            >
              View all products
              <ArrowRight aria-hidden="true" size={14} />
            </Link>
          </div>

          {categories.length > 0 ? (
            <ul className="grid max-h-[min(65vh,440px)] grid-cols-2 gap-1.5 overflow-y-auto lg:grid-cols-3">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/shop-with-sidebar?categoryId=${category.id}`}
                    onClick={closeMenu}
                    className="group flex min-w-0 items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-1"
                  >
                    <span
                      aria-hidden="true"
                      className="h-11 w-11 shrink-0 rounded-md bg-gray-2 bg-cover bg-center"
                      style={category.image ? { backgroundImage: `url("${category.image}")` } : undefined}
                    />
                    <span className="min-w-0 truncate text-sm font-medium text-dark group-hover:text-blue">
                      {category.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-lg bg-gray-1 px-4 py-6 text-center" role="status">
              <p className="text-sm text-dark-4">{emptyMessage}</p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-2 text-sm font-medium text-blue hover:underline"
                >
                  Try again
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryMenu;
