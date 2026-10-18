'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  kind: ToastKind;
  text: string;
}

interface ToastContextValue {
  show: (text: string, kind?: ToastKind) => void;
  success: (text: string) => void;
  error: (text: string) => void;
  info: (text: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback<ToastContextValue['show']>(
    (text, kind = 'info') => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, kind, text }]);
      setTimeout(() => dismiss(id), 3500);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (t) => show(t, 'success'),
      error: (t) => show(t, 'error'),
      info: (t) => show(t, 'info'),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-[calc(100vw-2rem)]"
        role="region"
        aria-label="Bildirishnomalar"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-start gap-3 bg-white border border-rule rounded-xl shadow-lg px-4 py-3 min-w-[260px] animate-fade-in-up"
          >
            {t.kind === 'success' && (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            )}
            {t.kind === 'error' && (
              <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            )}
            {t.kind === 'info' && (
              <Info className="w-5 h-5 text-brand shrink-0 mt-0.5" />
            )}
            <p className="text-sm text-ink flex-1">{t.text}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="text-ink-muted hover:text-ink"
              aria-label="Yopish"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
