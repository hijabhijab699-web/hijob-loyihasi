// Stub: products now come from NestJS (`services/api`).
// Kept only for the legacy ai-chat suggestions which still use a small
// in-memory list until the AI section is replaced by Try-On.
import type { Product } from './types';

export const PRODUCTS: Product[] = [];

export function getProductById(_id: string | number): Product | undefined {
  return undefined;
}

export type SortKey =
  | 'popular'
  | 'price-asc'
  | 'price-desc'
  | 'newest'
  | 'rating';

export interface ProductQuery {
  category?: string;
  colors?: string[];
  fabrics?: string[];
  sizes?: string[];
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sort?: SortKey;
  page?: number;
  pageSize?: number;
  ids?: (string | number)[];
}
