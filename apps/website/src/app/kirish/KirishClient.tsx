'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { User, Phone, Lock, AtSign, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';

type Mode = 'login' | 'register';

const PHONE_RE = /^\+998\d{9}$/;
const USERNAME_RE = /^@?[a-z0-9_]{3,32}$/i;

function normalizePhone(raw: string): string {
  // Accept "+998 90 123 45 67", "998901234567", "901234567" → "+998901234567".
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('998')) return `+${digits}`;
  if (digits.length === 9) return `+998${digits}`;
  return raw.trim();
}

function friendlyError(message: string, mode: Mode): string {
  switch (message) {
    case 'USERNAME_TAKEN':
      return 'Bu username band. Boshqasini tanlang.';
    case 'PHONE_TAKEN':
      return 'Bu telefon raqami ro\'yxatdan o\'tgan.';
    case 'INVALID_CREDENTIALS':
      return 'Login yoki parol xato.';
    case 'ACCOUNT_SUSPENDED':
      return 'Akkaunt bloklangan. Qo\'llab-quvvatlashga murojaat qiling.';
    case 'PHONE_NOT_VERIFIED':
      return 'Telefon tasdiqlanmagan — SMS kodi yuborildi.';
    default:
      return mode === 'login' ? 'Kira olmadik.' : 'Ro\'yxatdan o\'tishda xato.';
  }
}

export default function KirishClient() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search?.get('next') || '/profil';
  const auth = useAuth();
  const toast = useToast();

  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('+998');
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');

  const onLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const id = identifier.trim().startsWith('+')
        ? normalizePhone(identifier)
        : identifier.trim();
      await auth.login(id, password);
      toast.success('Xush kelibsiz!');
      router.replace(next);
    } catch (err) {
      toast.error(friendlyError((err as Error).message, 'login'));
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const normalizedPhone = normalizePhone(phone);
    if (!PHONE_RE.test(normalizedPhone)) {
      toast.error('Telefon raqami +998XXXXXXXXX ko\'rinishida bo\'lishi kerak.');
      return;
    }
    const cleanUsername = username.replace(/^@/, '').trim();
    if (!USERNAME_RE.test(cleanUsername)) {
      toast.error('Username 3-32 belgidan iborat bo\'lishi kerak (a-z, 0-9, _).');
      return;
    }
    if (password.length < 6) {
      toast.error('Parol kamida 6 belgidan iborat bo\'lishi kerak.');
      return;
    }

    setLoading(true);
    try {
      await auth.register({
        fullName: fullName.trim(),
        username: cleanUsername,
        phone: normalizedPhone,
        password,
        role,
      });
      toast.success('Ro\'yxatdan o\'tdingiz!');
      router.replace(next);
    } catch (err) {
      toast.error(friendlyError((err as Error).message, 'register'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-10 md:py-14">
      <div className="container-main max-w-md">
        <nav className="text-sm text-ink-muted mb-4">
          <Link href="/" className="hover:text-brand">
            Bosh sahifa
          </Link>{' '}
          / <span>{mode === 'login' ? 'Kirish' : 'Ro\'yxatdan o\'tish'}</span>
        </nav>

        <h1 className="font-display text-3xl md:text-4xl mb-6">
          {mode === 'login' ? 'Hisobga kirish' : 'Yangi akkaunt'}
        </h1>

        <div className="flex gap-2 mb-6 bg-rule-light p-1 rounded-full">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-full text-sm font-medium transition ${
              mode === 'login' ? 'bg-brand text-white' : 'text-ink-muted hover:text-ink'
            }`}
          >
            Kirish
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-2 rounded-full text-sm font-medium transition ${
              mode === 'register' ? 'bg-brand text-white' : 'text-ink-muted hover:text-ink'
            }`}
          >
            Ro'yxatdan o'tish
          </button>
        </div>

        {mode === 'login' ? (
          <form onSubmit={onLogin} className="space-y-4">
            <Field icon={<AtSign className="w-4 h-4" />} label="Telefon yoki @username">
              <input
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="+998901234567 yoki @username"
                className="input"
                required
              />
            </Field>
            <Field icon={<Lock className="w-4 h-4" />} label="Parol">
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                required
                minLength={6}
              />
            </Field>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Kirish'}
            </button>
          </form>
        ) : (
          <form onSubmit={onRegister} className="space-y-4">
            <Field icon={<User className="w-4 h-4" />} label="To'liq ism">
              <input
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input"
                required
                minLength={2}
                maxLength={120}
              />
            </Field>
            <Field icon={<AtSign className="w-4 h-4" />} label="Username">
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="@username"
                className="input"
                required
              />
            </Field>
            <Field icon={<Phone className="w-4 h-4" />} label="Telefon">
              <input
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998901234567"
                className="input"
                required
              />
            </Field>
            <Field icon={<Lock className="w-4 h-4" />} label="Parol">
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                required
                minLength={6}
              />
            </Field>
            <div>
              <label className="text-sm font-medium text-ink mb-2 block">
                Kim bo'lasiz?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <RoleOption
                  active={role === 'buyer'}
                  onClick={() => setRole('buyer')}
                  title="Xaridor"
                  desc="Mahsulotlarni sotib olish"
                />
                <RoleOption
                  active={role === 'seller'}
                  onClick={() => setRole('seller')}
                  title="Sotuvchi"
                  desc="O'z do'konimni ochish"
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ro\'yxatdan o\'tish'}
            </button>
            <p className="text-xs text-ink-muted text-center">
              Ro'yxatdan o'tish orqali{' '}
              <Link href="/maxfiylik" className="text-brand hover:underline">
                maxfiylik siyosati
              </Link>
              ga rozilik bildirasiz.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink mb-1.5 flex items-center gap-1.5">
        <span className="text-ink-muted">{icon}</span>
        {label}
      </span>
      {children}
    </label>
  );
}

function RoleOption({
  active,
  onClick,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-3 rounded-xl border-2 text-left transition ${
        active ? 'border-brand bg-brand/5' : 'border-rule bg-white hover:border-ink-muted'
      }`}
    >
      <div className="font-semibold text-ink">{title}</div>
      <div className="text-xs text-ink-muted mt-0.5">{desc}</div>
    </button>
  );
}
