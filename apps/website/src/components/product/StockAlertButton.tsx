'use client';

import { useState } from 'react';
import { Bell, Loader2, X } from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';

interface Props {
  productId: string;
  productName: string;
}

export function StockAlertButton({ productId, productName }: Props) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/stock-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, email: email.trim() }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        toast.success(json.data.message);
        setEmail('');
        setOpen(false);
      } else {
        toast.error(json.error ?? 'Xatolik');
      }
    } catch {
      toast.error('Tarmoq xatosi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-outline w-full flex items-center justify-center gap-2"
      >
        <Bell className="w-4 h-4" />
        Qaytganda xabar bering
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          role="dialog"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-bg-warm text-ink-muted hover:text-ink flex items-center justify-center"
              aria-label="Yopish"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-12 h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center mx-auto">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-semibold text-ink text-center mt-4">
              Qaytganda xabar
            </h3>
            <p className="text-sm text-ink-muted text-center mt-1">
              &ldquo;{productName}&rdquo; qaytib kelganda emailingizga xabar
              yuboramiz.
            </p>
            <form onSubmit={submit} className="mt-5 space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="email@example.com"
                className="w-full border border-rule rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Yozilish
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
