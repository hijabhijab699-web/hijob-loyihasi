'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  Check,
  ChevronRight,
  Heart,
  Loader2,
  LogIn,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Sun,
  Upload,
  X,
} from 'lucide-react';
import type { Product } from '@/lib/types';
import { useAuth } from '@/components/providers/AuthProvider';
import { useCart } from '@/components/providers/CartProvider';
import { useWishlist } from '@/components/providers/WishlistProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { formatPrice } from '@/lib/format';

// Mirrors apps/mobile/app/(tabs)/tryon.tsx. The web lives in a smaller
// window but the flow is identical: sign in → selfie + body/height
// onboarding → backend queues face-swapped mannequins for every variant
// → Primerka hero shows the user's own render for the active variant,
// lighting + colour chips mutate the view. No more canvas overlays; the
// AI does the real work.

type BodyType = 'slim' | 'medium' | 'full';

interface MyRenders {
  hasSelfie: boolean;
  bodyType: BodyType | null;
  heightCm: number | null;
  renders: Array<{ variantId: string; url: string }>;
  pending: number;
  running: number;
  failed: number;
}

interface Props {
  products: Product[];
}

const LIGHTING = [
  { label: "Yorug'lik", overlay: null as string | null },
  { label: 'Yorqin', overlay: 'rgba(255,248,235,0.18)' },
  { label: 'Iliq', overlay: 'rgba(255,196,120,0.16)' },
  { label: 'Kechki', overlay: 'rgba(20,14,8,0.28)' },
] as const;

const BODY_LABEL: Record<BodyType, string> = {
  slim: "Ozg'in",
  medium: "O'rtacha",
  full: "To'la",
};

