import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Mail, Sparkles, Star, Tag } from 'lucide-react';
import { CATEGORIES } from '@/lib/categories';
import { listReviews } from '@/lib/db';
import { getHome, getProducts, toCategory, toProduct } from '@/lib/nestjs';
import { PROMO_CODES } from '@/lib/promo';
import { ProductCard } from '@/components/ProductCard';
import { NewsletterForm } from '@/components/NewsletterForm';
import { InstagramFeed } from '@/components/InstagramFeed';
import { HeroSection } from '@/components/HeroSection';

const stats = [
  { value: '2,400+', label: 'Mamnun mijozlar' },
  { value: '4.9', label: "O'rtacha baho" },
  { value: '160+', label: 'Mahsulot turi' },
  { value: '6+', label: 'Yillik tajriba' },
];

function StarRow({ rating, size = 18 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={
            i < Math.floor(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'fill-gray-200 text-gray-200'
          }
        />
      ))}
    </div>
  );
}

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [home, productsPage, allReviews] = await Promise.all([
    getHome().catch(() => null),
    getProducts({ pageSize: 6, sort: 'popularity' }).catch(() => null),
    listReviews(),
  ]);

  const categories = home?.categories?.length
    ? home.categories.map((c) => toCategory(c))
    : CATEGORIES;

  const products = (productsPage?.items ?? []).map((p) => toProduct(p));
  const instagramPosts = (
    home?.newArrivals?.slice(0, 6) ?? productsPage?.items ?? []
  )
    .slice(0, 6)
    .map((p) => toProduct(p));
  const testimonials = allReviews.filter((r) => !r.productId).slice(0, 3);

  return (
    <>
      {/* ===== 1. HERO SECTION ===== */}
      <HeroSection />

      {/* ===== 2. SOCIAL PROOF BAR ===== */}
      <section className="bg-white py-8 border-y border-rule">
        <div className="container-main">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className={`text-center reveal-up reveal-delay-${i + 1}`}
              >
                <p className="text-3xl md:text-4xl font-serif font-bold text-brand">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-ink-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 4. CATEGORIES ===== */}
      <section className="py-12 md:py-16 bg-bg-warm">
        <div className="container-main">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-center mb-10 reveal-up">
            Kategoriyalar
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {categories.map((cat, i) => (
              <Link
                key={cat.slug}
                href={`/katalog?category=${cat.slug}`}
                className={`group relative rounded-2xl overflow-hidden cursor-pointer hover-lift reveal-scale reveal-delay-${i + 1}`}
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                  <h3 className="font-serif text-lg md:text-xl font-semibold text-white">
                    {cat.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 5. POPULAR PRODUCTS ===== */}
      <section className="py-12 md:py-16">
        <div className="container-main">
          <div className="flex items-center justify-between mb-10 reveal-up">
            <h2 className="font-serif text-3xl md:text-4xl font-bold">
              Mashhur mahsulotlar
            </h2>
            <Link
              href="/katalog"
              className="text-brand font-medium hover:text-brand-dark transition-colors flex items-center gap-1 hover:gap-2"
            >
              Barchasi
              <ArrowRight size={16} />
            </Link>
          </div>
          {products.length === 0 ? (
            <p className="text-center text-ink-muted py-10">
              Mahsulotlar yuklanmoqda yoki backend ulanmagan.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {products.map((p, i) => (
                <div key={p.id} className={`reveal-up reveal-delay-${(i % 3) + 1}`}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== 5B. PROMO STRIP ===== */}
      <section className="py-6 bg-accent/10 border-y border-accent/20">
        <div className="container-main flex items-center gap-3 overflow-x-auto scrollbar-hide">
          <Tag className="w-5 h-5 text-brand shrink-0" />
          <span className="text-sm font-medium text-ink shrink-0">
            Promo-kodlar:
          </span>
          {PROMO_CODES.map((p) => (
            <span
              key={p.code}
              className="shrink-0 inline-flex items-center gap-2 bg-white border border-rule rounded-full px-3 py-1.5 text-xs"
            >
              <span className="font-mono font-bold text-brand">{p.code}</span>
              <span className="text-ink-muted">— {p.description}</span>
            </span>
          ))}
        </div>
      </section>

      {/* ===== 6. AI TRY-ON CTA ===== */}
      <section className="py-12 md:py-16">
        <div className="container-main">
          <div className="bg-brand rounded-3xl px-6 md:px-16 py-12 md:py-16 text-center text-white">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles size={24} className="text-accent" />
              <span className="text-accent font-medium text-sm uppercase tracking-wider">
                Sun&apos;iy intellekt
              </span>
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold">
              AI Primerka
            </h2>
            <p className="mt-4 text-white/80 max-w-xl mx-auto text-base md:text-lg">
              O&apos;z selfiengizni yuklang va ro&apos;molni virtual sinab
              ko&apos;ring. Klassik, erkin yoki ikki qavatli uslubda.
            </p>
            <Link
              href="/primerka"
              className="mt-8 inline-flex items-center gap-2 bg-white text-brand px-8 py-3 rounded-xl font-medium hover:bg-white/90 transition-colors"
            >
              <Sparkles size={18} />
              Primerkani boshlash
            </Link>
          </div>
        </div>
      </section>

      {/* ===== 7. TESTIMONIALS ===== */}
      <section className="py-12 md:py-16 bg-bg-warm">
        <div className="container-main">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-center mb-10">
            Mijozlar fikri
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.id} className="card p-6 md:p-8">
                <StarRow rating={t.rating} />
                <p className="mt-4 text-ink-muted leading-relaxed italic">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand/15 flex items-center justify-center font-semibold text-brand">
                    {t.name.charAt(0)}
                  </div>
                  <span className="font-medium text-ink">{t.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 7C. INSTAGRAM FEED ===== */}
      <InstagramFeed posts={instagramPosts} />

      {/* ===== 8. NEWSLETTER ===== */}
      <section className="py-12 md:py-16">
        <div className="container-main">
          <div className="bg-bg-warm rounded-3xl px-6 md:px-16 py-12 md:py-16 text-center">
            <Mail size={40} className="mx-auto text-brand mb-4" />
            <h2 className="font-serif text-3xl md:text-4xl font-bold">
              Yangiliklar va maxsus takliflar
            </h2>
            <p className="mt-3 text-ink-muted max-w-md mx-auto">
              Eng so&apos;nggi yangiliklar va chegirmalardan birinchi bo&apos;lib
              xabardor bo&apos;ling
            </p>
            <NewsletterForm />
          </div>
        </div>
      </section>

      {/* ===== FLOATING AI CHAT BUTTON ===== */}
      <Link
        href="/primerka"
        className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-40 w-14 h-14 rounded-full bg-brand shadow-lg flex items-center justify-center text-white hover:bg-brand-dark transition-colors duration-200"
        aria-label="AI Primerka"
      >
        <Sparkles size={24} />
      </Link>
    </>
  );
}
