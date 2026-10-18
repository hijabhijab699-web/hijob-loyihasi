'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const KEY = 'hijob.recent';
const MAX = 8;

interface RecentContextValue {
  ids: string[];
  isHydrated: boolean;
  add: (id: string) => void;
  clear: () => void;
}

const RecentContext = createContext<RecentContextValue | null>(null);

export function RecentProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed))
          setIds(parsed.filter((n) => typeof n === 'string').slice(0, MAX));
      }
    } catch {
      /* ignore */
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(ids));
    } catch {
      /* ignore */
    }
  }, [ids, isHydrated]);

  const add = useCallback((id: string) => {
    setIds((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, MAX));
  }, []);

  const clear = useCallback(() => setIds([]), []);

  const value = useMemo(
    () => ({ ids, isHydrated, add, clear }),
    [ids, isHydrated, add, clear],
  );

  return <RecentContext.Provider value={value}>{children}</RecentContext.Provider>;
}

export function useRecent() {
  const ctx = useContext(RecentContext);
  if (!ctx) throw new Error('useRecent must be used within RecentProvider');
  return ctx;
}
