import { create } from 'zustand';
import { cartApi } from '../api/cart';
import { CartItem } from '../types';

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isLoading: false,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const items = await cartApi.getCart();
      set({ items, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addToCart: async (productId: string, quantity: number) => {
    await cartApi.addToCart(productId, quantity);
    await get().fetchCart();
  },

  updateQuantity: async (itemId: string, quantity: number) => {
    await cartApi.updateCartItem(itemId, quantity);
    await get().fetchCart();
  },

  removeItem: async (itemId: string) => {
    await cartApi.removeCartItem(itemId);
    set({ items: get().items.filter((item) => item.id !== itemId) });
  },

  getTotalItems: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
