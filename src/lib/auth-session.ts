import { AuthResponse, LoginRequest } from "@/types/auth-api";
import { notifyAuthStateChanged } from "@/lib/auth-prompt";

const DEVICE_ID_KEY = "authDeviceId";

export const createLoginRequest = (
  email: string,
  password: string
): LoginRequest => {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    deviceId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  return {
    email,
    password,
    deviceId,
    deviceName: "Web browser",
    deviceType: "web",
  };
};

export const saveAuthTokens = (auth: AuthResponse) => {
  localStorage.setItem("accessToken", auth.accessToken);
  localStorage.setItem("refreshToken", auth.refreshToken);
};

export const clearAuthTokens = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  notifyAuthStateChanged();
};
