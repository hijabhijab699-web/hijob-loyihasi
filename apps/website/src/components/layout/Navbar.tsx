'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  Menu,
  X,
  Search,
  Heart,
  ShoppingBag,
  User,
  LogIn,
  LogOut,
  Store,
  Package,
} from 'lucide-react';
import { useCart } from '@/components/providers/CartProvider';
import { useWishlist } from '@/components/providers/WishlistProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';

export function Navbar() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { count: cartCount } = useCart();
  const { ids: wishlistIds } = useWishlist();
  const auth = useAuth();
  const { t } = useLocale();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close the profile dropdown on outside click so it doesn't linger
  // over the page when the user clicks away.
  useEffect(() => {
    if (!profileOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!profileRef.current?.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [profileOpen]);

  const firstInitial = auth.user?.fullName?.trim().charAt(0).toUpperCase() ?? '';

  const navLinks = [
    { href: '/katalog', label: t.nav.catalog },
    { href: '/primerka', label: 'Primerka' },
    { href: '/aloqa', label: t.nav.contact },
  ];

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearchOpen(false);
    setMobileOpen(false);
    router.push(`/qidiruv?q=${encodeURIComponent(q)}`);
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-rule-light">
        <div className="container-main flex items-center justify-between h-16 md:h-20">
          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 -ml-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/logo.png"
              alt="Hijob"
              width={44}
              height={44}
              priority
              className="w-9 h-9 md:w-11 md:h-11 rounded-xl shadow-sm group-hover:shadow-md transition-shadow"
            />
            <span className="font-serif text-2xl md:text-3xl font-bold text-brand">
              Hijob
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-ink-muted hover:text-brand transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>
            <button
              onClick={() => setSearchOpen((v) => !v)}
              className="hidden md:block p-2 hover:text-brand transition-colors"
              aria-label={t.nav.search}
            >
              <Search className="w-5 h-5" />
            </button>
            <Link
              href="/sevimli"
              className="hidden md:block p-2 hover:text-brand transition-colors relative"
              aria-label="Sevimlilar"
            >
              <Heart className="w-5 h-5" />
              {wishlistIds.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand text-white text-[10px] rounded-full flex items-center justify-center">
                  {wishlistIds.length}
                </span>
              )}
            </Link>
            <Link
              href="/savat"
              className="p-2 hover:text-brand transition-colors relative"
              aria-label="Savat"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-white text-[10px] rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            {/* Desktop profile — initial avatar + dropdown when signed in,
                plain icon → /kirish otherwise. The dropdown lets the user
                reach their orders and the seller dashboard without a
                page-load. */}
            <div className="hidden md:block relative" ref={profileRef}>
              {auth.hydrated && auth.user ? (
                <>
                  <button
                    type="button"
                    onClick={() => setProfileOpen((v) => !v)}
                    className="w-9 h-9 rounded-full bg-brand text-white font-semibold text-sm flex items-center justify-center hover:bg-brand-dark transition-colors"
                    aria-label="Profil"
                  >
                    {firstInitial || <User className="w-4 h-4" />}
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-rule rounded-2xl shadow-lg overflow-hidden">
                      <div className="px-4 py-3 border-b border-rule-light">
                        <p className="font-medium text-ink truncate">{auth.user.fullName}</p>
                        <p className="text-xs text-ink-muted truncate mt-0.5">
                          @{auth.user.username}
                        </p>
                      </div>
                      <div className="py-1">
                        <Link
                          href="/profil"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink hover:bg-bg-warm"
                        >
                          <User className="w-4 h-4 text-ink-muted" />
                          Profil
                        </Link>
                        <Link
                          href="/buyurtmalarim"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink hover:bg-bg-warm"
                        >
                          <Package className="w-4 h-4 text-ink-muted" />
                          Buyurtmalarim
                        </Link>
                        {auth.user.role === 'seller' && (
                          <a
                            href="https://hijab-admin.vercel.app"
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink hover:bg-bg-warm"
                          >
                            <Store className="w-4 h-4 text-ink-muted" />
                            Sotuvchi paneli
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            auth.logout();
                            setProfileOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink hover:bg-bg-warm border-t border-rule-light"
                        >
                          <LogOut className="w-4 h-4 text-ink-muted" />
                          Chiqish
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href="/kirish"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-ink hover:text-brand px-3 py-2 border border-rule rounded-full hover:border-brand transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Kirish
                </Link>
              )}
            </div>
            <button
              onClick={() => setSearchOpen((v) => !v)}
              className="md:hidden p-2 hover:text-brand transition-colors"
              aria-label={t.nav.search}
            >
              <Search className="w-5 h-5" />
            </button>
            <div className="md:hidden">
              <LanguageSwitcher compact />
            </div>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="border-t border-rule-light bg-white">
            <div className="container-main py-3">
              <form
                onSubmit={submitSearch}
                className="flex items-center gap-2 bg-bg-warm rounded-xl px-4 py-2.5"
              >
                <Search className="w-5 h-5 text-ink-muted shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.common.search}
                  className="flex-1 bg-transparent outline-none text-ink placeholder:text-ink-muted"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    setQuery('');
                  }}
                  className="text-ink-muted hover:text-ink"
                  aria-label="Yopish"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Mobile Menu Drawer */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-rule-light">
            <nav className="container-main py-4 flex flex-col gap-1">
              {/* Auth card at the top of the drawer so the user's state
                  is the first thing they see. Signed-in shows name +
                  Chiqish; signed-out shows a Kirish primary button. */}
              {auth.hydrated && (
                auth.user ? (
                  <div className="mb-3 p-3 rounded-xl bg-brand/5 border border-brand/15 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand text-white font-semibold flex items-center justify-center shrink-0">
                      {firstInitial || <User className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink truncate">{auth.user.fullName}</p>
                      <p className="text-xs text-ink-muted truncate">@{auth.user.username}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        auth.logout();
                        setMobileOpen(false);
                      }}
                      className="text-xs text-ink-muted hover:text-brand p-2"
                      aria-label="Chiqish"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/kirish"
                    onClick={() => setMobileOpen(false)}
                    className="mb-3 flex items-center justify-center gap-2 bg-brand text-white py-3 rounded-xl font-medium"
                  >
                    <LogIn className="w-4 h-4" />
                    Kirish / Ro&apos;yxatdan o&apos;tish
                  </Link>
                )
              )}
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="py-3 px-2 text-base font-medium text-ink hover:text-brand hover:bg-bg-warm rounded-lg transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/sevimli"
                className="py-3 px-2 text-base font-medium text-ink hover:text-brand hover:bg-bg-warm rounded-lg transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Sevimlilar{wishlistIds.length ? ` (${wishlistIds.length})` : ''}
              </Link>
              <Link
                href="/profil"
                className="py-3 px-2 text-base font-medium text-ink hover:text-brand hover:bg-bg-warm rounded-lg transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Profil
              </Link>
              {auth.user?.role === 'seller' && (
                <a
                  href="https://hijab-admin.vercel.app"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setMobileOpen(false)}
                  className="py-3 px-2 text-base font-medium text-ink hover:text-brand hover:bg-bg-warm rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  <Store className="w-4 h-4" />
                  Sotuvchi paneli
                </a>
              )}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
