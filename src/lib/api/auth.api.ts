import { apiClient } from "@/lib/api/client";
import {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UserResponse,
} from "@/types/auth-api";

const AUTH_ENDPOINT = "/api/v1/auth";

export const getResponseData = <T>(
  response: ApiResponse<T>,
  action: string
): T => {
  if (response.success === false || response.data === undefined) {
    throw new Error(response.message || `Unable to ${action}.`);
  }

  return response.data;
};

export const authApi = {
  async register(request: RegisterRequest): Promise<UserResponse> {
    const response = await apiClient.post<ApiResponse<UserResponse>>(
      `${AUTH_ENDPOINT}/register`,
      request
    );
    return getResponseData(response, "register");
  },

  async login(request: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      `${AUTH_ENDPOINT}/login`,
      request
    );
    const auth = getResponseData(response, "sign in");

    if (!auth.accessToken || !auth.refreshToken) {
      throw new Error("The login response did not include valid session tokens.");
    }

    return auth;
  },

  /**
   * Revokes this device's refresh token on the server. Public endpoint: it only needs the refresh
   * token, so it still works when the access token has expired.
   * POST /api/v1/auth/logout
   */
  async logout(refreshToken: string): Promise<void> {
    await apiClient.post<ApiResponse<null>>(`${AUTH_ENDPOINT}/logout`, { refreshToken });
  },
};
