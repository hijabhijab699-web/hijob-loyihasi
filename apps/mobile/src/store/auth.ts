import { create } from 'zustand';
import type { User } from '@n2431/shared-types';
import { api, saveTokens, clearTokens, getStoredToken } from '../api/client';
import { useTryonOnboarding } from './tryon-onboarding';
import { clearLocalFace } from '../lib/face-local-cache';

/**
 * Primerka onboarding (height, body type, selfie, store, cropped face PNG)
 * is cached on-device under one AsyncStorage key. If we don't wipe it on
 * logout/login, a second account on the same phone picks up the previous
 * user's avatar and store choice. This resets both the store and the local
 * selfie file so the next account starts with a clean onboarding.
 */
async function resetTryonProfile() {
  try {
    await useTryonOnboarding.getState().reset();
  } catch {
    // best-effort — store may not be hydrated yet
  }
  try {
    await clearLocalFace();
  } catch {
    // ignore
  }
}

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
    // Wipe any Primerka onboarding left over from a previous account on
    // this device BEFORE we flip isAuthed, so the first screen the new
    // user sees is the onboarding gate, not someone else's avatar.
    await resetTryonProfile();
    await saveTokens(tokens.accessToken, tokens.refreshToken);
    set({ user, isAuthed: true, isLoading: false });
  },

  async logout() {
    await clearTokens();
    await resetTryonProfile();
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
