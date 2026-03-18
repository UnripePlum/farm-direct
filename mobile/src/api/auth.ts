import apiClient from './client';
import { LoginResponse, SignUpData, User, UserUpdateData, SocialLoginData } from '../types';

export const authApi = {
  login: async (firebaseToken: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', undefined, {
      headers: { Authorization: `Bearer ${firebaseToken}` },
    });
    return response.data;
  },

  register: async (data: SignUpData, firebaseToken: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/register', data, {
      headers: { Authorization: `Bearer ${firebaseToken}` },
    });
    return response.data;
  },

  socialLogin: async (data: SocialLoginData, firebaseToken: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/social-login', data, {
      headers: { Authorization: `Bearer ${firebaseToken}` },
    });
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  updateProfile: async (data: UserUpdateData): Promise<User> => {
    const response = await apiClient.put<User>('/auth/me', data);
    return response.data;
  },
};
