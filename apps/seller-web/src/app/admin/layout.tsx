import { redirect } from 'next/navigation';
import Link from 'next/link';
import { me, logout } from '@/lib/api';
import { LayoutDashboard, Users, Package, ShoppingCart, UserCog, LogOut } from 'lucide-react';

const NAV = [
  { href: '/admin', label: 'Umumiy', icon: LayoutDashboard },
  { href: '/admin/sellers', label: 'Sotuvchilar', icon: UserCog },
  { href: '/admin/products', label: 'Mahsulotlar', icon: Package },
  { href: '/admin/users', label: 'Foydalanuvchilar', icon: Users },
  { href: '/admin/orders', label: 'Buyurtmalar', icon: ShoppingCart },
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await me();
  if (!user) redirect('/login');
  // Only admin + moderator see the admin console. Sellers get bounced to
  // their own dashboard rather than the login page.
  if (user.role !== 'admin' && user.role !== 'moderator') {
    redirect('/');
  }

  async function logoutAction() {
    'use server';
    await logout();
    redirect('/login');
  }

  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr]">
      <aside className="bg-ink text-goldSoft flex flex-col p-6 gap-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gold grid place-items-center text-ink font-display font-bold">
            24
          </div>
          <div>
            <div className="font-display text-lg font-bold text-white">N24:31</div>
            <div className="text-xs uppercase tracking-wider text-gold">Admin</div>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href as any}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Icon size={18} />
              <span className="text-sm">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="px-4 py-3 rounded-xl bg-white/5">
            <div className="text-xs text-gold/60 uppercase tracking-wider mb-1">
              {user.role === 'admin' ? 'Administrator' : 'Moderator'}
            </div>
            <div className="text-sm font-medium text-white">{user.fullName ?? user.username}</div>
            <div className="text-xs text-gold/70">@{user.username}</div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-colors"
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
