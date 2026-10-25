import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, UserCog, Package, Users, ShoppingCart, LogOut, Sparkles, Megaphone, CreditCard, Settings, Tags, Briefcase } from 'lucide-react';
import { me, logout } from '@/lib/api';

const NAV = [
  { href: '/', label: 'Umumiy', icon: LayoutDashboard },
  { href: '/sellers', label: 'Sotuvchilar', icon: UserCog },
  { href: '/agents', label: 'Agentlar', icon: Briefcase },
  { href: '/subscriptions', label: 'Obunalar', icon: CreditCard },
  { href: '/products', label: 'Mahsulotlar', icon: Package },
  { href: '/categories', label: 'Kategoriyalar', icon: Tags },
  { href: '/ads', label: 'Reklama', icon: Megaphone },
  { href: '/dev-ai', label: 'Dev AI panel', icon: Sparkles },
  { href: '/users', label: 'Foydalanuvchilar', icon: Users },
  { href: '/orders', label: 'Buyurtmalar', icon: ShoppingCart },
  { href: '/settings', label: 'Sozlamalar', icon: Settings },
] as const;

// Auth gate for every admin page. Non-admin/moderator tokens are logged out
// and sent back to /login so a seller token can't accidentally render admin
// chrome even if the backend's RolesGuard still refuses the data calls.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await me();
  if (!user) redirect('/login');
  if (user.role !== 'admin' && user.role !== 'moderator') {
    await logout();
    redirect('/login');
  }

  async function logoutAction() {
    'use server';
    await logout();
    redirect('/login');
  }

  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr] items-start">
      <aside className="sticky top-0 h-screen max-h-screen bg-ink text-goldSoft flex flex-col p-6 gap-8 overflow-y-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gold grid place-items-center text-ink font-display font-bold">
            24
          </div>
          <div>
            <div className="font-display text-lg font-bold text-white">N24:31</div>
            <div className="text-xs uppercase tracking-wider text-gold">Admin</div>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-goldSoft/80 hover:bg-white/5 hover:text-white transition"
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-white/10">
          <div className="text-xs text-goldSoft/60 mb-1">Admin</div>
          <div className="text-sm text-white font-medium">{user.fullName || `@${user.username}`}</div>
          <form action={logoutAction} className="mt-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 text-xs text-goldSoft/70 hover:text-white transition"
            >
              <LogOut size={14} /> Chiqish
            </button>
          </form>
        </div>
      </aside>

      <main className="p-10">{children}</main>
    </div>
  );
}
