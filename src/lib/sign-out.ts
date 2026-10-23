import { authApi } from "@/lib/api/auth.api";
import { clearAuthTokens } from "@/lib/auth-session";

/**
 * Ends this device's session: revokes the refresh token on the server (best effort, so signing
 * out still works offline) and forgets both tokens locally. Callers clear the cart and navigate.
 */
export const endSession = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (refreshToken) {
    await authApi.logout(refreshToken).catch(() => undefined);
  }
  clearAuthTokens();
};
