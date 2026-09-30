import axios from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  'http://localhost:4000/api/v1';

const TOKEN_KEY = 'n2431.accessToken';
const REFRESH_KEY = 'n2431.refreshToken';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY).catch(() => null);
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
    const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
    if (!refreshToken) return null;

    const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
    await SecureStore.setItemAsync(TOKEN_KEY, data.tokens.accessToken);
    await SecureStore.setItemAsync(REFRESH_KEY, data.tokens.refreshToken);
    return data.tokens.accessToken;
  } catch {
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    await SecureStore.deleteItemAsync(REFRESH_KEY).catch(() => {});
    return null;
  }
}

export async function saveTokens(access: string, refresh: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, access);
  await SecureStore.setItemAsync(REFRESH_KEY, refresh);
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

export async function getStoredToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}
