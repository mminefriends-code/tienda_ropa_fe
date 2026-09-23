import api from './api';
import type { Product, ProductFilters, Category, Cart, Order, User, BodyMeasurement, ArModel, ArSession, SizeRecommendation, PaginatedResponse } from '../types';

export const productsApi = {
  getAll: (params?: ProductFilters) => api.get<PaginatedResponse<Product>>('/products', { params }),
  getBySlug: (slug: string) => api.get<Product>(`/products/${slug}`),
  getById: (id: string) => api.get<Product>(`/products/${id}`),
  getFeatured: (limit = 8) => api.get<Product[]>('/products/featured', { params: { limit } }),
  getRelated: (id: string, limit = 4) => api.get<Product[]>(`/products/${id}/related`, { params: { limit } }),
  getRecommendedSize: (id: string) => api.get<SizeRecommendation>(`/products/${id}/recommended-size`),
  getFilters: (categoryId?: string) => api.get('/products/filters', { params: { categoryId } }),
};

export const categoriesApi = {
  getTree: () => api.get<Category[]>('/categories'),
  getAll: (includeInactive = false) => api.get<Category[]>('/categories/flat', { params: { includeInactive } }),
  getBySlug: (slug: string) => api.get<Category>(`/categories/${slug}`),
};

export const cartApi = {
  get: () => api.get<Cart>('/cart'),
  addItem: (data: { productId: string; variantId: string; quantity: number }) => api.post('/cart/items', data),
  updateItem: (itemId: string, quantity: number) => api.put(`/cart/items/${itemId}`, { quantity }),
  removeItem: (itemId: string) => api.delete(`/cart/items/${itemId}`),
  clear: () => api.delete('/cart'),
};

export const ordersApi = {
  create: (data: { shippingAddress: any; billingAddress?: any; notes?: string; paymentMethod?: string }) => api.post<Order>('/orders', data),
  getAll: (page = 1, limit = 20) => api.get<PaginatedResponse<Order>>('/orders', { params: { page, limit } }),
  getById: (id: string) => api.get<Order>(`/orders/${id}`),
  getByNumber: (orderNumber: string) => api.get<Order>(`/orders/number/${orderNumber}`),
  uploadReceipt: (id: string, file: File) => {
    const form = new FormData();
    form.append('receipt', file);
    return api.post<Order>(`/orders/${id}/receipt`, form);
  },
};

export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string }) => api.post('/auth/register', data),
  refresh: () => api.post('/auth/refresh'),
  me: () => api.get<User>('/auth/me'),
};

export const userApi = {
  update: (data: Partial<User>) => api.put<User>('/users/me', data),
  getMeasurements: () => api.get<BodyMeasurement>('/users/me/measurements'),
  updateMeasurements: (data: Partial<BodyMeasurement>) => api.put<BodyMeasurement>('/users/me/measurements', data),
};

export const arApi = {
  getModels: (productId: string) => api.get<ArModel[]>(`/ar/models/${productId}`),
  getModel: (id: string) => api.get<ArModel>(`/ar/models/detail/${id}`),
  createSession: (data: { productId: string; variantId?: string; arModelId: string }) => api.post<ArSession>('/ar/session', data),
  endSession: (sessionId: string, data: { duration?: number; screenshotUrl?: string; rating?: number; feedback?: string }) => api.put<ArSession>(`/ar/session/${sessionId}/end`, data),
  getMySessions: () => api.get<ArSession[]>('/ar/sessions/me'),
};