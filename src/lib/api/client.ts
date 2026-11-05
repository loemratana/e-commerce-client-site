import { clearAuthTokens, saveAuthTokens } from "@/lib/auth-session";
import type { AuthResponse } from "@/types/auth-api";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(
    message: string,
    status: number,
    data?: unknown
  ) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// ----- automatic token refresh -----------------------------------------------------------------
//
// Access tokens are short-lived. When a request gets 401, the client swaps the refresh token for a
// new pair (POST /auth/refresh) and retries the request once.
//
// Refresh tokens are single-use and the API treats a reused one as theft (it signs the user out on
// every device), so a refresh token must never be sent twice: requests in this tab share one
// refresh, and tabs take turns through a Web Lock, each re-checking whether another tab already
// refreshed before using the token.

const REFRESH_ENDPOINT = "/api/v1/auth/refresh";
// Endpoints that answer 401 for bad credentials rather than an expired access token.
const NO_REFRESH_ENDPOINTS = [
  "/api/v1/auth/login",
  "/api/v1/auth/register",
  REFRESH_ENDPOINT,
  "/api/v1/auth/logout",
];

let refreshInFlight: Promise<string | null> | null = null;

const withRefreshLock = <T>(fn: () => Promise<T>): Promise<T> => {
  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
  return locks ? locks.request("auth-token-refresh", fn) : fn();
};

/** Returns a fresh access token, or null when the session can't be renewed (sign in again). */
const refreshAccessToken = (rejectedToken: string): Promise<string | null> => {
  refreshInFlight ??= withRefreshLock(async () => {
    // Another tab may have refreshed while this one waited for the lock.
    const current = localStorage.getItem("accessToken");
    if (current && current !== rejectedToken) return current;

    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) return null;

    let response: Response;
    try {
      response = await fetch(`${API_URL!.replace(/\/+$/, "")}${REFRESH_ENDPOINT}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Network error: keep the tokens so a later request can try again.
      return null;
    }

    const body = await response.json().catch(() => null);
    const auth = body?.data as AuthResponse | undefined;
    if (!response.ok || !auth?.accessToken || !auth.refreshToken) {
      // The server rejected the refresh token (expired, revoked, account deactivated): the
      // session is over. Other failures (5xx) keep the tokens for a later retry.
      if (response.status === 400 || response.status === 401 || response.status === 403) {
        clearAuthTokens();
      }
      return null;
    }

    saveAuthTokens(auth);
    return auth.accessToken;
  }).finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
};

// Reads `Content-Disposition: attachment; filename="..."` (or filename*=UTF-8''...).
const fileNameFrom = (header: string | null): string | undefined => {
  if (!header) return undefined;
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (encoded) return decodeURIComponent(encoded[1]);
  return /filename="?([^";]+)"?/i.exec(header)?.[1];
};

const toApiError = async (response: Response): Promise<ApiError> => {
  const data = await response.json().catch(() => null);
  const message = data?.message || data?.error || `API Error: ${response.status}`;
  return new ApiError(message, response.status, data);
};

class ApiClient {
  /** Sends the request with the access token, renewing it once on 401 (see refreshAccessToken). */
  private async send(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    if (!API_URL) {
      throw new Error("NEXT_PUBLIC_API_URL is not configured");
    }

    // localStorage only exists in the browser
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;

    const send = (accessToken: string | null) => {
      const headers = new Headers(options.headers);

      // Don't force Content-Type for FormData
      if (!(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
      }

      if (accessToken) {
        headers.set(
          "Authorization",
          `Bearer ${accessToken}`
        );
      }

      return fetch(
        `${API_URL.replace(/\/+$/, "")}${endpoint}`,
        {
          ...options,
          headers,
        }
      );
    };

    let response = await send(token);

    // Expired access token: renew it and retry once. If renewing fails, the 401 reaches the
    // caller as before, which asks the user to sign in.
    if (
      response.status === 401 &&
      token &&
      !NO_REFRESH_ENDPOINTS.includes(endpoint.split("?")[0])
    ) {
      const newToken = await refreshAccessToken(token);
      if (newToken) {
        response = await send(newToken);
      }
    }

    return response;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await this.send(endpoint, options);

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    if (!response.ok) {
      throw await toApiError(response);
    }

    // Try to parse JSON
    return (await response.json().catch(() => null)) as T;
  }

  /** Downloads a file (e.g. an invoice PDF); errors come back as ApiError like other calls. */
  async getBlob(endpoint: string): Promise<{ blob: Blob; fileName?: string }> {
    const response = await this.send(endpoint, { method: "GET" });
    if (!response.ok) {
      throw await toApiError(response);
    }
    return {
      blob: await response.blob(),
      fileName: fileNameFrom(response.headers.get("Content-Disposition")),
    };
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint, {
      method: "GET",
    });
  }

  post<T>(
    endpoint: string,
    body?: unknown
  ) {
    return this.request<T>(endpoint, {
      method: "POST",
      body:
        body instanceof FormData
          ? body
          : JSON.stringify(body),
    });
  }

  put<T>(
    endpoint: string,
    body?: unknown
  ) {
    return this.request<T>(endpoint, {
      method: "PUT",
      body:
        body instanceof FormData
          ? body
          : JSON.stringify(body),
    });
  }

  patch<T>(
    endpoint: string,
    body?: unknown
  ) {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body:
        body instanceof FormData
          ? body
          : JSON.stringify(body),
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, {
      method: "DELETE",
    });
  }
}

export const apiClient = new ApiClient();

export { ApiError };
