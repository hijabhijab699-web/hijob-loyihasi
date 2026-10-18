'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { subscribeNewsletter } from '@/lib/api-client';
import { useToast } from '@/components/providers/ToastProvider';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true);
    const res = await subscribeNewsletter(email.trim());
    setLoading(false);
    if (res.ok && res.data) {
      toast.success(res.data.message);
      setEmail('');
    } else {
      toast.error(res.error ?? "Xatolik yuz berdi");
    }
  };

  return (
    <form onSubmit={submit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Elektron pochtangiz"
        className="flex-1 px-5 py-3 rounded-xl border border-rule bg-white text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="btn-primary whitespace-nowrap flex items-center justify-center gap-2 disabled:opacity-70"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        Obuna bo&apos;lish
      </button>
    </form>
  );
}
