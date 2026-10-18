'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const KEY = 'hijob.orders';
const MAX = 20;

interface Entry {
  id: string;
  total: number;
  createdAt: string;
}

interface OrdersContextValue {
  orders: Entry[];
  isHydrated: boolean;
  push: (entry: Entry) => void;
}

const OrdersContext = createContext<OrdersContextValue | null>(null);

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Entry[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setOrders(parsed);
      }
    } catch {
      /* ignore */
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(orders));
    } catch {
      /* ignore */
    }
  }, [orders, isHydrated]);

  const push = useCallback((entry: Entry) => {
    setOrders((prev) =>
      [entry, ...prev.filter((o) => o.id !== entry.id)].slice(0, MAX),
    );
  }, []);

  const value = useMemo(
    () => ({ orders, isHydrated, push }),
    [orders, isHydrated, push],
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used within OrdersProvider');
  return ctx;
}