export default function PrimerkaClient({ products }: Props) {
  const auth = useAuth();
  const cart = useCart();
  const wl = useWishlist();
  const toast = useToast();

  // Pulled from /api/tryon/my-renders — tells us whether onboarding is
  // done and which variants have finished rendering.
  const [status, setStatus] = useState<MyRenders | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  const fetchStatus = async () => {
    if (!auth.tokens?.accessToken) {
      setStatus(null);
      setStatusLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/tryon/my-renders', {
        headers: { Authorization: `Bearer ${auth.tokens.accessToken}` },
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus(await res.json());
    } catch {
      setStatus({
        hasSelfie: false,
        bodyType: null,
        heightCm: null,
        renders: [],
        pending: 0,
        running: 0,
        failed: 0,
      });
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    if (!auth.hydrated) return;
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.hydrated, auth.tokens?.accessToken]);

  // Poll while the backend queue is still working so finished mannequins
  // show up without a manual refresh — same 4 s cadence the mobile tab uses.
  useEffect(() => {
    if (!status) return;
    if (status.pending === 0 && status.running === 0) return;
    const t = setTimeout(fetchStatus, 4000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  if (!auth.hydrated || statusLoading) {
    return <Spinner />;
  }

  if (!auth.user) {
    return <SignInScreen />;
  }

  if (!status?.hasSelfie) {
    return (
      <Onboarding
        initialBodyType={status?.bodyType ?? 'medium'}
        initialHeightCm={status?.heightCm ?? 165}
        onDone={fetchStatus}
      />
    );
  }

  return (
    <PrimerkaMain
      status={status}
      products={products}
      onReset={async () => {
        await fetch('/api/tryon/reset', {
          method: 'POST',
          headers: { Authorization: `Bearer ${auth.tokens!.accessToken}` },
        });
        toast.success("Yuzingiz tozalandi");
        fetchStatus();
      }}
      onEnqueue={async (productId) => {
        await fetch(`/api/tryon/enqueue-product/${productId}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${auth.tokens!.accessToken}` },
        }).catch(() => {});
      }}
      onAddToCart={(product, color, size) => {
        cart.addItem(product, { color, size });
        toast.success(`"${product.name}" savatga qo'shildi`);
      }}
      onWishToggle={(product) => {
        const added = wl.toggle(product.id);
        toast.success(added ? "Sevimlilarga qo'shildi" : "Sevimlilardan o'chirildi");
      }}
      isWished={(id) => wl.has(id)}
    />
  );
}

// ─── Main Primerka view ────────────────────────────────────────────

function PrimerkaMain({
  status,
  products,
  onReset,
  onEnqueue,
  onAddToCart,
  onWishToggle,
  isWished,
}: {
  status: MyRenders;
  products: Product[];
  onReset: () => Promise<void> | void;
  onEnqueue: (productId: string) => Promise<void> | void;
  onAddToCart: (p: Product, color: string, size: string) => void;
  onWishToggle: (p: Product) => void;
  isWished: (id: string) => boolean;
}) {
  const renderByVariant = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of status.renders) m.set(r.variantId, r.url);
    return m;
  }, [status.renders]);

  // Colour chips drawn from every variant across every product.
  const colorChips = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of products) {
      for (const v of p.variants ?? []) {
        if (v.color && !seen.has(v.color)) seen.set(v.color, v.colorHex);
      }
    }
    return [...seen.entries()].map(([name, hex]) => ({ name, hex }));
  }, [products]);
  const [colorFilter, setColorFilter] = useState<string | null>(null);
  useEffect(() => {
    if (colorFilter && !colorChips.some((c) => c.name === colorFilter)) {
      setColorFilter(null);
    }
  }, [colorFilter, colorChips]);
  const visible = useMemo(
    () =>
      colorFilter
        ? products.filter((p) => p.variants?.some((v) => v.color === colorFilter))
        : products,
    [products, colorFilter],
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = visible.find((p) => p.id === selectedId) ?? visible[0] ?? null;

  // Enqueue a face-swap render for the currently-selected product if the
  // backend doesn't already have one. Belt-and-suspenders, mirrors the
  // mobile enqueueProduct call from the Primerka add flow.
  const enqueuedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!selected) return;
    if (enqueuedRef.current.has(selected.id)) return;
    const hasRender = selected.variants?.some((v) => renderByVariant.has(v.id));
    if (!hasRender) {
      enqueuedRef.current.add(selected.id);
      onEnqueue(selected.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  const selectedVariant =
    selected?.variants?.find((v) => v.color === colorFilter) ??
    selected?.variants?.[0] ??
    null;

  const [lightIdx, setLightIdx] = useState(0);
  const lighting = LIGHTING[lightIdx];

  const hero = useMemo(() => {
    if (!selected) return null;
    const colourVariant =
      selected.variants?.find((v) => v.color === colorFilter) ?? null;
    const colourRender = colourVariant
      ? renderByVariant.get(colourVariant.id)
      : null;
    if (colourRender) return { url: colourRender, contain: true };
    for (const v of selected.variants ?? []) {
      const u = renderByVariant.get(v.id);
      if (u) return { url: u, contain: true };
    }
    return selected.image ? { url: selected.image, contain: true } : null;
  }, [selected, colorFilter, renderByVariant]);

  const queueWorking = status.pending + status.running > 0;
  const noRendersYet = status.renders.length === 0 && queueWorking;

  return (
    <main className="min-h-screen bg-bg-warm pb-16">
      {/* Decorative header strip — brand serif + jasmine tucked into the
          corner, matches the mobile Primerka header. */}
      <section className="relative overflow-hidden bg-gradient-to-b from-bg-cream to-bg-warm pt-10 pb-6">
        <Image
          src="/images/decor-jasmine.webp"
          alt=""
          aria-hidden
          width={220}
          height={150}
          className="pointer-events-none absolute -top-2 right-0 w-40 md:w-56 opacity-80 -rotate-6"
          priority
        />
        <div className="container-main relative">
          <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-brand">
            Xush kelibsiz
          </p>
          <h1 className="mt-1 font-serif text-3xl md:text-4xl font-semibold text-ink-dark flex items-baseline gap-2">
            Virtual
            <span className="italic text-brand">Primerka</span>
          </h1>
          <p className="mt-2 text-sm text-ink-muted max-w-md">
            O&apos;zingizni mahsulotda ko&apos;ring — AI mannequin yuzingizni oladi.
          </p>
        </div>
      </section>

      {/* Colour chips — scrolls horizontally when there are many colours. */}
      {colorChips.length >= 2 && (
        <section className="container-main mt-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            <Chip
              label="Hammasi"
              active={!colorFilter}
              onClick={() => setColorFilter(null)}
            />
            {colorChips.map((c) => (
              <Chip
                key={c.name}
                label={c.name}
                dot={c.hex}
                active={colorFilter === c.name}
                onClick={() =>
                  setColorFilter(colorFilter === c.name ? null : c.name)
                }
              />
            ))}
          </div>
        </section>
      )}

      {/* Hero card */}
      <section className="container-main mt-4">
        <div className="relative w-full max-w-xl mx-auto aspect-[3/4] rounded-3xl overflow-hidden shadow-xl border border-rule-light">
          {/* Fitting-room backdrop — visible in both framings so the zoom
              reads as a boutique shot, not a floating cutout. */}
          <Image
            src="/images/fitting-room-marble.webp"
            alt=""
            fill
            aria-hidden
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 600px"
            priority
          />
          {hero ? (
            <Image
              src={hero.url}
              alt={selected?.name ?? ''}
              fill
              className="object-contain relative"
              sizes="(max-width: 768px) 100vw, 600px"
              priority
              unoptimized={hero.url.startsWith('http')}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/50 text-white px-5 py-4 rounded-2xl text-center max-w-xs">
                <Sparkles className="w-6 h-6 mx-auto text-accent-light" />
                <p className="mt-2 text-sm">
                  {colorFilter ? "Bu rangda mahsulot yo'q" : "Mahsulot topilmadi"}
                </p>
              </div>
            </div>
          )}
          {lighting.overlay && (
            <div
              className="pointer-events-none absolute inset-0"
              style={{ backgroundColor: lighting.overlay }}
            />
          )}

          {/* Side actions — refresh selfie + lighting toggle */}
          <div className="absolute top-4 right-4 flex flex-col gap-3">
            <SideAction
              icon={<Camera className="w-4 h-4" />}
              label="Yuzni yangilash"
              onClick={onReset}
            />
            <SideAction
              icon={<Sun className="w-4 h-4" />}
              label={lighting.label}
              onClick={() => setLightIdx((i) => (i + 1) % LIGHTING.length)}
            />
          </div>

          {/* "Still cooking" badge — shows while the queue is working and
              nothing's done yet. Disappears as soon as a first render lands. */}
          {noRendersYet && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-ink-dark/85 text-accent-light px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              AI yuzingizni manekenga qo&apos;yyapti…
            </div>
          )}

          {/* Title + fit */}
          {selected && (
            <Link
              href={`/mahsulot/${selected.id}`}
              className="absolute left-4 bottom-4 max-w-[60%] bg-ink-dark/60 backdrop-blur text-white rounded-xl px-3 py-2 hover:bg-ink-dark/75 transition-colors"
            >
              <p className="text-xs font-semibold line-clamp-1">{selected.name}</p>
              <p className="text-[10px] opacity-80 mt-0.5">
                {status.bodyType ? BODY_LABEL[status.bodyType] : "O'rtacha"} ·{' '}
                {status.heightCm ?? '—'} sm uchun
              </p>
            </Link>
          )}
        </div>
      </section>

      {/* Product strip */}
      <section className="container-main mt-6">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-3">
          {visible.map((p) => (
            <ProductThumb
              key={p.id}
              product={p}
              colorFilter={colorFilter}
              active={p.id === selected?.id}
              renderByVariant={renderByVariant}
              onClick={() => setSelectedId(p.id)}
            />
          ))}
        </div>
      </section>

      {/* Add to cart CTA */}
      {selected && selectedVariant && (
        <section className="container-main mt-5 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <button
            onClick={() =>
              onAddToCart(selected, selectedVariant.color, selectedVariant.size)
            }
            className="btn-primary flex items-center justify-center gap-2 py-3.5"
          >
            <ShoppingBag className="w-4 h-4" />
            Savatga qo&apos;shish · {formatPrice(selected.price)} so&apos;m
          </button>
          <button
            onClick={() => onWishToggle(selected)}
            className={`btn-outline flex items-center justify-center gap-2 ${
              isWished(selected.id) ? 'text-red-500 border-red-200' : ''
            }`}
          >
            <Heart
              className={`w-4 h-4 ${isWished(selected.id) ? 'fill-red-500' : ''}`}
            />
          </button>
          <Link
            href={`/mahsulot/${selected.id}`}
            className="btn-outline flex items-center justify-center"
          >
            Batafsil
          </Link>
        </section>
      )}

      {status.failed > 0 && (
        <p className="container-main mt-4 text-xs text-ink-muted text-center">
          {status.failed} ta render muvaffaqiyatsiz tugadi — yuzni yangilab ko&apos;ring.
        </p>
      )}
    </main>
  );
}

