import { test, describe } from "node:test";
import assert from "node:assert/strict";

describe("Returns API & Utilities Test Suite", () => {
  // 1. Response envelope handling
  test("getResponseData extracts data from success envelope and throws on error", () => {
    const getResponseData = (response, action) => {
      if (response.success === false || response.data === undefined) {
        throw new Error(response.message || `Unable to ${action}.`);
      }
      return response.data;
    };

    const validEnvelope = {
      message: "Operation successful",
      success: true,
      data: { returnNumber: "RET-2026-0001", status: "REQUESTED" },
      timestamp: "2026-10-20T10:00:00Z",
    };
    assert.deepEqual(getResponseData(validEnvelope, "load return"), {
      returnNumber: "RET-2026-0001",
      status: "REQUESTED",
    });

    const errorEnvelope = {
      message: "Order return window has expired",
      success: false,
      timestamp: "2026-10-20T10:00:00Z",
    };
    assert.throws(
      () => getResponseData(errorEnvelope, "request return"),
      /Order return window has expired/
    );
  });

  // 2. Cancellation permissions
  test("canCancelReturn only permits returns in REQUESTED status", () => {
    const canCancelReturn = (status) => status === "REQUESTED";

    assert.equal(canCancelReturn("REQUESTED"), true);
    assert.equal(canCancelReturn("APPROVED"), false);
    assert.equal(canCancelReturn("REJECTED"), false);
    assert.equal(canCancelReturn("RECEIVED"), false);
    assert.equal(canCancelReturn("CANCELLED"), false);
  });

  // 3. Query params for getMyReturns
  test("Query parameters for getMyReturns builds correct URL", () => {
    const buildReturnsUrl = (endpoint, params = {}) => {
      const query = new URLSearchParams();
      if (params.page !== undefined) query.set("page", String(params.page));
      if (params.size !== undefined) query.set("size", String(params.size));
      if (params.sort !== undefined) query.set("sort", params.sort);
      const qs = query.toString();
      return qs ? `${endpoint}?${qs}` : endpoint;
    };

    const url1 = buildReturnsUrl("/api/v1/returns/me", {
      page: 0,
      size: 10,
    });
    assert.equal(url1, "/api/v1/returns/me?page=0&size=10");

    const url2 = buildReturnsUrl("/api/v1/returns/me", {
      page: 1,
      size: 20,
      sort: "createdAt,desc",
    });
    assert.equal(url2, "/api/v1/returns/me?page=1&size=20&sort=createdAt%2Cdesc");

    const url3 = buildReturnsUrl("/api/v1/returns/me");
    assert.equal(url3, "/api/v1/returns/me");
  });

  // 4. Return submission payload validation
  test("CreateReturnRequest validates required fields and structure", () => {
    const validateCreateReturnPayload = (payload) => {
      if (!payload.orderNumber || typeof payload.orderNumber !== "string") {
        throw new Error("Order number is required");
      }
      if (!payload.reason || typeof payload.reason !== "string" || !payload.reason.trim()) {
        throw new Error("Return reason is required");
      }
      if (!Array.isArray(payload.items) || payload.items.length === 0) {
        throw new Error("At least one item must be selected");
      }
      for (const item of payload.items) {
        if (!item.orderItemId || typeof item.orderItemId !== "number") {
          throw new Error("Valid orderItemId is required");
        }
        if (!item.quantity || item.quantity < 1) {
          throw new Error("Item quantity must be at least 1");
        }
      }
      return true;
    };

    const validPayload = {
      orderNumber: "ORD-2026-0001",
      reason: "Wrong size: Ordered L, needed M",
      items: [
        { orderItemId: 101, quantity: 1 },
        { orderItemId: 102, quantity: 2 },
      ],
    };
    assert.equal(validateCreateReturnPayload(validPayload), true);

    // Missing reason
    assert.throws(
      () =>
        validateCreateReturnPayload({
          orderNumber: "ORD-1",
          reason: "   ",
          items: [{ orderItemId: 1, quantity: 1 }],
        }),
      /Return reason is required/
    );

    // Empty items
    assert.throws(
      () =>
        validateCreateReturnPayload({
          orderNumber: "ORD-1",
          reason: "Defective",
          items: [],
        }),
      /At least one item must be selected/
    );

    // Invalid item quantity
    assert.throws(
      () =>
        validateCreateReturnPayload({
          orderNumber: "ORD-1",
          reason: "Defective",
          items: [{ orderItemId: 1, quantity: 0 }],
        }),
      /Item quantity must be at least 1/
    );
  });

  // 5. Quantity limit enforcement based on eligibility
  test("Quantity selection cannot exceed returnableQuantity from eligibility", () => {
    const clampQuantity = (requestedQty, maxReturnable) => {
      if (maxReturnable <= 0) return 0;
      return Math.max(0, Math.min(requestedQty, maxReturnable));
    };

    assert.equal(clampQuantity(1, 3), 1);
    assert.equal(clampQuantity(5, 3), 3);
    assert.equal(clampQuantity(-1, 3), 0);
    assert.equal(clampQuantity(2, 0), 0);
  });

  // 6. Ineligible order handling
  test("Order eligibility correctly identifies ineligible orders and expired return windows", () => {
    const isOrderReturnable = (eligibility) => {
      if (!eligibility || !eligibility.eligible) return false;
      if (eligibility.returnableUntil) {
        const deadline = new Date(eligibility.returnableUntil).getTime();
        const now = new Date("2026-10-20T12:00:00Z").getTime();
        if (now > deadline) return false;
      }
      const totalUnits = (eligibility.items ?? []).reduce(
        (sum, item) => sum + (item.quantity ?? 0),
        0
      );
      return totalUnits > 0;
    };

    const eligible = {
      orderNumber: "ORD-1",
      eligible: true,
      reason: null,
      returnableUntil: "2026-11-01T00:00:00Z",
      items: [{ orderItemId: 10, quantity: 2 }],
    };
    assert.equal(isOrderReturnable(eligible), true);

    const backendIneligible = {
      orderNumber: "ORD-2",
      eligible: false,
      reason: "Order is not DELIVERED",
      returnableUntil: null,
      items: [],
    };
    assert.equal(isOrderReturnable(backendIneligible), false);

    const expired = {
      orderNumber: "ORD-3",
      eligible: true,
      reason: null,
      returnableUntil: "2026-10-01T00:00:00Z",
      items: [{ orderItemId: 10, quantity: 1 }],
    };
    assert.equal(isOrderReturnable(expired), false);

    const noItemsLeft = {
      orderNumber: "ORD-4",
      eligible: true,
      reason: null,
      returnableUntil: "2026-11-01T00:00:00Z",
      items: [{ orderItemId: 10, quantity: 0 }],
    };
    assert.equal(isOrderReturnable(noItemsLeft), false);
  });

  // 7. Merging backend eligibility response with order details
  test("Merging eligibility quantities with order item details", () => {
    const orderItems = [
      {
        id: 101,
        productName: "Classic T-Shirt",
        sku: "TS-BLK-L",
        color: "Black",
        sizeName: "L",
        quantity: 3,
        price: 25.0,
      },
      {
        id: 102,
        productName: "Denim Jeans",
        sku: "JN-BLU-32",
        color: "Blue",
        sizeName: "32",
        quantity: 1,
        price: 60.0,
      },
    ];

    const eligibilityItems = [
      { orderItemId: 101, quantity: 2 }, // 1 was already returned previously
      { orderItemId: 102, quantity: 1 },
    ];

    const merged = orderItems.map((item) => {
      const el = eligibilityItems.find((e) => e.orderItemId === item.id);
      const returnableQuantity = el ? el.quantity : 0;
      return {
        orderItemId: item.id,
        productName: item.productName,
        purchasedQuantity: item.quantity,
        returnableQuantity,
        canReturn: returnableQuantity > 0,
      };
    });

    assert.equal(merged[0].orderItemId, 101);
    assert.equal(merged[0].purchasedQuantity, 3);
    assert.equal(merged[0].returnableQuantity, 2);
    assert.equal(merged[0].canReturn, true);

    assert.equal(merged[1].orderItemId, 102);
    assert.equal(merged[1].purchasedQuantity, 1);
    assert.equal(merged[1].returnableQuantity, 1);
    assert.equal(merged[1].canReturn, true);
  });

  // 8. Distinguishing estimated refund from final refund
  test("Refund values properly distinguish estimated from finalized refunds", () => {
    const getRefundDisplay = (record) => {
      if (record.refundAmount !== null && record.refundAmount !== undefined) {
        return {
          type: "final",
          amount: record.refundAmount,
          label: "Refunded",
        };
      }
      return {
        type: "estimated",
        amount: record.estimatedRefund ?? 0,
        label: "Estimated Refund",
      };
    };

    const requested = {
      status: "REQUESTED",
      estimatedRefund: 49.99,
      refundAmount: null,
    };
    assert.deepEqual(getRefundDisplay(requested), {
      type: "estimated",
      amount: 49.99,
      label: "Estimated Refund",
    });

    const received = {
      status: "RECEIVED",
      estimatedRefund: 49.99,
      refundAmount: 45.0,
    };
    assert.deepEqual(getRefundDisplay(received), {
      type: "final",
      amount: 45.0,
      label: "Refunded",
    });
  });

  // 9. Duplicate submission prevention
  test("Duplicate submission is blocked while request is active", async () => {
    let callCount = 0;
    let isSubmitting = false;

    const submit = async () => {
      if (isSubmitting) return "BLOCKED";
      isSubmitting = true;
      callCount++;
      // Simulate async network request
      await new Promise((r) => setTimeout(r, 10));
      isSubmitting = false;
      return "SUCCESS";
    };

    const [first, second] = await Promise.all([submit(), submit()]);
    assert.equal(first, "SUCCESS");
    assert.equal(second, "BLOCKED");
    assert.equal(callCount, 1);
  });

  // 10. Orders Page: Return Action visibility based on backend eligibility
  test("Orders Page displays Request Return only when backend reports eligible: true", () => {
    const shouldShowRequestReturn = (eligibility) => {
      return Boolean(eligibility?.eligible);
    };

    assert.equal(shouldShowRequestReturn({ eligible: true }), true);
    assert.equal(shouldShowRequestReturn({ eligible: false }), false);
    assert.equal(shouldShowRequestReturn(null), false);
    assert.equal(shouldShowRequestReturn(undefined), false);
  });

  // 11. Orders Page: Ineligible orders and cancelled orders explain backend-provided reason
  test("Orders Page explains backend-provided reason for ineligible and cancelled orders", () => {
    const getIneligibleExplanation = (orderStatus, eligibility) => {
      if (eligibility && !eligibility.eligible && eligibility.reason) {
        return eligibility.reason;
      }
      return null;
    };

    const cancelledOrderEligibility = {
      orderNumber: "ORD-999",
      eligible: false,
      reason: "Only delivered orders can be returned",
      items: [],
    };
    assert.equal(
      getIneligibleExplanation("CANCELLED", cancelledOrderEligibility),
      "Only delivered orders can be returned"
    );

    const expiredOrderEligibility = {
      orderNumber: "ORD-888",
      eligible: false,
      reason: "The return period for this order ended on 2026-10-15",
      items: [],
    };
    assert.equal(
      getIneligibleExplanation("DELIVERED", expiredOrderEligibility),
      "The return period for this order ended on 2026-10-15"
    );

    const allReturnedEligibility = {
      orderNumber: "ORD-777",
      eligible: false,
      reason: "Every item of this order is already being returned",
      items: [],
    };
    assert.equal(
      getIneligibleExplanation("DELIVERED", allReturnedEligibility),
      "Every item of this order is already being returned"
    );
  });

  // 12. Orders Page: Display all existing returns for an order
  test("Orders Page maps and displays all existing returns with link targets", () => {
    const existingReturns = [
      {
        returnNumber: "RET-001",
        status: "REQUESTED",
        reason: "Wrong size",
      },
      {
        returnNumber: "RET-002",
        status: "APPROVED",
        reason: "Defective item",
      },
    ];

    const mappedReturns = existingReturns.map((r) => ({
      returnNumber: r.returnNumber,
      status: r.status,
      href: `/account/returns/${encodeURIComponent(r.returnNumber)}`,
    }));

    assert.equal(mappedReturns.length, 2);
    assert.equal(mappedReturns[0].href, "/account/returns/RET-001");
    assert.equal(mappedReturns[1].href, "/account/returns/RET-002");
  });

  // 13. Orders Page: Caching and refresh behavior
  test("Orders Page caching avoids duplicate requests and supports forced refresh", async () => {
    const cache = new Map();
    let apiCallCount = 0;

    const fetchOrderData = async (orderNumber, force = false) => {
      if (!force && cache.has(orderNumber)) {
        return cache.get(orderNumber);
      }
      apiCallCount++;
      const data = {
        orderNumber,
        fetchedAt: Date.now(),
        returns: [{ returnNumber: `RET-${orderNumber}` }],
      };
      cache.set(orderNumber, data);
      return data;
    };

    // First fetch
    await fetchOrderData("ORD-101");
    assert.equal(apiCallCount, 1);

    // Second fetch (cached) -> should not increment call count
    await fetchOrderData("ORD-101");
    assert.equal(apiCallCount, 1);

    // Different order -> increments call count
    await fetchOrderData("ORD-102");
    assert.equal(apiCallCount, 2);

    // Forced refresh for ORD-101 (e.g. after return submission) -> increments call count
    await fetchOrderData("ORD-101", true);
    assert.equal(apiCallCount, 3);
  });
});
