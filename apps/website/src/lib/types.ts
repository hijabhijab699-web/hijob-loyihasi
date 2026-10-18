export type ProductBadge = 'new' | 'sale' | 'bestseller';

export type CategorySlug = 'scarves' | 'dresses' | 'bags' | 'accessories';

export interface ApiProductVariant {
  id: string;
  productId: string;
  color: string;
  colorHex: string;
  size: string;
  priceUsd: number;
  stock: number;
  images: string[];
  hasTryOn: boolean;
  renderedUrl?: string | null;
}

export interface ApiSeller {
  id?: string;
  brandName: string;
  logoUrl?: string | null;
  description?: string | null;
  rating?: string | number | null;
  reviewsCount?: number | null;
  verified?: boolean;
}

export interface ApiCategory {
  id: CategorySlug | string;
  nameUz: string;
  nameRu: string;
  nameEn: string;
  iconUrl?: string | null;
  coverUrl?: string | null;
  order?: number;
}

export interface Product {
  id: string;
  name: string;
  title?: { uz: string; ru: string; en: string };
  slug: string;
  description: string;
  price: number;
  priceUsd?: number;
  oldPrice?: number;
  discount?: number;
  rating: number;
  reviews: number;
  badge?: ProductBadge;
  image: string;
  gallery?: string[];
  category: string;
  colors: string[];
  sizes: string[];
  fabric: string;
  stock: number;
  featured?: boolean;
  createdAt: string;
  variants?: ApiProductVariant[];
  seller?: ApiSeller;
}

export interface Category {
  slug: string;
  name: string;
  image: string;
  description: string;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  color?: string;
  size?: string;
}

export interface WishlistItem {
  productId: string;
  addedAt: number;
}

export interface Order {
  id: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    city: string;
    note?: string;
  };
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'click' | 'payme';
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

export interface NewsletterEntry {
  email: string;
  subscribedAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  createdAt: string;
}

export interface Review {
  id: string;
  productId?: string;
  name: string;
  rating: number;
  text: string;
  createdAt: string;
}

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
  suggestions?: Product[];
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface ProductsListResponse {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
