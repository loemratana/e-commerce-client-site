export const AUTH_REQUIRED_EVENT = "auth-required";
export const AUTHENTICATED_EVENT = "authenticated";
export const AUTH_STATE_CHANGED_EVENT = "auth-state-changed";

let authenticationPromptRequested = false;

export const hasAccessToken = () =>
  typeof window !== "undefined" &&
  Boolean(localStorage.getItem("accessToken"));

export const requestAuthentication = () => {
  if (typeof window !== "undefined") {
    authenticationPromptRequested = true;
    window.dispatchEvent(new Event(AUTH_REQUIRED_EVENT));
  }
};

export const isAuthenticationPromptRequested = () =>
  authenticationPromptRequested;

export const dismissAuthenticationPrompt = () => {
  authenticationPromptRequested = false;
};

export const notifyAuthenticated = () => {
  if (typeof window !== "undefined") {
    dismissAuthenticationPrompt();
    window.dispatchEvent(new Event(AUTHENTICATED_EVENT));
    window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT));
  }
};

export const notifyAuthStateChanged = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT));
  }
};
