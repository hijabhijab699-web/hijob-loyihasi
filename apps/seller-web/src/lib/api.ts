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

export { ApiError, API_BASE };
