import { redirect } from 'next/navigation';
import Link from 'next/link';
import { me, logout } from '@/lib/api';
import { Home, Package, ShoppingBag, BarChart3, Settings, LogOut } from 'lucide-react';

const NAV = [
  { href: '/', label: 'Bosh sahifa', icon: Home },
  { href: '/products', label: 'Mahsulotlar', icon: Package },
  { href: '/orders', label: 'Buyurtmalar', icon: ShoppingBag },
  { href: '/analytics', label: 'Statistika', icon: BarChart3 },
  { href: '/settings', label: 'Sozlamalar', icon: Settings },
] as const;

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await me();
  if (!user) redirect('/login');
  if (user.role !== 'seller' && user.role !== 'admin') redirect('/login');

  async function logoutAction() {
    'use server';
    await logout();
    redirect('/login');
  }

  return (
    <div className="min-h-screen grid grid-cols-[240px_1fr]">
      <aside className="bg-oliveDeep text-goldSoft flex flex-col p-6 gap-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold grid place-items-center text-ink font-display font-bold">
              24
            </div>
            <div>
              <div className="font-display text-lg font-bold text-white">N24:31</div>
              <div className="text-xs uppercase tracking-wider text-goldSoft/70">Sotuvchi</div>
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href as any}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:bg-white/5 hover:text-white transition-colors"
              >
                <Icon size={18} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="px-4 py-3 rounded-xl bg-black/20">
            <div className="text-xs text-goldSoft/60 uppercase tracking-wider mb-1">Do'kon</div>
            <div className="text-sm font-medium text-white">{user.fullName ?? user.username}</div>
            <div className="text-xs text-goldSoft/70">@{user.username}</div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 hover:text-white transition-colors"
            >
              <LogOut size={18} />
              <span className="text-sm">Chiqish</span>
            </button>
          </form>
        </div>
      </aside>

      <main className="bg-bg overflow-y-auto">
        <div className="max-w-6xl mx-auto p-10">{children}</div>
      </main>
    </div>
  );
}
