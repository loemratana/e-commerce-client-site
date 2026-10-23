"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, ShoppingCart, Menu as MenuIcon, Heart, Phone, Mail } from "lucide-react";
import CustomSelect, { SelectOption } from "./CustomSelect";
import CategoryMenu from "./CategoryMenu";
import AccountMenu from "./AccountMenu";
import MobileMenu from "./MobileMenu";
import Logo from "../Common/Logo";
import { menuData } from "./menuData";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@/redux/store";
import { selectTotalPrice } from "@/redux/features/cart-slice";
import {
  fetchWishlistIds,
  resetWishlist,
  selectWishlistCount,
} from "@/redux/features/wishlist-slice";
import { useCartModalContext } from "@/app/context/CartSidebarModalContext";
import { useCategories } from "@/hooks/useCategories";
import { AUTH_STATE_CHANGED_EVENT, hasAccessToken } from "@/lib/auth-prompt";
import { formatMoney, useCurrency } from "@/lib/currency";
import { PublicSettings, settingsApi } from "@/lib/api/settings.api";

const Header = () => {
  useCurrency(); // re-render the cart total if the store currency changes
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // Store name and contact details from the admin dashboard (Settings / Store).
  const [store, setStore] = useState<PublicSettings | null>(null);

  const { openCartModal } = useCartModalContext();
  const {
    categories,
    isLoading: categoriesLoading,
    error: categoriesError,
    retry: retryCategories,
  } = useCategories();

  const cartItems = useAppSelector((state) => state.cartReducer.items);
  const dispatch = useDispatch<AppDispatch>();
  const wishlistCount = useAppSelector(selectWishlistCount);
  const wishlistIdsStatus = useAppSelector((state) => state.wishlistReducer.idsStatus);
  const totalPrice = useAppSelector(selectTotalPrice);
  const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity ?? 1), 0);

  // Shadow once the page scrolls under the sticky bar
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Sync authentication state across tabs & storage events
  useEffect(() => {
    const syncAuth = () => setIsAuthenticated(hasAccessToken());
    syncAuth();
    window.addEventListener(AUTH_STATE_CHANGED_EVENT, syncAuth);
    window.addEventListener("storage", syncAuth);
    return () => {
      window.removeEventListener(AUTH_STATE_CHANGED_EVENT, syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  // The header is on every page, so it owns the saved product ids: load them once signed in
  // (hearts on product cards and the badge read them), and drop the wishlist on sign-out —
  // including from another tab or an expired session, since clearing the tokens also fires
  // AUTH_STATE_CHANGED_EVENT.
  useEffect(() => {
    if (!isAuthenticated) {
      dispatch(resetWishlist());
    } else if (wishlistIdsStatus === "idle") {
      void dispatch(fetchWishlistIds());
    }
  }, [isAuthenticated, wishlistIdsStatus, dispatch]);

  useEffect(() => {
    settingsApi.getPublic().then(setStore).catch(() => undefined);
  }, []);

  // Read search & category query parameters from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const catId = params.get("categoryId");
    if (catId !== null) setSelectedCategoryId(catId);
    const title = params.get("title");
    if (title) setSearchQuery(title);
  }, []);

  // Close the mobile menu after navigating
  useEffect(() => setMobileMenuOpen(false), [pathname]);

  const categoryOptions: SelectOption[] = useMemo(
    () => [
      { label: "All Categories", value: "" },
      ...categories.map((cat) => ({ label: cat.name, value: String(cat.id) })),
    ],
    [categories]
  );

  const navigateToSearch = useCallback(
    (query: string, categoryId: string) => {
      const params = new URLSearchParams();
      const trimmed = query.trim();
      if (trimmed) params.set("title", trimmed);
      if (categoryId) params.set("categoryId", categoryId);
      const queryString = params.toString();
      router.push(`/shop-with-sidebar${queryString ? `?${queryString}` : ""}`);
    },
    [router]
  );

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigateToSearch(searchQuery, selectedCategoryId);
  };

  const handleCategorySelect = (option: SelectOption) => {
    setSelectedCategoryId(option.value);
    navigateToSearch(searchQuery, option.value);
  };

  const isActive = useCallback(
    (path: string) => (path === "/" ? pathname === "/" : pathname?.startsWith(path) ?? false),
    [pathname]
  );

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  // Rendered twice: in the main bar on md+, and as its own row on phones.
  const searchForm = (id: string) => (
    <form onSubmit={handleSearchSubmit} role="search" className="flex w-full items-center">
      <div className="hidden sm:block">
        <CustomSelect options={categoryOptions} value={selectedCategoryId} onSelect={handleCategorySelect} />
      </div>
      <label htmlFor={id} className="sr-only">
        Search products
      </label>
      <input
        id={id}
        onChange={(e) => setSearchQuery(e.target.value)}
        value={searchQuery}
        type="search"
        name="search"
        placeholder="Search for products…"
        autoComplete="off"
        className="h-[46px] min-w-0 flex-1 rounded-l-[5px] border border-gray-3 bg-gray-1 px-4 text-sm outline-none transition-colors focus:border-blue focus:bg-white sm:rounded-l-none"
      />
      <button
        type="submit"
        aria-label="Search"
        className="flex h-[46px] shrink-0 items-center justify-center gap-2 rounded-r-[5px] bg-blue px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-dark lg:px-5"
      >
        <Search size={18} aria-hidden="true" />
        <span className="hidden lg:inline">Search</span>
      </button>
    </form>
  );

  const iconBadge = (count: number) =>
    count > 0 && (
      <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-blue px-1 text-2xs font-semibold text-white">
        {count > 99 ? "99+" : count}
      </span>
    );

  return (
    <>
      {/* Top bar: scrolls away, only the main bar stays */}
      <div className="hidden bg-dark text-white/80 sm:block">
        <div className="site-container flex h-9 items-center justify-between gap-4 text-xs">
          <div className="flex min-w-0 items-center gap-5">
            {store?.phone && (
              <a href={`tel:${store.phone.replace(/\s+/g, "")}`} className="flex items-center gap-1.5 hover:text-white">
                <Phone size={13} aria-hidden="true" />
                {store.phone}
              </a>
            )}
            {store?.email && (
              <a href={`mailto:${store.email}`} className="hidden items-center gap-1.5 hover:text-white md:flex">
                <Mail size={13} aria-hidden="true" />
                {store.email}
              </a>
            )}
            {!store?.phone && !store?.email && store?.storeName && (
              <span className="truncate">Welcome to {store.storeName}</span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-5">
            <Link href="/my-account?tab=orders" className="hover:text-white">
              Track order
            </Link>
            <Link href="/contact" className="hover:text-white">
              Help
            </Link>
          </div>
        </div>
      </div>

      <header
        className={`sticky top-0 z-9999 border-b border-gray-3 bg-white transition-shadow duration-200 ${
          scrolled ? "shadow-3" : ""
        }`}
      >
        <div className="site-container">
          {/* Main bar */}
          <div className="flex h-16 items-center gap-3 sm:gap-5 lg:h-[76px] lg:gap-8">
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(true)}
              className="-ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-dark hover:bg-gray-1 xl:hidden"
            >
              <MenuIcon size={22} />
            </button>

            <Link className="shrink-0" href="/" aria-label={store?.storeName ? `${store.storeName} home` : "Home"}>
              <Logo height={40} priority />
            </Link>

            <div className="hidden max-w-[760px] flex-1 md:block">{searchForm("header-search")}</div>

            <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
              <AccountMenu isAuthenticated={isAuthenticated} />

              <Link
                href="/wishlist"
                aria-label={`Wishlist, ${wishlistCount} items`}
                className="relative hidden h-11 w-11 items-center justify-center rounded-lg text-dark transition-colors hover:bg-gray-1 sm:flex"
              >
                <span className="relative">
                  <Heart size={22} aria-hidden="true" />
                  {iconBadge(wishlistCount)}
                </span>
              </Link>

              <button
                type="button"
                onClick={openCartModal}
                aria-label={`Open cart, ${cartCount} items, ${formatMoney(totalPrice)}`}
                className="flex h-11 items-center gap-2.5 rounded-lg px-2 text-left transition-colors hover:bg-gray-1"
              >
                <span className="relative">
                  <ShoppingCart size={22} className="text-dark" aria-hidden="true" />
                  {iconBadge(cartCount)}
                </span>
                <span className="hidden leading-tight lg:block">
                  <span className="block text-2xs font-medium text-dark-4">Cart</span>
                  <span className="block text-custom-sm font-semibold text-dark">{formatMoney(totalPrice)}</span>
                </span>
              </button>
            </div>
          </div>

          {/* Phones: search gets its own row */}
          <div className="pb-3 md:hidden">{searchForm("header-search-mobile")}</div>
        </div>

        {/* Desktop navigation */}
        <div className="hidden border-t border-gray-3 xl:block">
          <div className="site-container flex h-14 items-center gap-8">
            <CategoryMenu
              categories={categories}
              emptyMessage={
                categoriesError
                  ? "Categories could not be loaded."
                  : categoriesLoading
                  ? "Loading categories..."
                  : "No categories available."
              }
              onRetry={categoriesError ? retryCategories : undefined}
            />
            <nav aria-label="Main">
              <ul className="flex items-center gap-1">
                {menuData.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.path}
                        aria-current={active ? "page" : undefined}
                        className={`rounded-lg px-3.5 py-2 text-custom-sm font-medium transition-colors ${
                          active ? "bg-blue/10 text-blue" : "text-dark hover:bg-gray-1 hover:text-blue"
                        }`}
                      >
                        {item.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>
      </header>

      <MobileMenu
        open={mobileMenuOpen}
        onClose={closeMobileMenu}
        isActive={isActive}
        isAuthenticated={isAuthenticated}
        categories={categories}
        store={store}
      />
    </>
  );
};

export default Header;
