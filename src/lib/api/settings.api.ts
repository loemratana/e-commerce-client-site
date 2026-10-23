import { apiClient } from "@/lib/api/client";
import { getResponseData } from "@/lib/api/auth.api";
import { ApiResponse } from "@/types/auth-api";

export type PublicSettings = {
  storeName: string;
  description: string | null;
  email: string | null;
  phone: string | null;
  currency: string;
};

// The layout (currency) and header (contact details) both need these on every page load: share
// one request. A failed request isn't kept, so the next caller tries again.
let publicSettings: Promise<PublicSettings> | null = null;

export const settingsApi = {
  /**
   * Store name, contact details and currency set in the admin dashboard. No login needed.
   * GET /api/v1/settings/public
   */
  getPublic(): Promise<PublicSettings> {
    publicSettings ??= apiClient
      .get<ApiResponse<PublicSettings>>("/api/v1/settings/public")
      .then((response) => getResponseData(response, "load store settings"))
      .catch((error) => {
        publicSettings = null;
        throw error;
      });
    return publicSettings;
  },
};
