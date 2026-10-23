"use client";

import {
  FormEvent,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import Breadcrumb from "../Common/Breadcrumb";
import FilterOptionsDropdown, { FilterOption } from "./FilterOptionsDropdown";
import PriceDropdown from "./PriceDropdown";
import ProductCard from "../Shop/ProductCard";
import { useCategories } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import { useSubcategories } from "@/hooks/useSubcategories";
import { ProductFilters } from "@/types/product-api";

const INITIAL_FILTERS: ProductFilters = {
  page: 0,
  size: 12,
};

const ratingOptions: FilterOption[] = [1, 2, 3, 4, 5].map((rating) => ({
  id: rating,
  name: `${rating}+ stars`,
}));

const ShopWithSidebar = () => {
  return (
    <Suspense
      fallback={
        <div className="site-container py-16 text-sm text-gray-500">
          Loading shop...
        </div>
      }
    >
      <ShopWithSidebarContent />
    </Suspense>
  );
};

const ShopWithSidebarContent = () => {
  const [filters, setFilters] = useState<ProductFilters>(INITIAL_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [productStyle, setProductStyle] = useState<"grid" | "list">("grid");
  const [availableBrands, setAvailableBrands] = useState<FilterOption[]>([]);
  const lastWrittenQuery = useRef<string | null>(null);
  const [urlReadyQuery, setUrlReadyQuery] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const queryString = searchParams.toString();
  const hasLegacyCategorySlug = searchParams.has("category");

  const {
    categories,
    isLoading: categoriesLoading,
    error: categoriesError,
    retry: retryCategories,
  } = useCategories();
  const {
    subcategories,
    isLoading: subcategoriesLoading,
    error: subcategoriesError,
  } = useSubcategories(filters.categoryId);
  const {
    products,
    pagination,
    isLoading,
    error,
    retry,
  } = useProducts(filters);

  useEffect(() => {
    if (queryString === lastWrittenQuery.current) {
      setUrlReadyQuery(queryString);
      return;
    }
    if (hasLegacyCategorySlug && categoriesLoading) return;

    const params = new URLSearchParams(queryString);
    const parsedCategoryId = Number(params.get("categoryId"));
    const categorySlug = params.get("category");
    const category = categories.find(
      (item) =>
        item.id === parsedCategoryId ||
        (categorySlug !== null && item.slug === categorySlug)
    );
    const title = params.get("title")?.trim() || undefined;
    const parseNumber = (key: string) => {
      const value = params.get(key);
      if (value === null || value.trim() === "") return undefined;
      const number = Number(value);
      return Number.isFinite(number) ? number : undefined;
    };
    const page = parseNumber("page");
    const size = parseNumber("size");

    setSearchInput(title ?? "");
    setFilters((current) => ({
      ...INITIAL_FILTERS,
      title,
      categoryId: category?.id ?? parseNumber("categoryId"),
      subCategoryId: parseNumber("subCategoryId"),
      brandId: parseNumber("brandId"),
      minPrice: parseNumber("minPrice"),
      maxPrice: parseNumber("maxPrice"),
      minRating: parseNumber("minRating"),
      page: page !== undefined && page >= 0 ? Math.floor(page) : 0,
      size: size !== undefined && size > 0 ? Math.floor(size) : INITIAL_FILTERS.size,
    }));
    lastWrittenQuery.current = null;
    setUrlReadyQuery(queryString);
  }, [
    categories,
    categoriesLoading,
    hasLegacyCategorySlug,
    queryString,
  ]);

  useEffect(() => {
    if (urlReadyQuery !== queryString) return;
    if (hasLegacyCategorySlug && categoriesLoading) return;

    const params = new URLSearchParams();
    if (filters.title) params.set("title", filters.title);
    if (filters.categoryId !== undefined) {
      params.set("categoryId", String(filters.categoryId));
    }
    if (filters.subCategoryId !== undefined) {
      params.set("subCategoryId", String(filters.subCategoryId));
    }
    if (filters.brandId !== undefined) {
      params.set("brandId", String(filters.brandId));
    }
    if (filters.minPrice !== undefined) {
      params.set("minPrice", String(filters.minPrice));
    }
    if (filters.maxPrice !== undefined) {
      params.set("maxPrice", String(filters.maxPrice));
    }
    if (filters.minRating !== undefined) {
      params.set("minRating", String(filters.minRating));
    }
    if (filters.page > 0) params.set("page", String(filters.page));
    if (filters.size !== INITIAL_FILTERS.size) {
      params.set("size", String(filters.size));
    }

    const nextQuery = params.toString();
    if (nextQuery !== queryString) {
      lastWrittenQuery.current = nextQuery;
      router.replace(`${pathname}${nextQuery ? `?${nextQuery}` : ""}`, {
        scroll: false,
      });
    }
  }, [
    categoriesLoading,
    filters,
    hasLegacyCategorySlug,
    pathname,
    queryString,
    router,
    urlReadyQuery,
  ]);

  useEffect(() => {
    setAvailableBrands((current) => {
      const next = new Map(current.map((brand) => [brand.id, brand.name]));
      products.forEach((product) => {
        if (product.brand) {
          next.set(product.brand.brandId, product.brand.brandName);
        }
      });
      return Array.from(next, ([id, name]) => ({ id, name })).sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    });
  }, [products]);

  const brandOptions = useMemo(() => availableBrands, [availableBrands]);
  const subcategoryOptions = useMemo(
    () =>
      subcategories.map((subcategory) => ({
        id: subcategory.id,
        name: subcategory.name,
      })),
    [subcategories]
  );

  const updateFilter = <Key extends keyof ProductFilters>(
    key: Key,
    value: ProductFilters[Key]
  ) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
      ...(key === "categoryId" ? { subCategoryId: undefined } : {}),
      page: key === "page" ? Number(value) : 0,
    }));
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateFilter("title", searchInput.trim() || undefined);
  };

  const clearFilters = () => {
    setSearchInput("");
    setFilters((current) => ({ ...INITIAL_FILTERS, size: current.size }));
  };

  const showingFrom =
    pagination && pagination.totalElements > 0
      ? pagination.number * pagination.size + 1
      : 0;
  const showingTo = pagination
    ? Math.min(
        (pagination.number + 1) * pagination.size,
        pagination.totalElements
      )
    : 0;
  const currentPage = pagination?.number ?? filters.page;
  const totalPages = pagination?.totalPages ?? 0;

  return (
    <>
      <Breadcrumb
        title="Explore All Products"
        pages={["shop", "/", "shop with sidebar"]}
      />

      <section className="relative overflow-hidden bg-[#f3f4f6] pb-20 pt-5 lg:pt-20 xl:pt-28">
        <div className="site-container">
          <div className="grid grid-cols-1 gap-7.5 xl:grid-cols-[270px_minmax(0,1fr)]">
            <aside className={`${filtersOpen ? "block" : "hidden"} h-fit xl:block`}>
              <div className="mb-4 flex items-center justify-between rounded-lg bg-white px-5 py-4 shadow-1">
                <h2 className="font-medium text-dark">Filters</h2>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm font-medium text-blue hover:underline"
                >
                  Clear all
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2 rounded-lg bg-white p-5 shadow-1">
                  <label
                    htmlFor="shop-product-title"
                    className="text-sm font-medium text-dark"
                  >
                    Product title
                  </label>
                  <form onSubmit={submitSearch} className="flex gap-2">
                    <input
                      id="shop-product-title"
                      type="search"
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                      placeholder="Search products"
                      className="min-w-0 flex-1 rounded-md border border-gray-3 px-3 py-2 text-sm outline-none focus:border-blue"
                    />
                    <button
                      type="submit"
                      className="rounded-md bg-blue px-3 text-sm font-medium text-white hover:bg-blue-dark"
                    >
                      Search
                    </button>
                  </form>
                </div>

                <FilterOptionsDropdown
                  label="Category"
                  options={categories.map((category) => ({
                    id: category.id,
                    name: category.name,
                  }))}
                  value={filters.categoryId}
                  isLoading={categoriesLoading}
                  error={categoriesError}
                  onRetry={retryCategories}
                  onChange={(categoryId) =>
                    updateFilter("categoryId", categoryId)
                  }
                />

                <FilterOptionsDropdown
                  label="Sub-category"
                  options={subcategoryOptions}
                  value={filters.subCategoryId}
                  isLoading={subcategoriesLoading}
                  error={subcategoriesError}
                  onChange={(subCategoryId) =>
                    updateFilter("subCategoryId", subCategoryId)
                  }
                />

                <FilterOptionsDropdown
                  label="Brand"
                  options={brandOptions}
                  value={filters.brandId}
                  onChange={(brandId) => updateFilter("brandId", brandId)}
                />

                <PriceDropdown
                  minPrice={filters.minPrice}
                  maxPrice={filters.maxPrice}
                  onChange={(range) =>
                    setFilters((current) => ({
                      ...current,
                      ...range,
                      page: 0,
                    }))
                  }
                />

                <FilterOptionsDropdown
                  label="Minimum rating"
                  options={ratingOptions}
                  value={filters.minRating}
                  onChange={(minRating) =>
                    updateFilter("minRating", minRating)
                  }
                />
              </div>
            </aside>

            <main className="min-w-0">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-white px-4 py-3 shadow-1">
                <p className="text-sm text-gray-600" aria-live="polite">
                  {isLoading && !pagination
                    ? "Loading products..."
                    : `Showing ${showingFrom}-${showingTo} of ${pagination?.totalElements ?? 0} products`}
                </p>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFiltersOpen((open) => !open)}
                    className="rounded-md bg-gray-1 px-3 py-1.5 text-sm font-medium text-dark hover:text-blue xl:hidden"
                    aria-expanded={filtersOpen}
                  >
                    {filtersOpen ? "Hide filters" : "Filters"}
                  </button>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    Per page
                    <select
                      value={filters.size}
                      onChange={(event) =>
                        setFilters((current) => ({
                          ...current,
                          size: Number(event.target.value),
                          page: 0,
                        }))
                      }
                      className="rounded-md border border-gray-3 bg-white px-2 py-1.5 text-dark outline-none focus:border-blue"
                    >
                      {[6, 12, 20, 40].map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="flex gap-1" aria-label="Product layout">
                    <button
                      type="button"
                      aria-pressed={productStyle === "grid"}
                      onClick={() => setProductStyle("grid")}
                      className={`rounded-md px-3 py-1.5 text-sm ${
                        productStyle === "grid"
                          ? "bg-blue text-white"
                          : "bg-gray-1 text-dark hover:text-blue"
                      }`}
                    >
                      Grid
                    </button>
                    <button
                      type="button"
                      aria-pressed={productStyle === "list"}
                      onClick={() => setProductStyle("list")}
                      className={`rounded-md px-3 py-1.5 text-sm ${
                        productStyle === "list"
                          ? "bg-blue text-white"
                          : "bg-gray-1 text-dark hover:text-blue"
                      }`}
                    >
                      List
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div
                  className="mb-6 rounded-lg bg-white p-6 text-center shadow-1"
                  role="alert"
                >
                  <p className="text-sm text-red-600">{error.message}</p>
                  <button
                    type="button"
                    onClick={retry}
                    className="mt-3 rounded-md bg-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-dark"
                  >
                    Retry
                  </button>
                </div>
              )}

              {isLoading && pagination && (
                <p className="mb-4 text-sm text-gray-500" role="status">
                  Updating products...
                </p>
              )}

              {!isLoading && !error && products.length === 0 && (
                <div className="rounded-lg bg-white p-10 text-center shadow-1">
                  <p className="font-medium text-dark">No products found</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Try changing or clearing your filters.
                  </p>
                </div>
              )}

              <div
                className={
                  productStyle === "grid"
                    ? "grid grid-cols-1 gap-x-6 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
                    : "flex flex-col gap-5"
                }
              >
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    layout={productStyle}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <nav
                  className="mt-10 flex items-center justify-center gap-4"
                  aria-label="Product pagination"
                >
                  <button
                    type="button"
                    disabled={currentPage <= 0 || isLoading}
                    onClick={() => updateFilter("page", currentPage - 1)}
                    className="rounded-md bg-white px-4 py-2 text-sm shadow-1 hover:text-blue disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600" aria-current="page">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage + 1 >= totalPages || isLoading}
                    onClick={() => updateFilter("page", currentPage + 1)}
                    className="rounded-md bg-white px-4 py-2 text-sm shadow-1 hover:text-blue disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </nav>
              )}
            </main>
          </div>
        </div>
      </section>
    </>
  );
};

export default ShopWithSidebar;