// ─── Onboarding (selfie + body + height) ───────────────────────────

function Onboarding({
  initialBodyType,
  initialHeightCm,
  onDone,
}: {
  initialBodyType: BodyType;
  initialHeightCm: number;
  onDone: () => void;
}) {
  const auth = useAuth();
  const toast = useToast();
  const [step, setStep] = useState<'body' | 'height' | 'face'>('body');
  const [bodyType, setBodyType] = useState<BodyType>(initialBodyType);
  const [heightCm, setHeightCm] = useState<number>(initialHeightCm);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!selfie || !auth.tokens?.accessToken) return;
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('face', selfie);
      form.append('bodyType', bodyType);
      form.append('heightCm', String(heightCm));
      const res = await fetch('/api/tryon/prepare', {
        method: 'POST',
        headers: { Authorization: `Bearer ${auth.tokens.accessToken}` },
        body: form,
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? body?.message ?? `HTTP_${res.status}`);
      toast.success("Yuzingiz saqlandi — mannequinlar tayyorlanmoqda");
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Yuklab bo'lmadi");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-bg-warm pb-20">
      <section className="container-main pt-10 max-w-xl mx-auto">
        <p className="text-[11px] tracking-[0.3em] uppercase text-brand font-semibold">
          Primerka
        </p>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-ink-dark">
          Avval o&apos;zingizni qisqacha
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Uchta sodda qadam — AI mannequinni sizga moslashi uchun.
        </p>

        <StepIndicator current={step} />

        {step === 'body' && (
          <BodyStep
            bodyType={bodyType}
            setBodyType={setBodyType}
            onNext={() => setStep('height')}
          />
        )}
        {step === 'height' && (
          <HeightStep
            heightCm={heightCm}
            setHeightCm={setHeightCm}
            onBack={() => setStep('body')}
            onNext={() => setStep('face')}
          />
        )}
        {step === 'face' && (
          <FaceStep
            selfie={selfie}
            preview={preview}
            onPick={(f) => {
              setSelfie(f);
              setPreview(URL.createObjectURL(f));
            }}
            onClear={() => {
              setSelfie(null);
              setPreview(null);
            }}
            onBack={() => setStep('height')}
            onSubmit={submit}
            submitting={submitting}
          />
        )}
      </section>
    </main>
  );
}

