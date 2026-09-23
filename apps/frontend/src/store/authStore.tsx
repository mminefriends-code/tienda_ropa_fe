import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ReactNode, useEffect } from 'react';
import type { User } from '../types';
import { authApi, userApi } from '../services/endpoints';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string }) => Promise<void>;
  logout: () => void;
  refreshTokens: () => Promise<void>;
  fetchUser: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => void;
  update: (data: Partial<User>) => Promise<void>;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,

      setTokens: (accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ accessToken, refreshToken });
      },

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login(email, password);
          const { user, accessToken, refreshToken } = response.data;
          get().setTokens(accessToken, refreshToken);
          set({ user, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const response = await authApi.register(data);
          const { user, accessToken, refreshToken } = response.data;
          get().setTokens(accessToken, refreshToken);
          set({ user, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, accessToken: null, refreshToken: null });
      },

      update: async (data: Partial<User>) => {
        const response = await userApi.update(data);
        set({ user: response.data });
      },

      refreshTokens: async () => {
        try {
          const response = await authApi.refresh();
          const { accessToken, refreshToken } = response.data;
          get().setTokens(accessToken, refreshToken);
        } catch {
          get().logout();
        }
      },

      fetchUser: async () => {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) return;
        try {
          const response = await authApi.me();
          set({ user: response.data });
        } catch {
          get().logout();
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    },
  ),
);

export { useAuthStore };

export function AuthProvider({ children }: { children: ReactNode }) {
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (accessToken) {
      fetchUser();
    }
  }, [accessToken, fetchUser]);

  return <>{children}</>;
}