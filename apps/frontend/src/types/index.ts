export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: 'CUSTOMER' | 'ADMIN' | 'MANAGER';
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  addresses?: Address[];
  measurements?: BodyMeasurement;
}

export interface Address {
  id: string;
  type: 'HOME' | 'WORK' | 'OTHER';
  firstName: string;
  lastName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface BodyMeasurement {
  id: string;
  height?: number;
  weight?: number;
  bust?: number;
  waist?: number;
  hips?: number;
  shoulder?: number;
  sleeve?: number;
  inseam?: number;
  neck?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  children?: Category[];
  _count?: { products: number };
}

export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  colorHex: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  weight?: number;
  isActive: boolean;
  images: ProductImage[];
}

export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  position: number;
  isMain: boolean;
}

export interface ArModel {
  id: string;
  name: string;
  modelUrl: string;
  thumbnailUrl?: string;
  format: 'GLTF' | 'GLB' | 'USDZ' | 'OBJ';
  scale: number;
  position?: Record<string, number>;
  rotation?: Record<string, number>;
  productId?: string;
  variantId?: string;
  overlayImage?: string;
  overlayScale?: number;
  overlayOffsetY?: number;
  isActive?: boolean;
}

export interface SizeRecommendation {
  recommendedSize: string | null;
  sizeChart: Record<string, { label: string; range: string }>;
  hasMeasurements: boolean;
  availableSizes: string[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  compareAtPrice?: number;
  sku: string;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: string;
  category: Category;
  variants: ProductVariant[];
  images: ProductImage[];
  arModels: ArModel[];
  _count?: { reviews: number };
}

export interface CartItem {
  id: string;
  quantity: number;
  product: Product;
  variant: ProductVariant;
}

export interface Cart {
  id: string;
  items: CartItem[];
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: 'qr' | 'cash';
  receiptUrl?: string | null;
  stockReleased?: boolean;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;
  shippingAddress: Address;
  billingAddress: Address;
  notes?: string;
  items: OrderItem[];
  payments: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  total: number;
  product: Product;
  variant: ProductVariant;
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  createdAt: string;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIAL_REFUND';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  colors?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isFeatured?: boolean;
}

export interface ArSession {
  id: string;
  productId: string;
  variantId?: string;
  arModelId: string;
  duration?: number;
  screenshotUrl?: string;
  rating?: number;
  feedback?: string;
  createdAt: string;
  arModel: ArModel;
  product: Product;
  variant?: ProductVariant;
}

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