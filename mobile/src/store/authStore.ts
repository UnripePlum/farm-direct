import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api/auth';
import { authProvider } from '../services/auth';
import { User, SignUpData } from '../types';
import { ASYNC_STORAGE_KEYS } from '../utils/constants';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  socialLogin: (provider: 'google' | 'kakao') => Promise<void>;
  signup: (data: Omit<SignUpData, 'firebase_uid'>, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  getToken: () => string | null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  getToken: () => get().token,

  loadStoredAuth: async () => {
    try {
      const [token, userJson] = await Promise.all([
        AsyncStorage.getItem(ASYNC_STORAGE_KEYS.TOKEN),
        AsyncStorage.getItem(ASYNC_STORAGE_KEYS.USER),
      ]);
      if (token && userJson) {
        const user = JSON.parse(userJson) as User;
        set({ token, user, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const { token: firebaseToken } = await authProvider.signInWithEmail(email, password);
      const response = await authApi.login(firebaseToken);
      await Promise.all([
        AsyncStorage.setItem(ASYNC_STORAGE_KEYS.TOKEN, response.access),
        AsyncStorage.setItem(ASYNC_STORAGE_KEYS.USER, JSON.stringify(response.user)),
      ]);
      set({
        user: response.user,
        token: response.access,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  socialLogin: async (provider: 'google' | 'kakao') => {
    set({ isLoading: true });
    try {
      const { token: firebaseToken } = await authProvider.signInWithSocial(provider);
      const response = await authApi.socialLogin({ provider, token: firebaseToken }, firebaseToken);
      await Promise.all([
        AsyncStorage.setItem(ASYNC_STORAGE_KEYS.TOKEN, response.access),
        AsyncStorage.setItem(ASYNC_STORAGE_KEYS.USER, JSON.stringify(response.user)),
      ]);
      set({
        user: response.user,
        token: response.access,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  signup: async (data: Omit<SignUpData, 'firebase_uid'>, email: string, password: string) => {
    set({ isLoading: true });
    try {
      const { uid, token: firebaseToken } = await authProvider.signUpWithEmail(email, password);
      const response = await authApi.register({ ...data, firebase_uid: uid }, firebaseToken);
      await Promise.all([
        AsyncStorage.setItem(ASYNC_STORAGE_KEYS.TOKEN, response.access),
        AsyncStorage.setItem(ASYNC_STORAGE_KEYS.USER, JSON.stringify(response.user)),
      ]);
      set({
        user: response.user,
        token: response.access,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    await authProvider.signOut();
    await Promise.all([
      AsyncStorage.removeItem(ASYNC_STORAGE_KEYS.TOKEN),
      AsyncStorage.removeItem(ASYNC_STORAGE_KEYS.USER),
    ]);
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
