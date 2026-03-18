import apiClient from './client';
import { Order, OrderCreateData, OrderStatus } from '../types';

export const ordersApi = {
  createOrder: async (data: OrderCreateData): Promise<Order> => {
    const response = await apiClient.post<Order>('/orders', data);
    return response.data;
  },

  getOrders: async (): Promise<Order[]> => {
    const response = await apiClient.get<Order[]>('/orders');
    return response.data;
  },

  getOrder: async (id: string): Promise<Order> => {
    const response = await apiClient.get<Order>(`/orders/${id}`);
    return response.data;
  },

  updateOrderStatus: async (id: string, status: OrderStatus): Promise<Order> => {
    const response = await apiClient.put<Order>(`/orders/${id}/status`, { status });
    return response.data;
  },
};
