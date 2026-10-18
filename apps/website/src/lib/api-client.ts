import type {
  ApiResponse,
  Product,
  ProductsListResponse,
  Review,
} from './types';

async function request<T>(
  url: string,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      cache: 'no-store',
    });
    const json = (await res.json()) as ApiResponse<T>;
    if (!res.ok) {
      return { ok: false, error: json.error ?? `HTTP ${res.status}` };
    }
    return json;
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Tarmoq xatosi",
    };
  }
}

export function fetchProducts(params: Record<string, string | number | undefined> = {}) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== '') sp.set(k, String(v));
  }
  return request<ProductsListResponse>(`/api/products?${sp.toString()}`);
}

export function fetchProduct(id: string) {
  return request<{ product: Product; reviews: Review[]; related: Product[] }>(
    `/api/products/${id}`,
  );
}

export function searchProducts(q: string) {
  return request<{ items: Product[]; total: number }>(
    `/api/search?q=${encodeURIComponent(q)}`,
  );
}

export function subscribeNewsletter(email: string) {
  return request<{ alreadySubscribed: boolean; message: string }>(
    '/api/newsletter',
    {
      method: 'POST',
      body: JSON.stringify({ email }),
    },
  );
}

export function sendContact(payload: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}) {
  return request<{ message: string }>('/api/contact', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function createOrder(payload: {
  customer: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    city: string;
    note?: string;
  };
  items: {
    id?: string;
    productId: string;
    variantId?: string;
    quantity: number;
    color?: string;
    size?: string;
  }[];
  paymentMethod: 'cash' | 'card' | 'click' | 'payme';
}) {
  return request<import('./types').Order>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function sendAiMessage(message: string) {
  return request<{ reply: string; suggestions: Product[] }>('/api/ai-chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

export function fetchAiWelcome() {
  return request<{ welcome: string; quickQuestions: string[] }>(
    '/api/ai-chat',
  );
}

export function submitReview(payload: {
  productId?: string;
  name: string;
  rating: number;
  text: string;
}) {
  return request<Review>('/api/reviews', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function checkPromo(code: string, subtotal: number) {
  return request<{
    code: string;
    discount: number;
    freeShipping: boolean;
    description: string;
  }>('/api/promo', {
    method: 'POST',
    body: JSON.stringify({ code, subtotal }),
  });
}

export function fetchOrder(id: string) {
  return request<import('./types').Order>(`/api/orders/${id}`);
}

export function adminLogin(password: string) {
  return request<{ authed: boolean }>('/api/admin', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

export function adminLogout() {
  return request<unknown>('/api/admin', { method: 'DELETE' });
}

export function adminData() {
  return request<{
    stats: {
      orders: number;
      subscribers: number;
      messages: number;
      revenue: number;
    };
    orders: import('./types').Order[];
    newsletter: import('./types').NewsletterEntry[];
    contacts: import('./types').ContactMessage[];
  }>('/api/admin');
}
