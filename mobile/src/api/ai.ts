import apiClient from './client';
import { DemandForecast, PriceSuggestion, PriceTrendResponse } from '../types';

export const aiApi = {
  getDemandForecast: async (categoryId?: number): Promise<DemandForecast[]> => {
    const params = categoryId != null ? { category_id: categoryId } : undefined;
    const response = await apiClient.get<DemandForecast[]>('/ai/demand-forecast', { params });
    return response.data;
  },

  getPriceSuggestion: async (productId: string): Promise<PriceSuggestion> => {
    const response = await apiClient.get<PriceSuggestion>('/ai/price-suggestion', {
      params: { product_id: productId },
    });
    return response.data;
  },

  getPriceTrends: async (productId: string): Promise<PriceTrendResponse> => {
    const response = await apiClient.get<PriceTrendResponse>('/ai/price-trends', {
      params: { product_id: productId },
    });
    return response.data;
  },
};
