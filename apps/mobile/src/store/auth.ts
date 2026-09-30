import { create } from 'zustand';
import type { User } from '@n2431/shared-types';
import { api, saveTokens, clearTokens, getStoredToken } from '../api/client';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthed: boolean;
  hydrate: () => Promise<void>;
  loginSuccess: (user: User, tokens: { accessToken: string; refreshToken: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthed: false,

  async hydrate() {
    const token = await getStoredToken();
    if (!token) {
      set({ isLoading: false, isAuthed: false });
      return;
    }
    try {
      const { data } = await api.get<User>('/users/me');
      set({ user: data, isAuthed: true, isLoading: false });
    } catch {
      await clearTokens();
      set({ user: null, isAuthed: false, isLoading: false });
    }
  },

  async loginSuccess(user, tokens) {
    await saveTokens(tokens.accessToken, tokens.refreshToken);
    set({ user, isAuthed: true, isLoading: false });
  },

  async logout() {
    await clearTokens();
    set({ user: null, isAuthed: false });
  },

  async refreshMe() {
    try {
      const { data } = await api.get<User>('/users/me');
      set({ user: data });
    } catch {
      get().logout();
    }
  },
}));
