import type { TyingStyle } from './catalog';

export interface TryOnRequest {
  variantId: string;
  tyingStyle?: TyingStyle;
  lightingPreset?: 'studio' | 'warm' | 'cool';
}

export interface TryOnResult {
  sessionId: string;
  resultUrl: string;
  cacheKey: string;
  latencyMs: number;
  expiresAt: string;
}

export interface TryOnHistoryItem {
  sessionId: string;
  variantId: string;
  productTitle: string;
  productImage: string;
  tyingStyle?: TyingStyle;
  resultUrl: string;
  addedToCart: boolean;
  createdAt: string;
}
