import type { LocalizedString, Paginated } from './common';

export type CategoryId = 'scarves' | 'dresses' | 'shoes' | 'bags' | 'accessories';

export type ScarfModel =
  | 'classical'
  | 'withCap'
  | 'withUnder'
  | 'long'
  | 'short'
  | 'cape'
  | 'turban';

export type DressCut =
  | 'classical'
  | 'loose'
  | 'belted'
  | 'buttons'
  | 'aLine'
  | 'straight'
  | 'ruffled'
  | 'abaya';

export type TyingStyle = 'classical' | 'loose' | 'double';

export interface Category {
  id: CategoryId;
  name: LocalizedString;
  iconUrl: string;
  coverUrl: string;
}

export interface Seller {
  id: string;
  brandName: string;
  logoUrl: string;
  description?: string;
  rating: number;
  reviewsCount: number;
  verified: boolean;
}

export interface Product {
  id: string;
  sellerId: string;
  seller: Pick<Seller, 'brandName' | 'logoUrl' | 'rating' | 'reviewsCount'>;
  categoryId: CategoryId;
  title: LocalizedString;
  description?: LocalizedString;
  basePriceUsd: number;
  variants: ProductVariant[];
  attributes: ProductAttributes;
  coverUrl: string;
  gallery: string[];
  createdAt: string;
  popularityScore?: number;
}

export interface ProductVariant {
  id: string;
  productId: string;
  color: string;
  colorHex: string;
  size: string;
  priceUsd: number;
  stock: number;
  images: string[];
  hasTryOn: boolean;
}

export interface ProductAttributes {
  fabric?: string;
  scarfModel?: ScarfModel;
  dressCut?: DressCut;
  length?: 'ankle' | 'midi' | 'maxi';
  sleeve?: 'long' | 'threeQuarter' | 'sleeveless';
  size?: string[];
}

export interface CatalogFilters {
  category?: CategoryId;
  sellerId?: string;
  colors?: string[];
  sizes?: string[];
  scarfModel?: ScarfModel;
  dressCut?: DressCut;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'popularity' | 'priceLow' | 'priceHigh' | 'new';
  page?: number;
  pageSize?: number;
}

export type ProductList = Paginated<Product>;

export interface HomeFeed {
  stores: Seller[];
  categories: Category[];
  newArrivals: Product[];
}
