'use client';

/**
 * Polls the Dev AI page every N seconds via router.refresh() so the status
 * cards (base mannequins, job list) reflect the extension's progress without
 * the admin having to reload manually.
 *
 * router.refresh() hits only the server component for the current route and
 * swaps the fresh HTML in place — no scroll jump, no visible reload.
 */
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Pause, Play } from 'lucide-react';

const DEFAULT_INTERVAL_MS = 4000;

export function AutoRefresh({ intervalMs = DEFAULT_INTERVAL_MS }: { intervalMs?: number }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(true);
  const [lastTick, setLastTick] = useState<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }
    timerRef.current = setInterval(() => {
      // Skip when the tab is hidden — nothing to see, saves CPU and server
      // round trips.
      if (document.visibilityState !== 'visible') return;
      router.refresh();
      setLastTick(Date.now());
    }, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [enabled, intervalMs, router]);

  // Manual refresh click.
  const refreshNow = () => {
    router.refresh();
    setLastTick(Date.now());
  };

  const secondsAgo = Math.max(0, Math.round((Date.now() - lastTick) / 1000));

  return (
    <div className="flex items-center gap-2 text-xs text-muted">
      <button
        onClick={refreshNow}
        className="inline-flex items-center gap-1 px-2 py-1 rounded border border-rule hover:bg-surface2 text-ink"
        title="Hoziroq yangilash"
      >
        <RefreshCw size={11} /> Yangilash
      </button>
      <button
        onClick={() => setEnabled((v) => !v)}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded border ${
          enabled ? 'border-success/40 text-success bg-success/5' : 'border-rule text-muted'
        }`}
        title={enabled ? 'Avto-yangilashni to\'xtatish' : 'Avto-yangilashni yoqish'}
      >
        {enabled ? <Pause size={11} /> : <Play size={11} />}
        {enabled ? `Jonli · ${intervalMs / 1000}s` : 'Pauza'}
      </button>
      <span className="font-mono text-[10px] opacity-60" suppressHydrationWarning>
        {secondsAgo}s oldin
      </span>
    </div>
  );
}
