'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '@/components/providers/CartProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { formatPrice } from '@/lib/format';

export default function CartPage() {
  const cart = useCart();
  const toast = useToast();

  if (!cart.isHydrated) {
    return (
      <section className="py-16 text-center text-ink-muted">Yuklanmoqda…</section>
    );
  }

  if (cart.items.length === 0) {
    return (
      <section className="py-16 md:py-24">
        <div className="container-main max-w-xl text-center">
          <div className="w-24 h-24 rounded-full bg-bg-warm mx-auto flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-brand" />
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-ink mt-6">
            Savatingiz bo&apos;sh
          </h1>
          <p className="mt-3 text-ink-muted">
            Katalogdan o&apos;zingizga yoqqan mahsulotlarni savatga qo&apos;shing.
          </p>
          <Link
            href="/katalog"
            className="btn-primary inline-flex items-center gap-2 mt-8"
          >
            Katalogga o&apos;tish
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 md:py-14">
      <div className="container-main">
        <nav className="text-sm text-ink-muted mb-4">
          <Link href="/" className="hover:text-brand">
            Bosh sahifa
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ink font-medium">Savat</span>
        </nav>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-ink mb-8">
          Savat ({cart.count})
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((it) => (
              <div
                key={it.id}
                className="card p-4 flex gap-4 items-center"
              >
                <Link
                  href={`/mahsulot/${it.productId}`}
                  className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden bg-bg-warm shrink-0"
                >
                  <Image
                    src={it.image}
                    alt={it.name}
                    fill
                    className="object-cover"
                    sizes="100px"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/mahsulot/${it.productId}`}
                    className="font-medium text-ink hover:text-brand transition-colors line-clamp-1"
                  >
                    {it.name}
                  </Link>
                  <p className="text-xs text-ink-muted mt-1">
                    {[it.color, it.size].filter(Boolean).join(' · ')}
                  </p>
                  <p className="font-semibold text-ink mt-2">
                    {formatPrice(it.price)} so&apos;m
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => {
                      cart.removeItem(it.id);
                      toast.info("Mahsulot savatdan o'chirildi");
                    }}
                    className="text-ink-muted hover:text-red-500 transition-colors"
                    aria-label="O'chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="inline-flex items-center border border-rule rounded-lg">
                    <button
                      onClick={() =>
                        cart.updateQuantity(it.id, it.quantity - 1)
                      }
                      className="p-2 hover:text-brand"
                      aria-label="Kamaytirish"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">
                      {it.quantity}
                    </span>
                    <button
                      onClick={() =>
                        cart.updateQuantity(it.id, it.quantity + 1)
                      }
                      className="p-2 hover:text-brand"
                      aria-label="Oshirish"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={() => {
                cart.clear();
                toast.info("Savat tozalandi");
              }}
              className="text-sm text-ink-muted hover:text-red-500 transition-colors"
            >
              Savatni tozalash
            </button>
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-24 h-fit">
            <div className="card p-6">
              <h2 className="font-serif text-xl font-semibold text-ink mb-5">
                Buyurtma xulosasi
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-ink-muted">
                  <span>Mahsulotlar</span>
                  <span>{formatPrice(cart.subtotal)} so&apos;m</span>
                </div>
                <div className="flex justify-between text-ink-muted">
                  <span>Yetkazib berish</span>
                  <span>
                    {cart.shipping === 0 ? (
                      <span className="text-emerald-600 font-medium">
                        Bepul
                      </span>
                    ) : (
                      <>{formatPrice(cart.shipping)} so&apos;m</>
                    )}
                  </span>
                </div>
                {cart.shipping > 0 && (
                  <p className="text-xs text-ink-muted">
                    500 000 so&apos;mdan ortiq buyurtmaga bepul yetkazish
                  </p>
                )}
                <div className="pt-3 border-t border-rule-light flex justify-between items-baseline">
                  <span className="font-medium text-ink">Jami</span>
                  <span className="font-serif text-2xl font-bold text-brand">
                    {formatPrice(cart.total)} so&apos;m
                  </span>
                </div>
              </div>
              <Link
                href="/buyurtma"
                className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
              >
                Buyurtma berish
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/katalog"
                className="block text-center text-sm text-brand hover:text-brand-dark mt-4"
              >
                ← Katalogga qaytish
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
