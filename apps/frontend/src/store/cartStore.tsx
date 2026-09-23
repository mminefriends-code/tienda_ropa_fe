import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ReactNode, useEffect } from 'react';
import type { Cart } from '../types';
import { cartApi, productsApi } from '../services/endpoints';
import { useAuthStore } from './authStore';

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (productId: string, variantId: string, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  resetGuestCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
}

const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: null,
      isLoading: false,

      fetchCart: async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) return;
        set({ isLoading: true });
        try {
          const localCart = get().cart;
          if (localCart && localCart.id === 'guest-cart' && localCart.items.length > 0) {
            for (const item of localCart.items) {
              try {
                await cartApi.addItem({
                  productId: item.product.id,
                  variantId: item.variant.id,
                  quantity: item.quantity,
                });
              } catch {
                // item no disponible, se omite
              }
            }
          }
          const response = await cartApi.get();
          set({ cart: response.data, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },

      addItem: async (productId, variantId, quantity) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          try {
            await cartApi.addItem({ productId, variantId, quantity });
            await get().fetchCart();
            return;
          } catch {
            // fallback local
          }
        }
        // Modo invitado local
        const currentCart = get().cart || { id: 'guest-cart', items: [] };
        const existingIndex = currentCart.items.findIndex(
          (item) => item.variant?.id === variantId,
        );

        let newItems = [...currentCart.items];
        if (existingIndex > -1) {
          newItems[existingIndex] = {
            ...newItems[existingIndex],
            quantity: newItems[existingIndex].quantity + quantity,
          };
        } else {
          const productResponse = await productsApi.getById(productId);
          const product = productResponse.data;
          const variant = product.variants.find((v) => v.id === variantId);
          if (!variant) {
            throw new Error('Variante no disponible');
          }
          newItems.push({
            id: `guest-item-${Date.now()}`,
            quantity,
            product,
            variant,
          });
        }
        set({ cart: { id: 'guest-cart', items: newItems } });
      },

      updateQuantity: async (itemId, quantity) => {
        if (quantity <= 0) {
          await get().removeItem(itemId);
          return;
        }
        const token = localStorage.getItem('accessToken');
        if (token) {
          try {
            await cartApi.updateItem(itemId, quantity);
            await get().fetchCart();
            return;
          } catch {
            // fallback
          }
        }
        const currentCart = get().cart;
        if (!currentCart) return;
        const newItems = currentCart.items.map((item) =>
          item.id === itemId ? { ...item, quantity } : item,
        );
        set({ cart: { ...currentCart, items: newItems } });
      },

      removeItem: async (itemId) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          try {
            await cartApi.removeItem(itemId);
            await get().fetchCart();
            return;
          } catch {
            // fallback
          }
        }
        const currentCart = get().cart;
        if (!currentCart) return;
        set({
          cart: {
            ...currentCart,
            items: currentCart.items.filter((item) => item.id !== itemId),
          },
        });
      },

      clearCart: async () => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          try {
            await cartApi.clear();
          } catch {}
        }
        set({ cart: { id: 'guest-cart', items: [] } });
      },

      resetGuestCart: () => {
        set({ cart: { id: 'guest-cart', items: [] }, isLoading: false });
      },

      getTotalItems: () => {
        return get().cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
      },

      getSubtotal: () => {
        return get().cart?.items.reduce((sum, item) => sum + item.variant.price * item.quantity, 0) || 0;
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ cart: state.cart }),
    },
  ),
);

export { useCartStore };

export function CartProvider({ children }: { children: ReactNode }) {
  const fetchCart = useCartStore((state) => state.fetchCart);
  const resetGuestCart = useCartStore((state) => state.resetGuestCart);
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (accessToken) {
      fetchCart();
    } else {
      resetGuestCart();
    }
  }, [accessToken, fetchCart, resetGuestCart]);

  return <>{children}</>;
}