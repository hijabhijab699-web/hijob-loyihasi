import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

/**
 * TZ Phase 8 — buyers see every price in Uzbek som. The USD value stays in
 * the catalog payloads so the admin pipeline can keep internal reporting
 * consistent; the mobile client multiplies by the server-provided rate on
 * display.
 *
 * The rate is cached for 10 minutes — plenty of latency headroom; admin
 * changes propagate on the next cold screen open.
 */
export function useUzsRate(): number {
  const { data } = useQuery<{ usdToUzsRate: number }>({
    queryKey: ['settings-rate'],
    queryFn: async () => (await api.get<{ usdToUzsRate: number }>('/settings/rate')).data,
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
  return data?.usdToUzsRate ?? 12500;
}

/** Round to the nearest 100 so the UI never shows odd kopiyka tails. */
export function usdToUzs(usd: number, rate: number): number {
  const raw = usd * rate;
  return Math.round(raw / 100) * 100;
}

/** "250 000 so'm" / "250 000 so'm" (same text, UZ+RU; keeps Latin numerals). */
export function formatUzs(uzs: number): string {
  const grouped = uzs.toLocaleString('ru-RU').replace(/,/g, ' ');
  return `${grouped} so'm`;
}

/** "250 000 so'm" from a USD value. */
export function formatUsdAsUzs(usd: number, rate: number): string {
  return formatUzs(usdToUzs(usd, rate));
}
