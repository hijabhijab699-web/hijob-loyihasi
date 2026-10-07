/**
 * API client for the NestJS backend.
 * On the server we forward the httpOnly cookie; on the client we use fetch with credentials.
 */
import 'server-only';
import { cookies } from 'next/headers';

const API_BASE = process.env.API_URL ?? 'http://localhost:4000/api/v1';
const ACCESS_COOKIE = 'n2431.access';
const REFRESH_COOKIE = 'n2431.refresh';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  username: string;
  role: string;
  fullName: string | null;
}

class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (init.auth !== false) {
    const c = await cookies();
    const access = c.get(ACCESS_COOKIE)?.value;
    if (access) headers.set('Authorization', `Bearer ${access}`);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });

  const contentType = res.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const body = isJson ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    const message = typeof body === 'object' ? body.message || body.detail || res.statusText : res.statusText;
    throw new ApiError(res.status, typeof body === 'object' ? body.code || String(res.status) : String(res.status), message);
  }

  return body as T;
}

/* ─── auth ─── */

export async function login(identifier: string, password: string) {
  const data = await request<{ user: AuthUser; tokens: AuthTokens }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
    auth: false,
  });
  const c = await cookies();
  c.set(ACCESS_COOKIE, data.tokens.accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
  c.set(REFRESH_COOKIE, data.tokens.refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 90,
    path: '/',
  });
  return data.user;
}

export async function logout() {
  const c = await cookies();
  c.delete(ACCESS_COOKIE);
  c.delete(REFRESH_COOKIE);
}

export async function me(): Promise<AuthUser | null> {
  const c = await cookies();
  const token = c.get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  try {
    return await request<AuthUser>('/users/me', { method: 'GET' });
  } catch {
    return null;
  }
}

/* ─── seller ─── */

export interface SellerProduct {
  id: string;
  titleRu: string;
  titleUz: string | null;
  categoryId: string;
  basePriceUsd: number;
  coverUrl: string;
  status: 'draft' | 'pending' | 'published' | 'archived' | 'rejected';
  createdAt: string;
  publishedAt: string | null;
  popularityScore: number;
  variantCount: number;
  totalStock: number;
}

export async function listSellerProducts() {
  return request<SellerProduct[]>('/seller/products', { method: 'GET' });
}

export interface CreateProductInput {
  titleRu: string;
  titleUz?: string;
  descriptionRu?: string;
  categoryId: 'scarves' | 'dresses' | 'bags' | 'accessories';
  basePriceUsd: number;
  coverUrl: string;
  attributes?: Record<string, unknown>;
  variants: Array<{
    color: string;
    colorHex: string;
    size: string;
    priceUsd?: number;
    stock: number;
    sku: string;
    images?: string[];
  }>;
}

export async function createProduct(input: CreateProductInput) {
  return request<{ id: string }>('/seller/products', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function publishProduct(id: string) {
  return request<{ id: string; status: string }>(`/seller/products/${id}/submit`, {
    method: 'POST',
    body: '{}',
  });
}

/* ─── style jobs — "dress the mannequin" async queue ─── */

export type StyleJobStatus = 'pending' | 'running' | 'done' | 'failed';

export interface StyleJob {
  id: string;
  productId: string;
  status: StyleJobStatus;
  mannequinUrl: string;
  hijabUrl: string;
  tyingStyle: string;
  colorHex: string;
  resultUrl: string | null;
  errorMessage: string | null;
  attempts: number;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface DressMannequinInput {
  mannequinUrl: string;
  hijabUrl: string;
  tyingStyle?: 'classical' | 'loose' | 'double';
  colorHex?: string;
}

export async function submitDressMannequin(productId: string, input: DressMannequinInput) {
  return request<StyleJob>(`/seller/products/${productId}/dress-mannequin`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getLatestStyleJob(productId: string) {
  return request<StyleJob | null>(`/seller/products/${productId}/dress-mannequin`, {
    method: 'GET',
  });
}

/* ─── analytics ─── */

export interface SellerAnalytics {
  totals: {
    products: number;
    variants: number;
    stock: number;
    tryOnSessions: number;
    orderItems: number;
    orderUnits: number;
    grossUsd: number;
  };
  tryOnTrend7d: Array<{ day: string; count: number }>;
  topVariants: Array<{
    variantId: string;
    title: string;
    color: string;
    count: number;
  }>;
}

export async function getSellerAnalytics() {
  return request<SellerAnalytics>('/seller/analytics', { method: 'GET' });
}

/* ─── admin ─── */

export interface AdminDashboard {
  users: { total: number; buyers: number; sellers: number };
  sellers: { total: number; verified: number; pending: number };
  products: { total: number; published: number; pendingReview: number };
  orders: { total: number };
}

export interface AdminSeller {
  id: string;
  brandName: string;
  logoUrl: string | null;
  verified: boolean;
  city: string | null;
  rating: number;
  reviewsCount: number;
  productsCount: number;
  createdAt: string;
  user: {
    username: string;
    phone: string;
    fullName: string | null;
    active: boolean;
    createdAt: string;
  };
}

export interface AdminProduct {
  id: string;
  titleRu: string;
  titleUz: string | null;
  categoryId: 'scarves' | 'dresses' | 'bags' | 'accessories';
  status: 'draft' | 'pending' | 'published' | 'archived' | 'rejected';
  coverUrl: string;
  basePriceUsd: number;
  createdAt: string;
  publishedAt: string | null;
  seller: { brandName: string; verified: boolean };
  variantsCount: number;
}

export interface AdminUser {
  id: string;
  username: string;
  phone: string;
  fullName: string | null;
  role: 'buyer' | 'seller' | 'admin' | 'moderator';
  language: 'uz' | 'ru' | 'en';
  isActive: boolean;
  createdAt: string;
  lastSeenAt: string | null;
}

export interface AdminOrder {
  id: string;
  userUsername: string;
  userFullName: string | null;
  itemCount: number;
  totalUsd: number;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
}

export async function adminDashboard() {
  return request<AdminDashboard>('/admin/dashboard', { method: 'GET' });
}

export async function adminListSellers() {
  return request<AdminSeller[]>('/admin/sellers', { method: 'GET' });
}

export async function adminVerifySeller(id: string, verified: boolean) {
  return request<{ id: string; verified: boolean }>(`/admin/sellers/${id}/verify`, {
    method: 'PATCH',
    body: JSON.stringify({ verified }),
  });
}

export async function adminBanSeller(id: string, banned: boolean) {
  return request<{ id: string; isActive: boolean }>(`/admin/sellers/${id}/ban`, {
    method: 'PATCH',
    body: JSON.stringify({ banned }),
  });
}

export async function adminListProducts(status?: string) {
  const qs = status ? `?status=${status}` : '';
  return request<AdminProduct[]>(`/admin/products${qs}`, { method: 'GET' });
}

export async function adminSetProductStatus(id: string, status: AdminProduct['status']) {
  return request<AdminProduct>(`/admin/products/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function adminListUsers(role?: string) {
  const qs = role ? `?role=${role}` : '';
  return request<AdminUser[]>(`/admin/users${qs}`, { method: 'GET' });
}

export async function adminBanUser(id: string, banned: boolean) {
  return request<{ id: string; username: string; isActive: boolean }>(`/admin/users/${id}/ban`, {
    method: 'PATCH',
    body: JSON.stringify({ banned }),
  });
}

export async function adminListOrders() {
  return request<AdminOrder[]>('/admin/orders', { method: 'GET' });
}

export { ApiError, API_BASE };
