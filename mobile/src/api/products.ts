import apiClient from './client';
import {
  Product,
  ProductCreate,
  ProductUpdate,
  ProductListResponse,
  ProductFilterParams,
  Category,
} from '../types';

export const productsApi = {
  getProducts: async (params?: ProductFilterParams): Promise<ProductListResponse> => {
    const response = await apiClient.get<ProductListResponse>('/products', { params });
    return response.data;
  },

  getProduct: async (id: string): Promise<Product> => {
    const response = await apiClient.get<Product>(`/products/${id}`);
    return response.data;
  },

  createProduct: async (data: ProductCreate): Promise<Product> => {
    const response = await apiClient.post<Product>('/products', data);
    return response.data;
  },

  updateProduct: async (id: string, data: ProductUpdate): Promise<Product> => {
    const response = await apiClient.put<Product>(`/products/${id}`, data);
    return response.data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },

  getCategories: async (): Promise<Category[]> => {
    const response = await apiClient.get<Category[]>('/categories');
    return response.data;
  },
};
