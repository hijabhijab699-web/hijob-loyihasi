'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { CartItem, Product } from '@/lib/types';

const STORAGE_KEY = 'hijob.cart';
const SHIPPING_FEE = 25000;
const FREE_SHIPPING_FROM = 500000;

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  shipping: number;
  total: number;
  isHydrated: boolean;
  addItem: (
    product: Pick<Product, 'id' | 'name' | 'price' | 'image'>,
    opts?: { quantity?: number; color?: string; size?: string },
  ) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function lineKey(productId: string, color?: string, size?: string) {
  return `p${productId}:${color ?? '-'}:${size ?? '-'}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      /* ignore */
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, isHydrated]);

  const addItem = useCallback<CartContextValue['addItem']>(
    (product, opts) => {
      const qty = Math.max(1, Math.floor(opts?.quantity ?? 1));
      const color = opts?.color;
      const size = opts?.size;
      const key = lineKey(product.id, color, size);
      setItems((prev) => {
        const existing = prev.find(
          (it) => lineKey(it.productId, it.color, it.size) === key,
        );
        if (existing) {
          return prev.map((it) =>
            it === existing ? { ...it, quantity: it.quantity + qty } : it,
          );
        }
        return [
          ...prev,
          {
            id: `${key}:${Date.now().toString(36)}`,
            productId: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: qty,
            color,
            size,
          },
        ];
      });
    },
    [],
  );

  const removeItem = useCallback((lineId: string) => {
    setItems((prev) => prev.filter((it) => it.id !== lineId));
  }, []);

  const updateQuantity = useCallback((lineId: string, quantity: number) => {
    const q = Math.max(1, Math.min(50, Math.floor(quantity)));
    setItems((prev) =>
      prev.map((it) => (it.id === lineId ? { ...it, quantity: q } : it)),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
    const count = items.reduce((s, it) => s + it.quantity, 0);
    const shipping = subtotal >= FREE_SHIPPING_FROM || subtotal === 0 ? 0 : SHIPPING_FEE;
    const total = subtotal + shipping;
    return {
      items,
      count,
      subtotal,
      shipping,
      total,
      isHydrated,
      addItem,
      removeItem,
      updateQuantity,
      clear,
    };
  }, [items, isHydrated, addItem, removeItem, updateQuantity, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
