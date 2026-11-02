'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export interface AuthUser {
  id: string;
  fullName: string;
  username: string;
  phone: string;
  role: 'buyer' | 'seller' | 'admin' | 'agent';
  language: 'uz' | 'ru' | 'en';
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthValue {
  user: AuthUser | null;
  tokens: Tokens | null;
  hydrated: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (dto: RegisterInput) => Promise<void>;
  logout: () => void;
}

export interface RegisterInput {
  fullName: string;
  username: string;
  phone: string;
  password: string;
  role: 'buyer' | 'seller';
}

const AUTH_KEY = 'hijob.auth.v1';

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { user: AuthUser; tokens: Tokens };
        if (parsed?.user && parsed?.tokens?.accessToken) {
          setUser(parsed.user);
          setTokens(parsed.tokens);
        }
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const persist = useCallback((u: AuthUser, t: Tokens) => {
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify({ user: u, tokens: t }));
    } catch {
      /* ignore */
    }
    setUser(u);
    setTokens(t);
  }, []);

  const login = useCallback(
    async (identifier: string, password: string) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message ?? 'LOGIN_FAILED');
      persist(body.user, body.tokens);
    },
    [persist],
  );

  const register = useCallback(
    async (dto: RegisterInput) => {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message ?? 'REGISTER_FAILED');
      persist(body.user, body.tokens);
    },
    [persist],
  );

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch {
      /* ignore */
    }
    setUser(null);
    setTokens(null);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({ user, tokens, hydrated, login, register, logout }),
    [user, tokens, hydrated, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
