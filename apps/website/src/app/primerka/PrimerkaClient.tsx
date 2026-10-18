'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Download,
  Loader2,
  Sparkles,
  ShoppingBag,
  Heart,
  Check,
  RotateCcw,
  Camera,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import type { Product, ApiProductVariant } from '@/lib/types';
import { useCart } from '@/components/providers/CartProvider';
import { useWishlist } from '@/components/providers/WishlistProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { useFace } from '@/components/providers/FaceProvider';
import { formatPrice } from '@/lib/format';
import { FaceScanner } from './FaceScanner';

type TyingStyle = 'classical' | 'loose' | 'double';

const STYLES: {
  key: TyingStyle;
  label: string;
  description: string;
  iconPath: string;
}[] = [
  {
    key: 'classical',
    label: 'Klassik',
    description: "Yuzni to'liq qamrab turadi",
    iconPath: 'M 12 2 C 7 2 3 6 3 11 c 0 4 2 7 5 9 h 8 c 3 -2 5 -5 5 -9 c 0 -5 -4 -9 -9 -9 z',
  },
  {
    key: 'loose',
    label: 'Erkin',
    description: "Yon tomondan tushib turadi",
    iconPath: 'M 12 2 C 8 2 5 5 5 10 c 0 5 2 8 4 10 h 6 c -2 -2 -4 -5 -4 -10 c 0 -5 1 -8 1 -8 z',
  },
  {
    key: 'double',
    label: 'Ikki qavatli',
    description: "Qalin, zich o'rash",
    iconPath: 'M 12 2 C 7 2 3 6 3 11 c 0 4 2 7 5 9 h 8 c 3 -2 5 -5 5 -9 c 0 -3 -1 -5 -3 -7 c -1 -1 -2 -2 -3 -2 c -1 -1 -2 -2 -3 -2 z',
  },
];

interface FlatVariant extends ApiProductVariant {
  product: Product;
}

interface Props {
  scarves: Product[];
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  // Works for data: URLs AND for /images/* local URLs (fetched as blob)
  const res = await fetch(dataUrl);
  return res.blob();
}

