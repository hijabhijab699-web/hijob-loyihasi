import axios from 'axios';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  'http://localhost:4000/api/v1';

const TOKEN_KEY = 'n2431.accessToken';
const REFRESH_KEY = 'n2431.refreshToken';

// Thin SecureStore-shaped wrapper over AsyncStorage. ExpoSecureStore's
// native code throws NSExceptions on some Release-build device profiles
// (seen on iPhone 11 / iOS 26 — crashes Hermes via the TurboModule
// conversion path), so we keep JWTs in AsyncStorage instead. These tokens
// are short-lived JWTs; losing them to a factory-reset is acceptable.
const Store = {
  async getItemAsync(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async setItemAsync(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      // storage full / disk error — swallow so the auth flow finishes.
    }
  },
  async deleteItemAsync(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
  // localtunnel shows an anti-abuse HTML page on first request from a new IP.
  // This header opts us out so the tunnel forwards straight to the backend.
  headers: { 'bypass-tunnel-reminder': 'true' },
});

api.interceptors.request.use(async (config) => {
  const token = await Store.getItemAsync(TOKEN_KEY).catch(() => null);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const newToken = await (refreshPromise ??= refreshTokens().finally(() => {
        refreshPromise = null;
      }));
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  },
);

async function refreshTokens(): Promise<string | null> {
  try {
    const refreshToken = await Store.getItemAsync(REFRESH_KEY);
    if (!refreshToken) return null;

    const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
    await Store.setItemAsync(TOKEN_KEY, data.tokens.accessToken);
    await Store.setItemAsync(REFRESH_KEY, data.tokens.refreshToken);
    return data.tokens.accessToken;
  } catch {
    await Store.deleteItemAsync(TOKEN_KEY).catch(() => {});
    await Store.deleteItemAsync(REFRESH_KEY).catch(() => {});
    return null;
  }
}

export async function saveTokens(access: string, refresh: string) {
  await Store.setItemAsync(TOKEN_KEY, access);
  await Store.setItemAsync(REFRESH_KEY, refresh);
}

export async function clearTokens() {
  await Store.deleteItemAsync(TOKEN_KEY);
  await Store.deleteItemAsync(REFRESH_KEY);
}

export async function getStoredToken() {
  return Store.getItemAsync(TOKEN_KEY);
}
