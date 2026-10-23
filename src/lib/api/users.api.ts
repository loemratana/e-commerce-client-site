import { apiClient } from "@/lib/api/client";
import { getResponseData } from "@/lib/api/auth.api";
import {
  ApiResponse,
  GetUsersParams,
  UpdatePasswordRequest,
  UpdateProfileRequest,
  UserPageResponse,
  UserResponse,
} from "@/types/auth-api";

const USERS_ENDPOINT = "/api/v1/users";
const USERS_ME_ENDPOINT = "/api/v1/users/me";

type RawUserPageData = {
  content?: UserResponse[];
  totalElements?: number;
  totalPages?: number;
  currentPage?: number;
  pageSize?: number;
  number?: number;
  size?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
  first?: boolean;
  last?: boolean;
  empty?: boolean;
};

const normalizeUserPage = (
  data: RawUserPageData | UserResponse[] | undefined
): UserPageResponse => {
  if (!data) {
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      currentPage: 0,
      pageSize: 10,
      hasNext: false,
      hasPrevious: false,
      first: true,
      last: true,
      empty: true,
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
      first: true,
      last: true,
      empty: data.length === 0,
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
    first: data.first ?? currentPage === 0,
    last: data.last ?? (totalPages === 0 || currentPage >= totalPages - 1),
    empty: data.empty ?? content.length === 0,
  };
};

export const usersApi = {
  /**
   * Admin: Get paginated list of users with sorting and filtering.
   * GET /api/v1/users?page={page}&size={size}&sortBy={sortBy}&sortDirection={sortDirection}
   */
  async getUsers(params: GetUsersParams = {}): Promise<UserPageResponse> {
    const searchParams = new URLSearchParams();

    if (params.page !== undefined) {
      searchParams.set("page", String(params.page));
    }
    if (params.size !== undefined) {
      searchParams.set("size", String(params.size));
    }
    if (params.sortBy) {
      searchParams.set("sortBy", params.sortBy);
    }
    if (params.sortDirection) {
      searchParams.set("sortDirection", params.sortDirection);
    }
    if (params.search && params.search.trim()) {
      searchParams.set("search", params.search.trim());
    }
    if (params.role) {
      searchParams.set("role", params.role);
    }
    if (params.active !== undefined) {
      searchParams.set("active", String(params.active));
    }

    const query = searchParams.toString();
    const endpoint = query ? `${USERS_ENDPOINT}?${query}` : USERS_ENDPOINT;

    const response = await apiClient.get<
      ApiResponse<RawUserPageData | UserResponse[]> | RawUserPageData | UserResponse[]
    >(endpoint);

    if (
      response &&
      typeof response === "object" &&
      "data" in response &&
      response.data !== undefined
    ) {
      const data = getResponseData(
        response as ApiResponse<RawUserPageData | UserResponse[]>,
        "load users"
      );
      return normalizeUserPage(data);
    }

    return normalizeUserPage(response as RawUserPageData | UserResponse[]);
  },

  /** Alias for getUsers */
  getAll(params: GetUsersParams = {}) {
    return this.getUsers(params);
  },

  /**
   * Admin: Get user details by ID.
   * GET /api/v1/users/{id}
   */
  async getUserById(id: number | string): Promise<UserResponse> {
    const response = await apiClient.get<ApiResponse<UserResponse>>(
      `${USERS_ENDPOINT}/${id}`
    );
    return getResponseData(response, `load user #${id}`);
  },

  /**
   * Current user: Get logged-in profile.
   * GET /api/v1/users/me
   */
  async getProfile(): Promise<UserResponse> {
    const response = await apiClient.get<ApiResponse<UserResponse>>(
      USERS_ME_ENDPOINT
    );
    return getResponseData(response, "load your profile");
  },

  /**
   * Current user: Update profile fields.
   * PATCH /api/v1/users/me
   */
  async updateProfile(request: UpdateProfileRequest): Promise<UserResponse> {
    const response = await apiClient.patch<ApiResponse<UserResponse>>(
      USERS_ME_ENDPOINT,
      request
    );
    return getResponseData(response, "update your profile");
  },

  /**
   * Current user: Change account password.
   * PATCH /api/v1/users/me/password
   */
  async updatePassword(
    request: UpdatePasswordRequest
  ): Promise<UserResponse | undefined> {
    const response = await apiClient.patch<ApiResponse<UserResponse>>(
      `${USERS_ME_ENDPOINT}/password`,
      request
    );
    if (response?.success === false) {
      throw new Error(response.message || "Unable to update your password.");
    }
    return response?.data;
  },

  /**
   * Current user: Deactivate own account.
   * DELETE /api/v1/users/me
   */
  async deactivateAccount(): Promise<void> {
    const response = await apiClient.delete<ApiResponse<unknown>>(
      USERS_ME_ENDPOINT
    );
    if (response?.success === false) {
      throw new Error(response.message || "Unable to deactivate your account.");
    }
  },
};