export default function PrimerkaClient({ scarves }: Props) {
  const cart = useCart();
  const wl = useWishlist();
  const toast = useToast();
  const face = useFace();

  const variants = useMemo<FlatVariant[]>(
    () =>
      scarves.flatMap((p) =>
        (p.variants ?? []).map((v) => ({ ...v, product: p })),
      ),
    [scarves],
  );

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [tyingStyle, setTyingStyle] = useState<TyingStyle>('classical');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const resultUrlRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);

  const activeVariant = variants[selectedIdx];
  const activeProduct = activeVariant?.product;

  const compose = async () => {
    if (!face.faceUri || !activeVariant || !activeProduct) return;
    const reqId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    const started = Date.now();
    try {
      const faceBlob = await dataUrlToBlob(face.faceUri);
      const form = new FormData();
      form.append('face', faceBlob, 'face.jpg');
      form.append('style', tyingStyle);
      form.append('productId', activeProduct.id);
      form.append('variantId', activeVariant.id);
      if (activeVariant.colorHex) form.append('colorHex', activeVariant.colorHex);

      const res = await fetch('/api/tryon', { method: 'POST', body: form });
      if (reqId !== requestIdRef.current) return; // superseded
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      // Revoke previous
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = url;
      setResultUrl(url);
      setLatency(Date.now() - started);
    } catch (e) {
      if (reqId !== requestIdRef.current) return;
      const msg = e instanceof Error ? e.message : 'Try-on xatoligi';
      setError(msg);
      toast.error(msg);
    } finally {
      if (reqId === requestIdRef.current) setLoading(false);
    }
  };

  // Re-compose whenever variant, style, or face changes
  useEffect(() => {
    if (!face.isScanned || !activeVariant) return;
    compose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [face.faceUri, activeVariant?.id, tyingStyle, face.bodyType]);

  // Cleanup object URL on unmount
  useEffect(
    () => () => {
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    },
    [],
  );

  const download = () => {
    if (!resultUrl) return;
    const link = document.createElement('a');
    link.download = `hijob-primerka-${Date.now()}.jpg`;
    link.href = resultUrl;
    link.click();
    toast.success('Rasm yuklab olindi');
  };

  const addToCart = () => {
    if (!activeProduct) return;
    cart.addItem(activeProduct, {
      color: activeVariant.color,
      size: activeVariant.size,
    });
    toast.success(`"${activeProduct.name}" savatga qoʻshildi`);
  };

  const toggleLike = () => {
    if (!activeProduct) return;
    const added = wl.toggle(activeProduct.id);
    toast.success(added ? 'Sevimlilarga qoʻshildi' : 'Sevimlilardan oʻchirildi');
  };

  const liked = activeProduct ? wl.has(activeProduct.id) : false;

  if (!face.isHydrated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-[#948E7E]">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-[#1B1B14] text-[#F0EBDA] -mt-16 md:-mt-20 pt-20 md:pt-24">
      <div className="flex items-center justify-between px-5 py-3 max-w-3xl mx-auto">
        <Link
          href="/"
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-[#F0EBDA] hover:bg-white/15 transition-colors"
          aria-label="Orqaga"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="font-serif text-lg font-semibold text-[#D4B87A]">
          Primerka
        </h1>
        {face.isScanned ? (
          <button
            onClick={() => {
              face.clear();
              if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
              resultUrlRef.current = null;
              setResultUrl(null);
              toast.info('Avatar tozalandi');
            }}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-[#F0EBDA] hover:bg-white/15 transition-colors"
            aria-label="Qayta skaner"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-9 h-9" />
        )}
      </div>
      <div className="max-w-3xl mx-auto">{children}</div>
    </div>
  );

  if (!face.isScanned) {
    return (
      <Shell>
        <FaceScanner />
      </Shell>
    );
  }

  if (scarves.length === 0 || variants.length === 0) {
    return (
      <Shell>
        <div className="px-5 py-16 text-center">
          <Sparkles className="w-10 h-10 text-[#D4B87A] mx-auto" />
          <p className="mt-4 text-[#948E7E]">
            Hozirda ro&apos;mol katalogi bo&apos;sh. Keyinroq urinib ko&apos;ring.
          </p>
          <Link href="/katalog" className="btn-primary mt-6 inline-flex">
            Katalogga o&apos;tish
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="px-5 pb-6">
        {/* Avatar viewfinder */}
        <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-[#23231B] border border-white/10">
          {resultUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resultUrl}
              alt="Primerka natijasi"
              className="w-full h-full object-contain"
            />
          ) : (
            // Show the raw face while loading first result
            face.faceUri && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={face.faceUri}
                alt="Yuz"
                className="w-full h-full object-contain opacity-60"
              />
            )
          )}

          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm text-[#F0EBDA]">
              <Loader2 className="w-8 h-8 animate-spin text-[#D4B87A]" />
              <p className="mt-3 text-sm">AI primerka tayyorlanmoqda…</p>
              <p className="mt-1 text-xs text-[#948E7E]">
                Yuz landmarks aniqlanib ro&apos;mol joylashtirilmoqda
              </p>
            </div>
          )}

          {error && !loading && (
            <div className="absolute inset-x-4 bottom-4 bg-red-500/90 text-white rounded-xl p-3 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Overlay actions */}
          {resultUrl && !loading && (
            <div className="absolute top-3 right-3 flex gap-2">
              <button
                onClick={download}
                className="w-9 h-9 rounded-full bg-black/60 backdrop-blur text-white flex items-center justify-center hover:bg-black/80"
                aria-label="Yuklab olish"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/50 backdrop-blur rounded-full px-3 py-1.5">
            <Camera className="w-3.5 h-3.5 text-[#D4B87A]" />
            <span className="text-xs text-white">
              {face.bodyType === 'slim'
                ? "Ozg'in"
                : face.bodyType === 'full'
                  ? "To'la"
                  : "O'rtacha"}
            </span>
            {latency != null && (
              <span className="text-[10px] text-white/60 ml-1">
                {(latency / 1000).toFixed(1)}s
              </span>
            )}
          </div>
        </div>

        {/* Tying styles */}
        <div className="mt-6">
          <p className="text-xs uppercase tracking-wider text-[#948E7E] mb-3">
            O&apos;rash uslubi
          </p>
          <div className="grid grid-cols-3 gap-2">
            {STYLES.map((s) => {
              const active = tyingStyle === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setTyingStyle(s.key)}
                  className={`relative p-3 rounded-2xl border transition-all text-left ${
                    active
                      ? 'bg-[#D4B87A]/15 border-[#D4B87A]'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6 mb-2">
                    <path
                      d={s.iconPath}
                      fill="none"
                      stroke={active ? '#D4B87A' : '#948E7E'}
                      strokeWidth="1.5"
                    />
                  </svg>
                  <p
                    className={`text-xs font-medium ${
                      active ? 'text-[#D4B87A]' : 'text-[#F0EBDA]'
                    }`}
                  >
                    {s.label}
                  </p>
                  <p className="text-[10px] text-[#948E7E] mt-0.5 leading-tight">
                    {s.description}
                  </p>
                  {active && (
                    <Check className="absolute top-2 right-2 w-3.5 h-3.5 text-[#D4B87A]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active product + variants */}
        {activeProduct && activeVariant && (
          <div className="mt-6 bg-white/5 rounded-2xl border border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-[#23231B] shrink-0">
                <Image
                  src={activeVariant.images?.[0] || activeProduct.image}
                  alt={activeProduct.name}
                  fill
                  className="object-cover"
                  sizes="60px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#F0EBDA] line-clamp-1">
                  {activeProduct.name}
                </p>
                <p className="text-xs text-[#948E7E] mt-0.5">
                  {activeVariant.color}
                  {activeVariant.size ? ` · ${activeVariant.size}` : ''}
                </p>
                <p className="text-sm font-semibold text-[#D4B87A] mt-1">
                  {formatPrice(activeProduct.price)} so&apos;m
                </p>
              </div>
              <button
                onClick={toggleLike}
                className={`w-9 h-9 rounded-full bg-white/10 flex items-center justify-center transition-colors ${
                  liked ? 'text-red-400' : 'text-[#F0EBDA] hover:text-red-300'
                }`}
                aria-label="Sevimlilar"
              >
                <Heart className={`w-4 h-4 ${liked ? 'fill-red-400' : ''}`} />
              </button>
            </div>

            <div className="mt-4">
              <p className="text-[11px] uppercase tracking-wider text-[#948E7E] mb-2">
                Variantlar
              </p>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {variants.map((v, i) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedIdx(i)}
                    className={`relative w-10 h-10 rounded-full shrink-0 transition-all ${
                      i === selectedIdx
                        ? 'ring-2 ring-[#D4B87A] ring-offset-2 ring-offset-[#1B1B14]'
                        : ''
                    }`}
                    style={{ backgroundColor: v.colorHex }}
                    title={`${v.product.name} — ${v.color}`}
                    aria-label={`${v.product.name} — ${v.color}`}
                  />
                ))}
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={addToCart}
                className="flex-1 bg-[#D4B87A] text-[#1B1B14] rounded-xl px-5 py-3 flex items-center justify-center gap-2 font-medium hover:bg-[#D4B87A]/90 transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                Savatga
              </button>
              <Link
                href={`/mahsulot/${activeProduct.id}`}
                className="flex-1 border border-white/15 text-[#F0EBDA] rounded-xl px-5 py-3 flex items-center justify-center gap-2 font-medium hover:bg-white/5 transition-colors"
              >
                Batafsil
              </Link>
            </div>
          </div>
        )}

        <p className="mt-5 text-center text-xs text-[#948E7E]">
          AI face-fit (ml-face + ml-compositor) orqali tayyorlandi.
        </p>
      </div>
    </Shell>
  );
}
