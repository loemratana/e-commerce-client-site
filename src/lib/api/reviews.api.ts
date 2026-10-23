import { apiClient } from "@/lib/api/client";
import { getResponseData } from "@/lib/api/auth.api";
import { ApiResponse } from "@/types/auth-api";
import { Review, ReviewPage, ReviewRequest } from "@/types/review";

const REVIEWS_ENDPOINT = "/api/v1/review";

const getReviewPage = (response: ApiResponse<ReviewPage>) =>
  getResponseData(response, "load reviews");

const getReview = (response: ApiResponse<Review>) =>
  getResponseData(response, "save review");

const pageEndpoint = (endpoint: string, page: number, size: number) => {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  return `${endpoint}?${params.toString()}`;
};

export const reviewsApi = {
  async getAll(page = 0, size = 10): Promise<ReviewPage> {
    return getReviewPage(
      await apiClient.get<ApiResponse<ReviewPage>>(
        pageEndpoint(REVIEWS_ENDPOINT, page, size)
      )
    );
  },

  async getMine(page = 0, size = 10): Promise<ReviewPage> {
    return getReviewPage(
      await apiClient.get<ApiResponse<ReviewPage>>(
        pageEndpoint(`${REVIEWS_ENDPOINT}/me`, page, size)
      )
    );
  },

  async getProductReviews(
    productId: number,
    page = 0,
    size = 10
  ): Promise<ReviewPage> {
    return getReviewPage(
      await apiClient.get<ApiResponse<ReviewPage>>(
        pageEndpoint(`${REVIEWS_ENDPOINT}/product/${productId}`, page, size)
      )
    );
  },

  async create(
    productId: number,
    request: ReviewRequest
  ): Promise<Review> {
    return getReview(
      await apiClient.post<ApiResponse<Review>>(
        `${REVIEWS_ENDPOINT}/product/${productId}`,
        request
      )
    );
  },

  async update(id: number, request: ReviewRequest): Promise<Review> {
    return getReview(
      await apiClient.put<ApiResponse<Review>>(
        `${REVIEWS_ENDPOINT}/${id}`,
        request
      )
    );
  },

  async delete(id: number): Promise<void> {
    const response = await apiClient.delete<ApiResponse<unknown>>(
      `${REVIEWS_ENDPOINT}/${id}`
    );
    if (response?.success === false) {
      throw new Error(response.message || "Unable to delete review.");
    }
  },
};
