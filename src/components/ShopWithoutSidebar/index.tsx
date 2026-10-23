"use client";
import React, { useState } from "react";
import Breadcrumb from "../Common/Breadcrumb";
import ProductCard from "../Shop/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { ProductFilters } from "@/types/product-api";

const INITIAL_FILTERS: ProductFilters = {
  page: 0,
  size: 15,
};

const ShopWithoutSidebar = () => {
  const [filters, setFilters] = useState<ProductFilters>(INITIAL_FILTERS);
  const [productStyle, setProductStyle] = useState<"grid" | "list">("grid");
  const { products, pagination, isLoading, error, retry } =
    useProducts(filters);

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

  const goToPage = (page: number) => {
    setFilters((current) => ({ ...current, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <Breadcrumb
        title={"Explore All Products"}
        pages={["shop", "/", "shop without sidebar"]}
      />
      <section className="overflow-hidden relative pb-20 pt-5 lg:pt-20 xl:pt-28 bg-[#f3f4f6]">
        <div className="site-container">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-white px-4 py-3 shadow-1">
            <p className="text-sm text-gray-600" aria-live="polite">
              {isLoading && !pagination
                ? "Loading products..."
                : `Showing ${showingFrom}-${showingTo} of ${pagination?.totalElements ?? 0} products`}
            </p>

            <div className="flex items-center gap-3">
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
                  {[10, 15, 20, 40].map((size) => (
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
            </div>
          )}

          <div
            className={
              productStyle === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 gap-x-7.5 gap-y-9"
                : "flex flex-col gap-7.5"
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
              className="mt-15 flex items-center justify-center gap-4"
              aria-label="Product pagination"
            >
              <button
                type="button"
                disabled={currentPage <= 0 || isLoading}
                onClick={() => goToPage(currentPage - 1)}
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
                onClick={() => goToPage(currentPage + 1)}
                className="rounded-md bg-white px-4 py-2 text-sm shadow-1 hover:text-blue disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </nav>
          )}
        </div>
      </section>
    </>
  );
};

export default ShopWithoutSidebar;
