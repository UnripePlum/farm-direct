import apiClient from './client';
import { Review, ReviewCreate } from '../types';

export const reviewsApi = {
  createReview: async (data: ReviewCreate): Promise<Review> => {
    const response = await apiClient.post<Review>('/reviews', data);
    return response.data;
  },

  getProductReviews: async (productId: string): Promise<Review[]> => {
    const response = await apiClient.get<Review[]>(`/reviews/product/${productId}`);
    return response.data;
  },
};
