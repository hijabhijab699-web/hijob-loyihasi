'use client';

import Image from 'next/image';
import { useState } from 'react';
import {
  Heart,
  ShoppingBag,
  Star,
  Minus,
  Plus,
  Truck,
  ShieldCheck,
  RotateCcw,
  Check,
  Ruler,
  Sparkles,
} from 'lucide-react';
import type { Product, Review } from '@/lib/types';
import { useCart } from '@/components/providers/CartProvider';
import { useWishlist } from '@/components/providers/WishlistProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { ProductCard } from '@/components/ProductCard';
import { ShareButtons } from '@/components/ShareButtons';
import { RecordRecent } from '@/components/RecordRecent';
import { RecentlyViewed } from '@/components/RecentlyViewed';
import { SizeGuideModal } from '@/components/product/SizeGuideModal';
import { TryOnModal } from '@/components/product/TryOnModal';
import { StockAlertButton } from '@/components/product/StockAlertButton';
import { formatPrice } from '@/lib/format';
import { submitReview } from '@/lib/api-client';

interface Props {
  product: Product;
  reviews: Review[];
  related: Product[];
}

const COLOR_HEX: Record<string, string> = {
  Oq: '#FFFFFF',
  Qora: '#1a1a1a',
  Jigarrang: '#7C6354',
  Kumush: '#C0C0C0',
  Pushti: '#FFB6C1',
  Moviy: '#87CEEB',
  Yashil: '#90EE90',
  Sariq: '#FFD700',
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'fill-rule-light text-rule-light'
          }`}
        />
      ))}
    </span>
  );
}

export default function ProductDetail({ product, reviews, related }: Props) {
  const cart = useCart();
  const wl = useWishlist();
  const toast = useToast();

  const [color, setColor] = useState(product.colors[0]);
  const [size, setSize] = useState(product.sizes[0]);
  const [qty, setQty] = useState(1);
  const [gallery, setGallery] = useState(product.image);

  const [rvName, setRvName] = useState('');
  const [rvRating, setRvRating] = useState(5);
  const [rvText, setRvText] = useState('');
  const [rvLoading, setRvLoading] = useState(false);
  const [localReviews, setLocalReviews] = useState<Review[]>(reviews);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [tryOnOpen, setTryOnOpen] = useState(false);

  const liked = wl.has(product.id);

  const addToCart = () => {
    cart.addItem(product, { quantity: qty, color, size });
    toast.success(`"${product.name}" savatga qo'shildi`);
  };

  const buyNow = () => {
    cart.addItem(product, { quantity: qty, color, size });
    window.location.href = '/buyurtma';
  };

  const submitRv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rvName.trim() || !rvText.trim() || rvLoading) return;
    setRvLoading(true);
    const res = await submitReview({
      productId: product.id,
      name: rvName.trim(),
      rating: rvRating,
      text: rvText.trim(),
    });
    setRvLoading(false);
    if (res.ok && res.data) {
      toast.success("Fikringiz uchun rahmat!");
      setLocalReviews((prev) => [res.data!, ...prev]);
      setRvName('');
      setRvText('');
      setRvRating(5);
    } else {
      toast.error(res.error ?? 'Xatolik');
    }
  };

  const galleryImages = [product.image, ...(product.gallery ?? [])].filter(
    (v, i, a) => a.indexOf(v) === i,
  );

  return (
    <>
      <RecordRecent productId={product.id} />
      <SizeGuideModal
        open={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
      />
      <TryOnModal
        open={tryOnOpen}
        onClose={() => setTryOnOpen(false)}
        productImage={product.image}
        productName={product.name}
      />
      <section className="bg-white py-8 md:py-12">
        <div className="container-main grid md:grid-cols-2 gap-8 md:gap-12">
          {/* Images */}
          <div>
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-bg-warm">
              <Image
                src={gallery}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
              {product.badge && (
                <div className="absolute top-4 left-4">
                  {product.badge === 'sale' && (
                    <span className="badge-sale">-{product.discount ?? 10}%</span>
                  )}
                  {product.badge === 'bestseller' && (
                    <span className="badge-bestseller">Bestseller</span>
                  )}
                  {product.badge === 'new' && (
                    <span className="badge-new">Yangi</span>
                  )}
                </div>
              )}
            </div>
            {galleryImages.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {galleryImages.map((src) => (
                  <button
                    key={src}
                    onClick={() => setGallery(src)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-colors ${
                      gallery === src ? 'border-brand' : 'border-transparent'
                    }`}
                  >
                    <Image src={src} alt="" fill className="object-cover" sizes="100px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-ink">
              {product.name}
            </h1>

            <div className="mt-3 flex items-center gap-3">
              <Stars rating={product.rating} />
              <span className="text-sm text-ink-muted">
                {product.rating.toFixed(1)} · {product.reviews} ta sharh
              </span>
            </div>

            <div className="mt-5 flex items-baseline gap-3">
              <span className="font-serif text-3xl font-bold text-brand">
                {formatPrice(product.price)} so&apos;m
              </span>
              {product.oldPrice && (
                <span className="text-lg text-ink-muted line-through">
                  {formatPrice(product.oldPrice)}
                </span>
              )}
            </div>

            <p className="mt-5 text-ink-muted leading-relaxed">
              {product.description}
            </p>

            {/* Colors */}
            <div className="mt-6">
              <p className="text-sm font-medium text-ink mb-2">
                Rang: <span className="text-ink-muted">{color}</span>
              </p>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-10 h-10 rounded-full transition-all ${
                      c === 'Oq' ? 'border border-rule' : ''
                    } ${
                      color === c
                        ? 'ring-2 ring-brand ring-offset-2'
                        : 'hover:ring-2 hover:ring-rule hover:ring-offset-1'
                    }`}
                    style={{ backgroundColor: COLOR_HEX[c] ?? '#ddd' }}
                    aria-label={c}
                    title={c}
                  />
                ))}
              </div>
            </div>

            {/* Sizes */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-ink">O&apos;lcham</p>
                <button
                  onClick={() => setSizeGuideOpen(true)}
                  className="text-xs text-brand hover:text-brand-dark font-medium flex items-center gap-1"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  O&apos;lcham qo&apos;llanmasi
                </button>
              </div>
              <div className="flex gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      size === s
                        ? 'bg-brand text-white'
                        : 'bg-bg-warm text-ink hover:bg-rule-light'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Virtual try-on */}
            <div className="mt-5">
              <button
                onClick={() => setTryOnOpen(true)}
                className="w-full bg-gradient-to-r from-brand to-brand-light text-white rounded-xl px-5 py-3 flex items-center justify-center gap-2 font-medium hover:opacity-95 transition-opacity"
              >
                <Sparkles className="w-5 h-5" />
                Virtual sinab ko&apos;rish
              </button>
            </div>

            {/* Quantity */}
            <div className="mt-6">
              <p className="text-sm font-medium text-ink mb-2">Miqdor</p>
              <div className="inline-flex items-center border border-rule rounded-xl">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="p-3 hover:text-brand"
                  aria-label="Kamaytirish"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-medium">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                  className="p-3 hover:text-brand"
                  aria-label="Oshirish"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-ink-muted mt-2">
                Omborda:{' '}
                {product.stock > 0 ? (
                  <span className="text-emerald-600 font-medium">
                    {product.stock} ta
                  </span>
                ) : (
                  <span className="text-red-500 font-medium">Tugagan</span>
                )}
              </p>
              {product.stock === 0 && (
                <div className="mt-3">
                  <StockAlertButton
                    productId={product.id}
                    productName={product.name}
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <button
                onClick={addToCart}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-5 h-5" />
                Savatga qo&apos;shish
              </button>
              <button
                onClick={buyNow}
                className="btn-outline flex-1 flex items-center justify-center gap-2"
              >
                Hoziroq xarid qilish
              </button>
              <button
                onClick={() => {
                  const added = wl.toggle(product.id);
                  toast.success(
                    added ? 'Sevimlilarga qoʻshildi' : 'Sevimlilardan oʻchirildi',
                  );
                }}
                className={`sm:w-14 h-14 rounded-xl border border-rule flex items-center justify-center transition-colors ${
                  liked ? 'text-red-500 border-red-200' : 'text-ink-muted hover:text-red-400'
                }`}
                aria-label="Sevimlilar"
              >
                <Heart className={`w-5 h-5 ${liked ? 'fill-red-500' : ''}`} />
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-rule-light">
              <ShareButtons title={product.name} />
            </div>

            {/* Perks */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-rule-light">
              <div className="flex items-start gap-3">
                <Truck className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-ink">Bepul yetkazish</p>
                  <p className="text-xs text-ink-muted">500k so&apos;mdan ortiq buyurtmalar</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-ink">Original kafolat</p>
                  <p className="text-xs text-ink-muted">100% tabiiy matolar</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <RotateCcw className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-ink">14 kun qaytarish</p>
                  <p className="text-xs text-ink-muted">Oson almashtirish</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="bg-bg-warm py-12 md:py-16">
        <div className="container-main grid md:grid-cols-3 gap-8">
          <div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-ink">
              Sharhlar ({localReviews.length})
            </h2>
            <form onSubmit={submitRv} className="mt-6 card p-5">
              <h3 className="font-medium mb-3">Fikr qoldiring</h3>
              <input
                value={rvName}
                onChange={(e) => setRvName(e.target.value)}
                placeholder="Ismingiz"
                className="w-full border border-rule rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                required
              />
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, i) => {
                  const v = i + 1;
                  return (
                    <button
                      type="button"
                      key={v}
                      onClick={() => setRvRating(v)}
                      className="p-1"
                      aria-label={`${v} yulduz`}
                    >
                      <Star
                        className={`w-5 h-5 ${
                          v <= rvRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-rule-light text-rule-light'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <textarea
                value={rvText}
                onChange={(e) => setRvText(e.target.value)}
                rows={3}
                placeholder="Mahsulot haqida fikringiz..."
                className="w-full border border-rule rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none"
                required
              />
              <button
                type="submit"
                disabled={rvLoading}
                className="btn-primary w-full text-sm disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {rvLoading && <Check className="w-4 h-4 animate-pulse" />}
                Yuborish
              </button>
            </form>
          </div>

          <div className="md:col-span-2 space-y-4">
            {localReviews.length === 0 && (
              <div className="card p-6 text-center text-ink-muted">
                Hali sharh yo&apos;q. Birinchi bo&apos;ling!
              </div>
            )}
            {localReviews.map((r) => (
              <div key={r.id} className="card p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand/15 text-brand flex items-center justify-center font-semibold">
                      {r.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-ink">{r.name}</p>
                      <Stars rating={r.rating} />
                    </div>
                  </div>
                  <span className="text-xs text-ink-muted">
                    {new Date(r.createdAt).toLocaleDateString('uz-UZ')}
                  </span>
                </div>
                <p className="text-ink-muted text-sm leading-relaxed">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="py-12 md:py-16">
          <div className="container-main">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-8">
              Shunga o&apos;xshash
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <RecentlyViewed excludeId={product.id} />
    </>
  );
}
