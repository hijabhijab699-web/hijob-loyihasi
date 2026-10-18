/**
 * Admin-only API client. Mirrors the shape of the seller-web client but
 * exposes only the /admin/* endpoints the console needs. Auth uses the same
 * JWT cookie pair the seller-web uses, so a single admin account works
 * across both consoles — the backend's RolesGuard still refuses non-admin
 * tokens on these routes.
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

export class ApiError extends Error {
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
  const body: any = isJson ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    const message = typeof body === 'object' ? body?.message || body?.detail || res.statusText : res.statusText;
    throw new ApiError(res.status, typeof body === 'object' ? body?.code || String(res.status) : String(res.status), message);
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
  try {
    return await request<AuthUser>('/users/me');
  } catch {
    return null;
  }
}

/* ─── admin dashboard ─── */

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
  user: { username: string; phone: string; fullName: string | null; active: boolean; createdAt: string };
}

export interface AdminProduct {
  id: string;
  titleRu: string;
  titleUz: string | null;
  categoryId: string;
  status: 'draft' | 'pending' | 'published' | 'archived' | 'rejected';
  coverUrl: string | null;
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
  language: string;
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
  return request<AdminDashboard>('/admin/dashboard');
}

export async function adminListSellers() {
  return request<AdminSeller[]>('/admin/sellers');
}

export async function adminVerifySeller(id: string, verified: boolean) {
  return request<AdminSeller>(`/admin/sellers/${id}/verify`, {
    method: 'PATCH',
    body: JSON.stringify({ verified }),
  });
}

export async function adminBanSeller(id: string, banned: boolean) {
  return request<AdminSeller>(`/admin/sellers/${id}/ban`, {
    method: 'PATCH',
    body: JSON.stringify({ banned }),
  });
}

export async function adminListProducts(status?: string) {
  const query = status ? `?status=${status}` : '';
  return request<AdminProduct[]>(`/admin/products${query}`);
}

export async function adminSetProductStatus(id: string, status: AdminProduct['status']) {
  return request<AdminProduct>(`/admin/products/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function adminListUsers(role?: string) {
  const query = role ? `?role=${role}` : '';
  return request<AdminUser[]>(`/admin/users${query}`);
}

export async function adminBanUser(id: string, banned: boolean) {
  return request<AdminUser>(`/admin/users/${id}/ban`, {
    method: 'PATCH',
    body: JSON.stringify({ banned }),
  });
}

export async function adminListOrders() {
  return request<AdminOrder[]>('/admin/orders');
}

/* ─── style jobs (developer AI panel) ─── */

export type StyleJobStatus = 'pending' | 'running' | 'done' | 'failed';

export interface StyleJob {
  id: string;
  productId: string;
  sellerId: string;
  status: StyleJobStatus;
  mannequinUrl: string;
  hijabUrl: string;
  tyingStyle: string;
  colorHex: string;
  targetSize: string | null;
  resultUrl: string | null;
  errorMessage: string | null;
  attempts: number;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  product?: { titleRu: string };
  seller?: { brandName: string };
}

/* ─── mannequin templates ─── */

export interface MannequinTemplate {
  id: string | null;
  sizeKey: string;
  label: string;
  minHeightCm: number;
  maxHeightCm: number;
  imageUrl: string | null;
  active: boolean;
  sortOrder: number;
  uploaded: boolean;
}

export async function adminListMannequins() {
  return request<MannequinTemplate[]>('/admin/mannequin-templates');
}

export async function adminListStyleJobs(status?: StyleJobStatus) {
  const query = status ? `?status=${status}` : '';
  return request<StyleJob[]>(`/admin/style-jobs${query}`);
}

export async function adminAiComplete(id: string, resultUrl: string) {
  return request<StyleJob>(`/admin/style-jobs/${id}/ai-complete`, {
    method: 'PATCH',
    body: JSON.stringify({ resultUrl }),
  });
}

export async function adminAiFail(id: string, message: string) {
  return request<StyleJob>(`/admin/style-jobs/${id}/ai-fail`, {
    method: 'PATCH',
    body: JSON.stringify({ message }),
  });
}
