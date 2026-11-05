'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LayoutDashboard, Package, ClipboardList, Store, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';

// Mirrors the mobile (seller-tabs) layout: a single column of nav
// pills on desktop, a horizontal tab bar below md. The sotuvchi area
// is gated on `auth.user?.role === 'seller'` — buyers get bounced to
// /profil with a one-line note, not a wall of forms they can't use.
const NAV = [
  { href: '/sotuvchi', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/sotuvchi/mahsulotlar', label: 'Mahsulotlar', icon: Package },
  { href: '/sotuvchi/buyurtmalar', label: 'Buyurtmalar', icon: ClipboardList },
  { href: '/sotuvchi/profil', label: "Do'kon", icon: Store },
];

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/sotuvchi';
  const router = useRouter();
  const auth = useAuth();

  useEffect(() => {
    if (!auth.hydrated) return;
    if (!auth.user) router.replace(`/kirish?next=${encodeURIComponent(pathname)}`);
    else if (auth.user.role !== 'seller') router.replace('/profil');
  }, [auth.hydrated, auth.user, pathname, router]);

  if (!auth.hydrated || !auth.user || auth.user.role !== 'seller') {
    return (
      <section className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-ink-muted" />
      </section>
    );
  }

  return (
    <section className="bg-bg-warm min-h-[calc(100vh-80px)]">
      <div className="container-main py-6 md:py-10">
        <header className="mb-6">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-ink">
            Sotuvchi paneli
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Mahsulotlaringizni, buyurtmalaringizni va do&apos;kon profilingizni shu
            yerdan boshqaring.
          </p>
        </header>

        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-64 shrink-0">
            <nav className="flex lg:flex-col gap-2 overflow-x-auto scrollbar-hide">
              {NAV.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl whitespace-nowrap text-sm font-medium transition-colors ${
                      active
                        ? 'bg-brand text-white'
                        : 'bg-white text-ink hover:bg-rule-light border border-rule-light'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </section>
  );
}