function StepIndicator({ current }: { current: 'body' | 'height' | 'face' }) {
  const order: Array<'body' | 'height' | 'face'> = ['body', 'height', 'face'];
  const idx = order.indexOf(current);
  return (
    <div className="mt-6 flex items-center gap-2">
      {order.map((s, i) => (
        <div
          key={s}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            i <= idx ? 'bg-brand' : 'bg-rule-light'
          }`}
        />
      ))}
    </div>
  );
}

function BodyStep({
  bodyType,
  setBodyType,
  onNext,
}: {
  bodyType: BodyType;
  setBodyType: (b: BodyType) => void;
  onNext: () => void;
}) {
  const options: Array<{ key: BodyType; label: string; image: string }> = [
    { key: 'slim', label: "Ozg'in", image: '/images/body-slim.webp' },
    { key: 'medium', label: "O'rtacha", image: '/images/body-medium.webp' },
    { key: 'full', label: "To'la", image: '/images/body-full.webp' },
  ];
  return (
    <div className="mt-8">
      <p className="text-sm font-medium text-ink mb-3">Tana tipingiz</p>
      <div className="grid grid-cols-3 gap-3">
        {options.map((o) => {
          const active = bodyType === o.key;
          return (
            <button
              key={o.key}
              onClick={() => setBodyType(o.key)}
              className={`relative rounded-2xl border-2 transition-all overflow-hidden text-left bg-white ${
                active
                  ? 'border-brand ring-2 ring-brand/30'
                  : 'border-rule-light hover:border-brand/40'
              }`}
            >
              <div className="relative aspect-[3/4] bg-bg-cream">
                <Image
                  src={o.image}
                  alt={o.label}
                  fill
                  className="object-contain"
                  sizes="150px"
                />
                {active && (
                  <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
              <p className="py-2 text-center text-sm font-medium text-ink">
                {o.label}
              </p>
            </button>
          );
        })}
      </div>
      <button
        onClick={onNext}
        className="btn-primary w-full mt-8 py-3.5 flex items-center justify-center gap-2"
      >
        Keyingisi
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function HeightStep({
  heightCm,
  setHeightCm,
  onBack,
  onNext,
}: {
  heightCm: number;
  setHeightCm: (v: number) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mt-8">
      <p className="text-sm font-medium text-ink mb-3">Bo&apos;yingiz</p>
      <div className="bg-white border border-rule-light rounded-2xl p-6 text-center">
        <p className="font-serif text-5xl font-semibold text-brand">
          {heightCm}
          <span className="text-2xl text-ink-muted ml-1">sm</span>
        </p>
        <input
          type="range"
          min={140}
          max={200}
          step={1}
          value={heightCm}
          onChange={(e) => setHeightCm(Number(e.target.value))}
          className="w-full mt-5 accent-brand"
        />
        <div className="mt-2 flex justify-between text-xs text-ink-muted">
          <span>140</span>
          <span>170</span>
          <span>200</span>
        </div>
      </div>
      <div className="mt-8 flex gap-2">
        <button onClick={onBack} className="btn-outline flex-1 py-3.5">
          Orqaga
        </button>
        <button
          onClick={onNext}
          className="btn-primary flex-[2] py-3.5 flex items-center justify-center gap-2"
        >
          Keyingisi
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function FaceStep({
  selfie,
  preview,
  onPick,
  onClear,
  onBack,
  onSubmit,
  submitting,
}: {
  selfie: File | null;
  preview: string | null;
  onPick: (f: File) => void;
  onClear: () => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <div className="mt-8">
      <p className="text-sm font-medium text-ink mb-3">Selfi rasm</p>
      {preview ? (
        <div className="relative w-48 h-48 mx-auto rounded-full overflow-hidden border-4 border-brand/20">
          <Image src={preview} alt="selfi" fill className="object-cover" unoptimized />
          <button
            onClick={onClear}
            className="absolute top-1 right-1 w-7 h-7 rounded-full bg-ink-dark/70 text-white flex items-center justify-center"
            aria-label="O'chirish"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <label className="block cursor-pointer border-2 border-dashed border-rule rounded-2xl p-10 text-center hover:border-brand transition-colors bg-white">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPick(f);
            }}
          />
          <div className="w-14 h-14 rounded-full bg-brand/10 text-brand mx-auto flex items-center justify-center">
            <Upload className="w-7 h-7" />
          </div>
          <p className="mt-3 font-medium text-ink">Selfi yuklang</p>
          <p className="mt-1 text-xs text-ink-muted max-w-sm mx-auto">
            Yorug&apos; joyda, oldinga qaragan, yuzingiz aniq ko&apos;ringan rasm
            eng yaxshi natija beradi.
          </p>
        </label>
      )}
      <div className="mt-8 flex gap-2">
        <button
          onClick={onBack}
          disabled={submitting}
          className="btn-outline flex-1 py-3.5"
        >
          Orqaga
        </button>
        <button
          onClick={onSubmit}
          disabled={!selfie || submitting}
          className="btn-primary flex-[2] py-3.5 flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Primerka&apos;ni boshlash
        </button>
      </div>
      <p className="mt-4 text-[11px] text-ink-muted text-center max-w-sm mx-auto">
        Rasmingiz faqat sizning AI mannequinlaringizni yaratish uchun ishlatiladi.
      </p>
    </div>
  );
}

// ─── Shared UI ─────────────────────────────────────────────────────

function SignInScreen() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center bg-bg-warm">
      <div className="text-center max-w-sm px-6">
        <div className="w-16 h-16 rounded-2xl bg-brand/10 text-brand mx-auto flex items-center justify-center">
          <Sparkles className="w-8 h-8" />
        </div>
        <h1 className="mt-4 font-serif text-2xl font-semibold text-ink">
          Primerka uchun kiring
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Virtual sinab ko&apos;rishga akauntingiz kerak. Selfi va o&apos;lchamlar
          faqat sizga tegishli.
        </p>
        <Link href="/kirish" className="btn-primary mt-6 inline-flex gap-2">
          <LogIn className="w-4 h-4" />
          Kirish
        </Link>
      </div>
    </main>
  );
}

function Spinner() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center text-ink-muted">
      <Loader2 className="w-6 h-6 animate-spin" />
    </main>
  );
}

function Chip({
  label,
  dot,
  active,
  onClick,
}: {
  label: string;
  dot?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-10 px-4 rounded-full inline-flex items-center gap-2 text-sm font-medium whitespace-nowrap transition-colors ${
        active
          ? 'bg-brand text-white'
          : 'bg-white text-ink border border-rule-light hover:border-brand/50'
      }`}
    >
      {dot && !active && (
        <span
          className="w-2.5 h-2.5 rounded-full border border-black/10"
          style={{ backgroundColor: dot }}
        />
      )}
      {label}
    </button>
  );
}

function SideAction({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void | Promise<void>;
}) {
  return (
    <button
      onClick={onClick}
      className="w-16 py-2 rounded-2xl bg-ink-dark/60 backdrop-blur text-white text-[10px] font-medium leading-tight flex flex-col items-center gap-1 hover:bg-ink-dark/75 transition-colors"
    >
      {icon}
      <span className="text-center px-1">{label}</span>
    </button>
  );
}

function ProductThumb({
  product,
  colorFilter,
  active,
  renderByVariant,
  onClick,
}: {
  product: Product;
  colorFilter: string | null;
  active: boolean;
  renderByVariant: Map<string, string>;
  onClick: () => void;
}) {
  const variant =
    product.variants?.find((v) => v.color === colorFilter) ??
    product.variants?.[0];
  const render = variant ? renderByVariant.get(variant.id) : undefined;
  const thumb = render ?? variant?.images?.[0] ?? product.image;
  return (
    <button
      onClick={onClick}
      className={`relative w-24 aspect-[3/4] rounded-xl overflow-hidden shrink-0 border-2 transition-colors ${
        active ? 'border-brand' : 'border-transparent'
      }`}
    >
      <Image
        src="/images/fitting-room-marble.webp"
        alt=""
        fill
        aria-hidden
        className="object-cover"
        sizes="100px"
      />
      {thumb && (
        <Image
          src={thumb}
          alt={product.name}
          fill
          className="object-contain relative"
          sizes="100px"
          unoptimized={thumb.startsWith('http')}
        />
      )}
    </button>
  );
}
