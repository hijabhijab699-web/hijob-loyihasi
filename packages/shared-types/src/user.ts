import type { Language } from './common';

export type UserRole = 'buyer' | 'seller' | 'admin' | 'moderator';

export type ClothingSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';

export interface User {
  id: string;
  username: string;
  phone: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  language: Language;
  createdAt: string;
  onboarding: OnboardingState;
}

export interface OnboardingState {
  faceCaptured: boolean;
  bodyProvided: boolean;
  completedAt: string | null;
}

export interface BodyParams {
  heightCm: number;
  weightKg: number;
  age: number;
  preferredSize: ClothingSize;
}

export interface FaceTemplateStatus {
  status: 'none' | 'processing' | 'ready' | 'failed';
  templateId?: string;
  error?: string;
  createdAt?: string;
  expiresAt?: string;
}

/* ---------------- DTOs ---------------- */

export interface RegisterRequest {
  fullName: string;
  username: string;
  phone: string;
  password: string;
  role: 'buyer' | 'seller';
  language?: Language;
}

export interface LoginRequest {
  identifier: string; // phone or @username
  password: string;
}

export interface VerifyOtpRequest {
  phone: string;
  code: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}
