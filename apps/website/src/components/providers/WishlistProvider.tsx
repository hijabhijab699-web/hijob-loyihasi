'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const STORAGE_KEY = 'hijob.wishlist';

interface WishlistContextValue {
  ids: string[];
  isHydrated: boolean;
  has: (id: string) => boolean;
  toggle: (id: string) => boolean;
  add: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setIds(parsed.filter((n) => typeof n === 'string'));
      }
    } catch {
      /* ignore */
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      /* ignore */
    }
  }, [ids, isHydrated]);

  const has = useCallback((id: string) => ids.includes(id), [ids]);
  const add = useCallback(
    (id: string) =>
      setIds((prev) => (prev.includes(id) ? prev : [...prev, id])),
    [],
  );
  const remove = useCallback(
    (id: string) => setIds((prev) => prev.filter((x) => x !== id)),
    [],
  );
  const toggle = useCallback((id: string) => {
    let now = false;
    setIds((prev) => {
      if (prev.includes(id)) {
        now = false;
        return prev.filter((x) => x !== id);
      }
      now = true;
      return [...prev, id];
    });
    return now;
  }, []);
  const clear = useCallback(() => setIds([]), []);

  const value = useMemo<WishlistContextValue>(
    () => ({ ids, isHydrated, has, toggle, add, remove, clear }),
    [ids, isHydrated, has, toggle, add, remove, clear],
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
