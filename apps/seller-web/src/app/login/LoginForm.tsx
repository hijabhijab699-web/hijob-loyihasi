'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { AtSign, Lock, ArrowRight } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-gold w-full">
      {pending ? 'Yuborilmoqda…' : 'Kirish'}
      <ArrowRight size={18} />
    </button>
  );
}

export function LoginForm({ action }: { action: (fd: FormData) => Promise<{ error?: string } | void> }) {
  const [error, setError] = useState<string | null>(null);

  async function submit(fd: FormData) {
    setError(null);
    const result = await action(fd);
    if (result?.error) setError(result.error);
  }

  return (
    <form action={submit} className="space-y-4">
      <div className="relative">
        <AtSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          name="identifier"
          type="text"
          required
          placeholder="Telefon yoki @username"
          className="input pl-11"
          autoComplete="username"
          defaultValue="@noor"
        />
      </div>

      <div className="relative">
        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          name="password"
          type="password"
          required
          placeholder="Parol"
          className="input pl-11"
          autoComplete="current-password"
          defaultValue="seller1234"
        />
      </div>

      {error && (
        <div className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-4 py-3">
          {error === 'SELLERS_ONLY'
            ? "Bu panel faqat sotuvchilar uchun. Xaridor bo'lsangiz mobil ilovadan foydalaning."
            : error}
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
