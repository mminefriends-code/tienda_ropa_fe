import api from './api';
import type { Product, Category, Order, User, PaginatedResponse, ProductVariant, ArModel } from '../types';

export interface DashboardStats {
  todaySales: number;
  monthSales: number;
  totalSales: number;
  pendingOrders: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  recentOrders: Order[];
  topProducts: { product: Product; totalSold: number; revenue: number }[];
  monthlySales: { month: string; sales: number }[];
}

export interface AdminProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  isActive?: boolean;
}

export interface StockUpdate {
  variantId: string;
  stock: number;
}

export interface ProductImagePayload {
  url: string;
  alt?: string;
  position?: number;
  isMain?: boolean;
}

export interface ProductVariantPayload {
  size: string;
  color: string;
  colorHex: string;
  price: number;
  compareAtPrice?: number;
  stock?: number;
  sku: string;
}

export interface ProductPayload {
  name: string;
  description: string;
  basePrice: number;
  compareAtPrice?: number;
  sku: string;
  categoryId: string;
  variants?: ProductVariantPayload[];
  images?: ProductImagePayload[];
  isFeatured?: boolean;
  isActive?: boolean;
}

export interface ArModelPayload {
  productId: string;
  variantId?: string;
  name: string;
  modelUrl?: string;
  thumbnailUrl?: string;
  format?: string;
  scale?: number;
  position?: Record<string, number>;
  rotation?: Record<string, number>;
  overlayImage?: string;
  overlayScale?: number;
  overlayOffsetY?: number;
  isActive?: boolean;
}

export interface SupplierCategoryLink {
  id: string;
  supplierId: string;
  categoryId: string;
  category: { id: string; name: string };
}

export interface Supplier {
  id: string;
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country: string;
  notes?: string | null;
  isActive: boolean;
  categories: SupplierCategoryLink[];
  _count?: { restockOrders: number };
  createdAt: string;
  updatedAt: string;
}

export interface ReorderAlertSupplier {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
}

export interface ReorderAlert {
  variantId: string;
  sku: string;
  size: string;
  color: string;
  currentStock: number;
  reorderPoint: number;
  productId: string;
  productName: string;
  categoryId: string;
  categoryName: string;
  suppliers: ReorderAlertSupplier[];
}

export interface RestockOrderItem {
  id: string;
  restockOrderId: string;
  variantId: string;
  quantity: number;
  variant?: ProductVariant & { product?: { id: string; name: string } };
}

export interface RestockOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplier?: Supplier;
  status: string;
  notes?: string | null;
  items: RestockOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SupplierPayload {
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  notes?: string;
  categoryIds?: string[];
}

export interface RestockOrderPayload {
  supplierId: string;
  notes?: string;
  items: { variantId: string; quantity: number }[];
}

export const adminApi = {
  getStats: () => api.get<DashboardStats>('/orders/stats'),

  getProducts: (params?: AdminProductFilters) =>
    api.get<PaginatedResponse<Product>>('/products', { params }),

  getProduct: (id: string) => api.get<Product>(`/products/${id}`),

  createProduct: (data: ProductPayload) =>
    api.post<Product>('/products', data),

  updateProduct: (id: string, data: ProductPayload) =>
    api.put<Product>(`/products/${id}`, data),

  deleteProduct: (id: string) => api.delete(`/products/${id}`),

  getArModels: (productId: string) => api.get<ArModel[]>(`/ar/models/admin/${productId}`),

  createArModel: (data: ArModelPayload) => api.post<ArModel>('/ar/models', data),

  updateArModel: (id: string, data: Partial<ArModelPayload>) => api.put<ArModel>(`/ar/models/${id}`, data),

  deleteArModel: (id: string) => api.delete(`/ar/models/${id}`),

  updateStock: (updates: StockUpdate[]) =>
    Promise.all(
      updates.map(({ variantId, stock }) =>
        api.put<ProductVariant>(`/products/variants/${variantId}`, { stock }),
      ),
    ).then(() => true),

  getOrders: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<PaginatedResponse<Order>>('/orders', { params }),

  getOrder: (id: string) => api.get<Order>(`/orders/${id}`),

  updateOrderStatus: (id: string, status: string) =>
    api.put<Order>(`/orders/${id}/status`, { status }),

  updatePaymentStatus: (id: string, paymentStatus: string) =>
    api.put<Order>(`/orders/${id}/payment`, { paymentStatus }),

  getCategories: (includeInactive = true) =>
    api.get<Category[]>('/categories/flat', { params: { includeInactive } }),

  createCategory: (data: { name: string; description?: string; parentId?: string; image?: string }) =>
    api.post<Category>('/categories', data),

  updateCategory: (id: string, data: { name?: string; description?: string; parentId?: string; image?: string }) =>
    api.put<Category>(`/categories/${id}`, data),

  deleteCategory: (id: string) => api.delete(`/categories/${id}`),

  getUsers: (params?: { page?: number; limit?: number; role?: string }) =>
    api.get<PaginatedResponse<User>>('/users', { params }),

  updateUser: (id: string, data: Partial<User>) =>
    api.put<User>(`/users/${id}`, data),

  toggleUserActive: (id: string, currentActive: boolean) =>
    api.put<User>(`/users/${id}`, { isActive: !currentActive }),

  suppliers: {
    getAll: () => api.get<Supplier[]>('/suppliers'),

    create: (data: SupplierPayload) =>
      api.post<Supplier>('/suppliers', data),

    update: (id: string, data: Partial<SupplierPayload>) =>
      api.put<Supplier>(`/suppliers/${id}`, data),

    remove: (id: string) => api.delete(`/suppliers/${id}`),
  },

  getReorderAlerts: () => api.get<ReorderAlert[]>('/suppliers/reorder-alerts'),

  getRestockOrders: () => api.get<RestockOrder[]>('/suppliers/restock-orders'),

  createRestockOrder: (data: RestockOrderPayload) =>
    api.post<RestockOrder>('/suppliers/restock-orders', data),

  updateRestockOrderStatus: (id: string, status: string) =>
    api.put<RestockOrder>(`/suppliers/restock-orders/${id}/status`, { status }),
};