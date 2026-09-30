import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { theme, type ColorScheme } from '@n2431/design-tokens';

interface ThemeContextValue {
  colors: ColorScheme;
  theme: typeof theme;
  scheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme() ?? 'light';

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: scheme === 'dark' ? theme.colors.dark : theme.colors.light,
      theme,
      scheme,
    }),
    [scheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
