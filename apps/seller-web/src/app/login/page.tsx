import { redirect } from 'next/navigation';
import { login, me } from '@/lib/api';
import { LoginForm } from './LoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const user = await me();
  if (user) redirect((params.next as `/${string}`) || '/');

  async function submit(formData: FormData) {
    'use server';
    const identifier = String(formData.get('identifier') ?? '');
    const password = String(formData.get('password') ?? '');
    try {
      const user = await login(identifier, password);
      if (user.role !== 'seller' && user.role !== 'admin') {
        throw new Error('SELLERS_ONLY');
      }
    } catch (e: any) {
      return { error: e?.message ?? 'Login failed' };
    }
    redirect((params.next as `/${string}`) || '/');
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-bg via-bgAlt to-surface2 px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block mb-4 w-14 h-14 rounded-full bg-oliveDeep grid place-items-center text-goldSoft font-display text-2xl font-bold">
            24
          </div>
          <h1 className="font-display text-4xl font-bold text-oliveDeep">Sotuvchi paneli</h1>
          <p className="text-muted mt-2">Do'koningizni boshqaring</p>
        </div>
        <div className="card">
          <LoginForm action={submit} />
        </div>
        <p className="text-center text-sm text-muted mt-6">
          Xaridor emassiz? Mobil ilovadan foydalaning.
        </p>
      </div>
    </div>
  );
}
