import { test, describe } from "node:test";
import assert from "node:assert/strict";

describe("Users API & Utilities Test Suite", () => {
  test("Query parameters for getUsers build correct query string", () => {
    const buildQuery = (params = {}) => {
      const searchParams = new URLSearchParams();
      if (params.page !== undefined) searchParams.set("page", String(params.page));
      if (params.size !== undefined) searchParams.set("size", String(params.size));
      if (params.sortBy) searchParams.set("sortBy", params.sortBy);
      if (params.sortDirection) searchParams.set("sortDirection", params.sortDirection);
      if (params.search && params.search.trim()) searchParams.set("search", params.search.trim());
      if (params.role) searchParams.set("role", params.role);
      if (params.active !== undefined) searchParams.set("active", String(params.active));
      return searchParams.toString();
    };

    assert.equal(
      buildQuery({
        page: 0,
        size: 10,
        sortBy: "createdAt",
        sortDirection: "desc",
      }),
      "page=0&size=10&sortBy=createdAt&sortDirection=desc"
    );

    assert.equal(
      buildQuery({
        page: 2,
        size: 20,
        search: "ratana",
        active: true,
      }),
      "page=2&size=20&search=ratana&active=true"
    );

    assert.equal(buildQuery({}), "");
  });

  test("Normalizes paginated user response structure from backend payload", () => {
    const normalizeUserPage = (data) => {
      if (!data) {
        return {
          content: [],
          totalElements: 0,
          totalPages: 0,
          currentPage: 0,
          pageSize: 10,
          hasNext: false,
          hasPrevious: false,
        };
      }

      if (Array.isArray(data)) {
        return {
          content: data,
          totalElements: data.length,
          totalPages: data.length > 0 ? 1 : 0,
          currentPage: 0,
          pageSize: data.length || 10,
          hasNext: false,
          hasPrevious: false,
        };
      }

      const content = Array.isArray(data.content) ? data.content : [];
      const currentPage = data.currentPage ?? data.number ?? 0;
      const pageSize = data.pageSize ?? data.size ?? (content.length || 10);
      const totalElements = data.totalElements ?? content.length;
      const totalPages =
        data.totalPages ?? (pageSize > 0 ? Math.ceil(totalElements / pageSize) : 0);

      return {
        content,
        totalElements,
        totalPages,
        currentPage,
        pageSize,
        hasNext: data.hasNext ?? currentPage < totalPages - 1,
        hasPrevious: data.hasPrevious ?? currentPage > 0,
      };
    };

    const mockBackendResponse = {
      content: [
        {
          id: 12,
          firstName: "loem",
          lastName: "ratana",
          name: "loem ratana",
          email: "ratana.setec.mis@gmail.com",
          active: true,
          phone: null,
          profileImage: null,
          role: [
            {
              roleId: 2,
              roleName: "CUSTOMER",
              description: "Regular shopper",
              active: true,
              permissions: [],
            },
          ],
          addresses: [
            {
              id: 2,
              street: "gdgdfg",
              city: "dgfdg",
              state: "dgdfg",
              zipCode: "dgfdgd",
              country: "dgdfgdfg",
              isDefault: true,
            },
          ],
          createdAt: "2026-10-16T15:07:57.89235",
          updatedAt: "2026-10-20T20:25:05.638295",
        },
      ],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10,
    };

    const result = normalizeUserPage(mockBackendResponse);
    assert.equal(result.content.length, 1);
    assert.equal(result.content[0].email, "ratana.setec.mis@gmail.com");
    assert.equal(result.content[0].role[0].roleName, "CUSTOMER");
    assert.equal(result.totalElements, 1);
    assert.equal(result.totalPages, 1);
    assert.equal(result.currentPage, 0);
    assert.equal(result.hasNext, false);
    assert.equal(result.hasPrevious, false);
  });
});
