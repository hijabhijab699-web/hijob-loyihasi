export type Language = 'uz' | 'ru' | 'en';

export type LocalizedString = Partial<Record<Language, string>> & { ru: string };

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D extends Point2D {
  z: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export type Result<T, E = ApiError> =
  | { ok: true; data: T }
  | { ok: false; error: E };
