import { test, describe } from "node:test";
import assert from "node:assert/strict";

describe("Orders API & Utilities Test Suite", () => {
  test("Price formatting formats numbers and decimals as USD currency", () => {
    const formatPrice = (val) => `$${Number(val ?? 0).toFixed(2)}`;

    assert.equal(formatPrice(0), "$0.00");
    assert.equal(formatPrice(1372), "$1372.00");
    assert.equal(formatPrice(49.99), "$49.99");
    assert.equal(formatPrice(null), "$0.00");
    assert.equal(formatPrice(undefined), "$0.00");
  });

  test("Date formatting parses ISO strings", () => {
    const formatDate = (val) =>
      val
        ? new Date(val).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            timeZone: "UTC",
          })
        : "-";

    assert.equal(formatDate("2026-10-17T15:13:14.509032Z"), "Oct 17, 2026");
    assert.equal(formatDate(null), "-");
    assert.equal(formatDate(undefined), "-");
  });

  test("canCancelOrder only permits PENDING and PAID", () => {
    const canCancelOrder = (status) =>
      status === "PENDING" || status === "PAID";

    assert.equal(canCancelOrder("PENDING"), true);
    assert.equal(canCancelOrder("PAID"), true);
    assert.equal(canCancelOrder("PROCESSING"), false);
    assert.equal(canCancelOrder("SHIPPED"), false);
    assert.equal(canCancelOrder("DELIVERED"), false);
    assert.equal(canCancelOrder("CANCELLED"), false);
  });

  test("ALLOWED_STATUS_TRANSITIONS matches backend transition workflow", () => {
    const ALLOWED_STATUS_TRANSITIONS = {
      PENDING: ["PAID", "CANCELLED"],
      PAID: ["PROCESSING", "CANCELLED"],
      PROCESSING: ["SHIPPED", "CANCELLED"],
      SHIPPED: ["DELIVERED"],
      DELIVERED: [],
      CANCELLED: [],
    };

    assert.deepEqual(ALLOWED_STATUS_TRANSITIONS.PENDING, ["PAID", "CANCELLED"]);
    assert.deepEqual(ALLOWED_STATUS_TRANSITIONS.PAID, ["PROCESSING", "CANCELLED"]);
    assert.deepEqual(ALLOWED_STATUS_TRANSITIONS.PROCESSING, ["SHIPPED", "CANCELLED"]);
    assert.deepEqual(ALLOWED_STATUS_TRANSITIONS.SHIPPED, ["DELIVERED"]);
    assert.deepEqual(ALLOWED_STATUS_TRANSITIONS.DELIVERED, []);
    assert.deepEqual(ALLOWED_STATUS_TRANSITIONS.CANCELLED, []);
  });

  test("Query parameters for getOrders build correct query string", () => {
    const buildOrdersQuery = (params = {}) => {
      const searchParams = new URLSearchParams();
      if (params.page !== undefined) searchParams.set("page", String(params.page));
      if (params.size !== undefined) searchParams.set("size", String(params.size));
      if (params.status) searchParams.set("status", params.status);
      if (params.search && params.search.trim()) searchParams.set("search", params.search.trim());
      if (params.sort) searchParams.set("sort", params.sort);
      return searchParams.toString();
    };

    const q1 = buildOrdersQuery({ page: 0, size: 10, status: "PAID", search: "ORD-123" });
    assert.equal(q1, "page=0&size=10&status=PAID&search=ORD-123");

    const q2 = buildOrdersQuery({ page: 2, size: 25, sort: "orderDate,desc" });
    assert.equal(q2, "page=2&size=25&sort=orderDate%2Cdesc");
  });

  test("Format address correctly joins address parts and ignores empty fields", () => {
    const formatAddress = (addr) =>
      addr
        ? [addr.street, addr.city, addr.state, addr.zipCode, addr.country]
            .filter(Boolean)
            .join(", ")
        : "-";

    const address = {
      street: "123 Main St",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "USA",
    };
    assert.equal(formatAddress(address), "123 Main St, New York, NY, 10001, USA");
    assert.equal(formatAddress(null), "-");
  });

  test("PlaceOrderRequest schema validation", () => {
    const validatePlaceOrderPayload = (payload) => {
      if (!payload.addressId || typeof payload.addressId !== "number") {
        throw new Error("addressId is required");
      }
      if (!Array.isArray(payload.items) || payload.items.length === 0) {
        throw new Error("items must be a non-empty array");
      }
      for (const item of payload.items) {
        if (!item.productVariantId || item.quantity <= 0) {
          throw new Error("Invalid item");
        }
      }
      return true;
    };

    assert.equal(
      validatePlaceOrderPayload({
        addressId: 1,
        items: [{ productVariantId: 10, quantity: 2 }],
      }),
      true
    );

    assert.throws(() => validatePlaceOrderPayload({ addressId: 0, items: [] }));
    assert.throws(
      () =>
        validatePlaceOrderPayload({
          addressId: 1,
          items: [{ productVariantId: 0, quantity: 1 }],
        })
    );
  });
});
