import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme, type ColorScheme } from '@n2431/design-tokens';

type ThemePref = 'light' | 'dark' | 'system';
const STORAGE_KEY = 'n2431.theme';

interface ThemeContextValue {
  colors: ColorScheme;
  theme: typeof theme;
  scheme: 'light' | 'dark';
  preference: ThemePref;
  setPreference: (pref: ThemePref) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme() ?? 'light';
  const [preference, setPreferenceState] = useState<ThemePref>('system');

  // Hydrate the user's saved choice at launch so cold start matches whatever
  // they picked last — avoids a one-frame flash of system scheme.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === 'light' || v === 'dark' || v === 'system') {
          setPreferenceState(v);
        }
      })
      .catch(() => {});
  }, []);

  const scheme: 'light' | 'dark' =
    preference === 'system' ? systemScheme : preference;

  const setPreference = async (pref: ThemePref) => {
    setPreferenceState(pref);
    try { await AsyncStorage.setItem(STORAGE_KEY, pref); } catch {}
  };

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: scheme === 'dark' ? theme.colors.dark : theme.colors.light,
      theme,
      scheme,
      preference,
      setPreference,
    }),
    [scheme, preference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
