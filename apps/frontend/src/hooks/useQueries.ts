import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, categoriesApi, ordersApi, userApi, arApi } from '../services/endpoints';
import { useAuthStore } from '../store/authStore';
import type { ProductFilters, PaginatedResponse, SizeRecommendation } from '../types';

const selectData = <T>(data: { data: T }) => data.data;
const selectPaginated = <T>(data: { data: PaginatedResponse<T> }) => data.data;

export const useProducts = (filters?: ProductFilters) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => productsApi.getAll(filters),
    select: selectPaginated,
  });
};

export const useProduct = (slug: string) => {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsApi.getBySlug(slug),
    enabled: !!slug,
    select: selectData,
  });
};

export const useFeaturedProducts = (limit = 8) => {
  return useQuery({
    queryKey: ['products', 'featured', limit],
    queryFn: () => productsApi.getFeatured(limit),
    select: selectData,
  });
};

export const useRelatedProducts = (id: string, limit = 4) => {
  return useQuery({
    queryKey: ['products', 'related', id, limit],
    queryFn: () => productsApi.getRelated(id, limit),
    enabled: !!id,
    select: selectData,
  });
};

interface ProductFiltersData {
  sizes: string[];
  colors: Array<{ name: string; hex: string }>;
  priceRange: { min: number; max: number };
}

export const useProductFilters = (categoryId?: string) => {
  return useQuery<ProductFiltersData>({
    queryKey: ['products', 'filters', categoryId],
    queryFn: async () => {
      const response = await productsApi.getFilters(categoryId);
      return response.data;
    },
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getTree(),
    select: selectData,
  });
};

export const useCategory = (slug: string) => {
  return useQuery({
    queryKey: ['category', slug],
    queryFn: () => categoriesApi.getBySlug(slug),
    enabled: !!slug,
    select: selectData,
  });
};

export const useOrders = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['orders', page, limit],
    queryFn: () => ordersApi.getAll(page, limit),
    select: selectPaginated,
  });
};

export const useOrder = (id: string) => {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getById(id),
    enabled: !!id,
    select: selectData,
  });
};

export const useUserMeasurements = () => {
  const hasToken = useAuthStore((state) => !!state.accessToken);
  return useQuery({
    queryKey: ['user', 'measurements'],
    queryFn: () => userApi.getMeasurements(),
    enabled: hasToken,
    select: selectData,
  });
};

export const useUpdateMeasurements = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => userApi.updateMeasurements(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'measurements'] });
    },
  });
};

export const useArModels = (productId: string) => {
  return useQuery({
    queryKey: ['ar', 'models', productId],
    queryFn: () => arApi.getModels(productId),
    enabled: !!productId,
    select: selectData,
  });
};

export const useRecommendedSize = (productId: string) => {
  return useQuery<SizeRecommendation>({
    queryKey: ['product', 'recommended-size', productId],
    queryFn: async () => {
      const response = await productsApi.getRecommendedSize(productId);
      return response.data;
    },
    enabled: !!productId,
  });
};

export const useCreateArSession = () => {
  return useMutation({
    mutationFn: (data: { productId: string; variantId?: string; arModelId: string }) => arApi.createSession(data),
  });
};

export const useEndArSession = () => {
  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data: any }) => arApi.endSession(sessionId, data),
  });
};