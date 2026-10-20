'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Loader2,
  Package,
  Users,
  MessageSquare,
  Banknote,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import {
  adminData,
  adminLogin,
  adminLogout,
} from '@/lib/api-client';
import type { ContactMessage, NewsletterEntry, Order } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import { useToast } from '@/components/providers/ToastProvider';

interface Dashboard {
  stats: { orders: number; subscribers: number; messages: number; revenue: number };
  orders: Order[];
  newsletter: NewsletterEntry[];
  contacts: ContactMessage[];
}

type Tab = 'orders' | 'newsletter' | 'contacts';

export default function AdminPage() {
  const toast = useToast();
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Dashboard | null>(null);
  const [tab, setTab] = useState<Tab>('orders');

  const load = async () => {
    setLoading(true);
    const res = await adminData();
    setLoading(false);
    if (res.ok && res.data) {
      setData(res.data);
      setAuthed(true);
    } else {
      setAuthed(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    const res = await adminLogin(password);
    setLoading(false);
    if (res.ok) {
      setPassword('');
      await load();
      toast.success("Admin paneliga xush kelibsiz");
    } else {
      toast.error(res.error ?? "Parol noto'g'ri");
    }
  };

  const logout = async () => {
    await adminLogout();
    setAuthed(false);
    setData(null);
    toast.info("Chiqildi");
  };

  if (!authed) {
    return (
      <section className="py-16 md:py-24">
        <div className="container-main max-w-md">
          <div className="card p-8">
            <div className="w-14 h-14 rounded-full bg-brand/10 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-7 h-7 text-brand" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-ink mt-5 text-center">
              Admin paneli
            </h1>
            <p className="text-sm text-ink-muted text-center mt-2">
              Davom etish uchun parolni kiriting
            </p>
            <form onSubmit={login} className="mt-6 space-y-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Parol"
                required
                className="w-full border border-rule rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Kirish
              </button>
            </form>
            <p className="mt-4 text-xs text-ink-muted text-center">
              Standart parol: <span className="font-mono">hijob2026</span> ·
              o&apos;zgartirish uchun <span className="font-mono">ADMIN_PASSWORD</span> env
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="py-20 text-center text-ink-muted">
        <Loader2 className="w-6 h-6 animate-spin inline-block" />
      </section>
    );
  }

  return (
    <section className="py-10 md:py-14">
      <div className="container-main max-w-6xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-ink">
              Admin paneli
            </h1>
            <p className="text-ink-muted mt-1 text-sm">
              Buyurtma, obunachi va xabarlarni boshqaring
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={load}
              className="btn-outline text-sm !px-4 !py-2 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Yangilash
            </button>
            <button
              onClick={logout}
              className="text-sm text-ink-muted hover:text-red-500 flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" /> Chiqish
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Buyurtmalar"
            value={data.stats.orders.toString()}
            Icon={Package}
          />
          <StatCard
            label="Daromad"
            value={`${formatPrice(data.stats.revenue)} so'm`}
            Icon={Banknote}
          />
          <StatCard
            label="Obunachilar"
            value={data.stats.subscribers.toString()}
            Icon={Users}
          />
          <StatCard
            label="Xabarlar"
            value={data.stats.messages.toString()}
            Icon={MessageSquare}
          />
        </div>

        {/* Tabs */}
        <div className="mt-8 border-b border-rule-light flex gap-2 overflow-x-auto">
          <TabBtn active={tab === 'orders'} onClick={() => setTab('orders')}>
            Buyurtmalar ({data.stats.orders})
          </TabBtn>
          <TabBtn active={tab === 'newsletter'} onClick={() => setTab('newsletter')}>
            Obunachilar ({data.stats.subscribers})
          </TabBtn>
          <TabBtn active={tab === 'contacts'} onClick={() => setTab('contacts')}>
            Xabarlar ({data.stats.messages})
          </TabBtn>
        </div>

        <div className="mt-6">
          {tab === 'orders' && <OrdersTable orders={data.orders} />}
          {tab === 'newsletter' && <NewsletterTable items={data.newsletter} />}
          {tab === 'contacts' && <ContactsList items={data.contacts} />}
        </div>
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  Icon,
}: {
  label: string;
  value: string;
  Icon: typeof Package;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-ink-muted uppercase tracking-wider">
            {label}
          </p>
          <p className="font-serif text-2xl font-bold text-ink mt-1">{value}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-brand text-brand'
          : 'border-transparent text-ink-muted hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}

function OrdersTable({ orders }: { orders: Order[] }) {
  if (orders.length === 0)
    return <p className="text-ink-muted text-sm">Hali buyurtma yo&apos;q.</p>;
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-ink-muted uppercase bg-bg-warm">
          <tr>
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">Mijoz</th>
            <th className="px-4 py-3">Telefon</th>
            <th className="px-4 py-3">Shahar</th>
            <th className="px-4 py-3">Soni</th>
            <th className="px-4 py-3">Jami</th>
            <th className="px-4 py-3">To&apos;lov</th>
            <th className="px-4 py-3">Vaqt</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-t border-rule-light">
              <td className="px-4 py-3 font-mono text-xs">{o.id.slice(-10)}</td>
              <td className="px-4 py-3 font-medium">{o.customer.name}</td>
              <td className="px-4 py-3">{o.customer.phone}</td>
              <td className="px-4 py-3 text-ink-muted">{o.customer.city}</td>
              <td className="px-4 py-3">{o.items.length}</td>
              <td className="px-4 py-3 font-semibold text-brand">
                {formatPrice(o.total)}
              </td>
              <td className="px-4 py-3 uppercase text-xs">{o.paymentMethod}</td>
              <td className="px-4 py-3 text-ink-muted text-xs">
                {new Date(o.createdAt).toLocaleString('uz-UZ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NewsletterTable({ items }: { items: NewsletterEntry[] }) {
  if (items.length === 0)
    return <p className="text-ink-muted text-sm">Hali obunachi yo&apos;q.</p>;
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-ink-muted uppercase bg-bg-warm">
          <tr>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Obuna sanasi</th>
          </tr>
        </thead>
        <tbody>
          {items.map((e) => (
            <tr key={e.email} className="border-t border-rule-light">
              <td className="px-4 py-3">{e.email}</td>
              <td className="px-4 py-3 text-ink-muted text-xs">
                {new Date(e.subscribedAt).toLocaleString('uz-UZ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ContactsList({ items }: { items: ContactMessage[] }) {
  if (items.length === 0)
    return <p className="text-ink-muted text-sm">Hali xabar yo&apos;q.</p>;
  return (
    <div className="space-y-3">
      {items.map((m) => (
        <div key={m.id} className="card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-ink">{m.name}</p>
              <p className="text-xs text-ink-muted mt-0.5">
                {m.email}
                {m.phone ? ` · ${m.phone}` : ''}
              </p>
            </div>
            <span className="text-xs text-ink-muted">
              {new Date(m.createdAt).toLocaleString('uz-UZ')}
            </span>
          </div>
          <p className="text-sm text-ink-muted mt-2">
            <span className="font-medium text-ink">{m.subject}</span>
          </p>
          <p className="mt-2 text-sm text-ink whitespace-pre-wrap">{m.message}</p>
        </div>
      ))}
    </div>
  );
}
