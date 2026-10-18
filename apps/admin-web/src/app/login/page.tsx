import { redirect } from 'next/navigation';
import { login, me } from '@/lib/api';
import { ApiError } from '@/lib/api';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const current = await me();
  if (current && (current.role === 'admin' || current.role === 'moderator')) {
    redirect('/');
  }
  const sp = await searchParams;

  async function submit(formData: FormData) {
    'use server';
    const identifier = String(formData.get('identifier') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    if (!identifier || !password) {
      redirect('/login?error=missing');
    }
    try {
      const user = await login(identifier, password);
      if (user.role !== 'admin' && user.role !== 'moderator') {
        redirect('/login?error=forbidden');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        redirect(`/login?error=${encodeURIComponent(err.message)}`);
      }
      redirect('/login?error=unknown');
    }
    redirect('/');
  }

  const errorText =
    sp.error === 'missing'
      ? 'Login va parolni kiriting'
      : sp.error === 'forbidden'
      ? 'Admin huquqlari yo\'q'
      : sp.error === 'INVALID_CREDENTIALS' || sp.error === 'Unauthorized'
      ? 'Login yoki parol noto\'g\'ri'
      : sp.error
      ? decodeURIComponent(sp.error)
      : null;

  return (
    <div className="min-h-screen grid place-items-center bg-bg p-6">
      <div className="w-full max-w-sm bg-surface border border-rule rounded-2xl p-8 shadow-soft">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-ink grid place-items-center text-gold font-display font-bold">
            24
          </div>
          <div>
            <div className="font-display text-lg font-bold text-ink">N24:31</div>
            <div className="text-xs uppercase tracking-wider text-muted">Admin paneli</div>
          </div>
        </div>

        <form action={submit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
              Login (telefon yoki @username)
            </label>
            <input
              name="identifier"
              className="input"
              placeholder="+998XXXXXXXXX yoki @admin"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
              Parol
            </label>
            <input
              type="password"
              name="password"
              className="input"
              autoComplete="current-password"
            />
          </div>

          {errorText && (
            <div className="text-xs text-danger bg-danger/10 rounded-lg px-3 py-2">
              {errorText}
            </div>
          )}

          <button type="submit" className="btn-primary justify-center mt-2">
            Kirish
          </button>
        </form>

        <p className="text-xs text-muted mt-6">
          Faqat admin yoki moderator roli bo'lgan foydalanuvchilar kirishi mumkin.
        </p>
      </div>
    </div>
  );
}
