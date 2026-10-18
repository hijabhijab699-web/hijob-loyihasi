'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { User, ShoppingBag, Heart, Settings, LogOut, Package, Clock, Award } from 'lucide-react';
import { useCart } from '@/components/providers/CartProvider';
import { useWishlist } from '@/components/providers/WishlistProvider';
import { useOrders } from '@/components/providers/OrdersProvider';
import { useLoyalty, LOYALTY_PERCENT } from '@/components/providers/LoyaltyProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { formatPrice } from '@/lib/format';

const PROFILE_KEY = 'hijob.profile';

interface Profile {
  name: string;
  phone: string;
  email: string;
  address: string;
}

const EMPTY: Profile = { name: '', phone: '', email: '', address: '' };

export default function ProfilPage() {
  const cart = useCart();
  const wl = useWishlist();
  const ordersStore = useOrders();
  const loyalty = useLoyalty();
  const toast = useToast();
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [editing, setEditing] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') setProfile({ ...EMPTY, ...parsed });
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      toast.success("Profil saqlandi");
      setEditing(false);
    } catch {
      toast.error("Saqlab bo'lmadi");
    }
  };

  const signOut = () => {
    try {
      localStorage.removeItem(PROFILE_KEY);
      localStorage.removeItem('hijob.cart');
      localStorage.removeItem('hijob.wishlist');
    } catch {
      /* ignore */
    }
    cart.clear();
    wl.clear();
    setProfile(EMPTY);
    toast.info("Chiqdingiz");
  };

  const hasProfile = Boolean(profile.name || profile.phone);

  return (
    <section className="py-10 md:py-14">
      <div className="container-main">
        <nav className="text-sm text-ink-muted mb-4">
          <Link href="/" className="hover:text-brand">
            Bosh sahifa
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ink font-medium">Profil</span>
        </nav>

        <h1 className="font-serif text-3xl md:text-4xl font-bold text-ink">
          Profil
        </h1>

        {/* Loyalty strip */}
        <div className="mt-6 rounded-2xl bg-gradient-to-r from-brand to-brand-dark text-white p-5 md:p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
              <Award className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-white/80">Hijob ballari</p>
              <p className="font-serif text-2xl md:text-3xl font-bold mt-0.5">
                {formatPrice(loyalty.balance)}
              </p>
              <p className="text-xs text-white/70 mt-0.5">
                Jami yig&apos;ilgan: {formatPrice(loyalty.earned)} ·
                Ishlatilgan: {formatPrice(loyalty.spent)}
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-white/80 max-w-[180px]">
            Har xaridda {LOYALTY_PERCENT}% ball oling va keyingi buyurtmada
            xarajat qiling.
          </div>
        </div>

        <div className="mt-8 grid lg:grid-cols-3 gap-6">
          <div className="card p-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-brand/15 flex items-center justify-center">
                <User className="w-7 h-7 text-brand" />
              </div>
              <div>
                <p className="font-medium text-ink">
                  {hasProfile ? profile.name || 'Mijoz' : 'Mehmon'}
                </p>
                <p className="text-sm text-ink-muted">
                  {profile.phone || "Ma'lumotlar kiritilmagan"}
                </p>
              </div>
            </div>

            {hydrated && (editing || !hasProfile) ? (
              <form onSubmit={save} className="mt-6 space-y-3">
                <input
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                  placeholder="Ism"
                  required
                  className="w-full border border-rule rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
                <input
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile({ ...profile, phone: e.target.value })
                  }
                  placeholder="+998 90 123 45 67"
                  required
                  className="w-full border border-rule rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) =>
                    setProfile({ ...profile, email: e.target.value })
                  }
                  placeholder="Email (ixtiyoriy)"
                  className="w-full border border-rule rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
                <input
                  value={profile.address}
                  onChange={(e) =>
                    setProfile({ ...profile, address: e.target.value })
                  }
                  placeholder="Manzil (ixtiyoriy)"
                  className="w-full border border-rule rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
                <button type="submit" className="btn-primary w-full text-sm">
                  Saqlash
                </button>
                {hasProfile && (
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="w-full text-sm text-ink-muted hover:text-ink"
                  >
                    Bekor qilish
                  </button>
                )}
              </form>
            ) : hydrated && hasProfile ? (
              <div className="mt-6 space-y-3 text-sm">
                {profile.email && (
                  <div className="flex justify-between">
                    <span className="text-ink-muted">Email</span>
                    <span className="text-ink">{profile.email}</span>
                  </div>
                )}
                {profile.address && (
                  <div className="flex justify-between gap-3">
                    <span className="text-ink-muted">Manzil</span>
                    <span className="text-ink text-right">{profile.address}</span>
                  </div>
                )}
                <button
                  onClick={() => setEditing(true)}
                  className="btn-outline w-full text-sm mt-3"
                >
                  Tahrirlash
                </button>
                <button
                  onClick={signOut}
                  className="w-full text-sm text-red-500 hover:text-red-600 flex items-center justify-center gap-2 mt-2"
                >
                  <LogOut className="w-4 h-4" /> Chiqish
                </button>
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
            <QuickCard
              href="/savat"
              icon={<ShoppingBag className="w-6 h-6" />}
              label="Savat"
              value={`${cart.count} ta mahsulot`}
            />
            <QuickCard
              href="/sevimli"
              icon={<Heart className="w-6 h-6" />}
              label="Sevimlilar"
              value={`${wl.ids.length} ta mahsulot`}
            />
            <QuickCard
              href="/buyurtmalarim"
              icon={<Clock className="w-6 h-6" />}
              label="Buyurtmalarim"
              value={`${ordersStore.orders.length} ta buyurtma`}
            />
            <QuickCard
              href="/aloqa"
              icon={<Settings className="w-6 h-6" />}
              label="Yordam"
              value="Yetkazish, to'lov"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function QuickCard({
  href,
  icon,
  label,
  value,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Link
      href={href}
      className="card p-5 hover-lift flex items-start gap-4 group"
    >
      <div className="w-11 h-11 rounded-xl bg-brand/10 text-brand flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-colors">
        {icon}
      </div>
      <div>
        <p className="font-medium text-ink">{label}</p>
        <p className="text-sm text-ink-muted mt-0.5">{value}</p>
      </div>
    </Link>
  );
}
