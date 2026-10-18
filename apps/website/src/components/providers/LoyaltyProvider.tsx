'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const KEY = 'hijob.loyalty';
export const LOYALTY_PERCENT = 2;
export const MAX_REDEEM_PERCENT = 20;

interface LoyaltyState {
  balance: number;
  earned: number;
  spent: number;
}

const EMPTY: LoyaltyState = { balance: 0, earned: 0, spent: 0 };

interface LoyaltyContextValue extends LoyaltyState {
  isHydrated: boolean;
  earn: (orderTotal: number) => number;
  redeem: (points: number) => void;
  maxRedeemable: (subtotal: number) => number;
  reset: () => void;
}

const LoyaltyContext = createContext<LoyaltyContextValue | null>(null);

export function LoyaltyProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LoyaltyState>(EMPTY);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          setState({
            balance: Number(parsed.balance) || 0,
            earned: Number(parsed.earned) || 0,
            spent: Number(parsed.spent) || 0,
          });
        }
      }
    } catch {
      /* ignore */
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, isHydrated]);

  const earn = useCallback((orderTotal: number) => {
    const points = Math.max(0, Math.floor((orderTotal * LOYALTY_PERCENT) / 100));
    setState((prev) => ({
      ...prev,
      balance: prev.balance + points,
      earned: prev.earned + points,
    }));
    return points;
  }, []);

  const redeem = useCallback((points: number) => {
    const p = Math.max(0, Math.floor(points));
    setState((prev) => ({
      ...prev,
      balance: Math.max(0, prev.balance - p),
      spent: prev.spent + Math.min(p, prev.balance),
    }));
  }, []);

  const maxRedeemable = useCallback(
    (subtotal: number) => {
      const cap = Math.floor((subtotal * MAX_REDEEM_PERCENT) / 100);
      return Math.min(state.balance, cap);
    },
    [state.balance],
  );

  const reset = useCallback(() => setState(EMPTY), []);

  const value = useMemo<LoyaltyContextValue>(
    () => ({ ...state, isHydrated, earn, redeem, maxRedeemable, reset }),
    [state, isHydrated, earn, redeem, maxRedeemable, reset],
  );

  return <LoyaltyContext.Provider value={value}>{children}</LoyaltyContext.Provider>;
}

export function useLoyalty() {
  const ctx = useContext(LoyaltyContext);
  if (!ctx) throw new Error('useLoyalty must be used within LoyaltyProvider');
  return ctx;
}
