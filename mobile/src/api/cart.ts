import apiClient from './client';
import { CartItem } from '../types';

export const cartApi = {
  getCart: async (): Promise<CartItem[]> => {
    const response = await apiClient.get<CartItem[]>('/cart');
    return response.data;
  },

  addToCart: async (productId: string, quantity: number): Promise<CartItem> => {
    const response = await apiClient.post<CartItem>('/cart', {
      product_id: productId,
      quantity,
    });
    return response.data;
  },

  updateCartItem: async (itemId: string, quantity: number): Promise<CartItem> => {
    const response = await apiClient.put<CartItem>(`/cart/${itemId}`, { quantity });
    return response.data;
  },

  removeCartItem: async (itemId: string): Promise<void> => {
    await apiClient.delete(`/cart/${itemId}`);
  },
};
