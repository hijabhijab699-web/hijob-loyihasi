'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid3X3, Sparkles, Heart, User } from 'lucide-react';
import { clsx } from 'clsx';
import { useWishlist } from '@/components/providers/WishlistProvider';

const tabs = [
  { href: '/', label: 'Bosh sahifa', icon: Home },
  { href: '/katalog', label: 'Katalog', icon: Grid3X3 },
  { href: '/primerka', label: 'Primerka', icon: Sparkles, hero: true },
  { href: '/sevimli', label: 'Sevimli', icon: Heart },
  { href: '/profil', label: 'Profil', icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { ids } = useWishlist();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-rule-light">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const isActive =
            tab.href === '/'
              ? pathname === '/'
              : pathname === tab.href || pathname.startsWith(tab.href + '/');
          const Icon = tab.icon;
          const showBadge = tab.href === '/sevimli' && ids.length > 0;
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={clsx(
                'flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors relative',
                isActive ? 'text-brand' : 'text-ink-muted',
                tab.hero && 'relative',
              )}
            >
              {tab.hero ? (
                <div className="w-10 h-10 -mt-5 bg-brand rounded-full flex items-center justify-center shadow-lg">
                  <Icon className="w-5 h-5 text-white" />
                </div>
              ) : (
                <Icon className="w-5 h-5" />
              )}
              <span className="text-[10px] font-medium">{tab.label}</span>
              {showBadge && (
                <span className="absolute top-0 right-2 w-4 h-4 rounded-full bg-brand text-white text-[9px] flex items-center justify-center">
                  {ids.length}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
