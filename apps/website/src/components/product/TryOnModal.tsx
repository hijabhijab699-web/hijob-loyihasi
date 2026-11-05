'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Download,
  Loader2,
  LogIn,
  RotateCcw,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import type { Product } from '@/lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
  product: Product;
  selectedColor: string;
  selectedSize: string;
}

// Real AI try-on — mirrors the mobile app's /tryon/faceswap flow:
// user picks a selfie, we POST it with the chosen variant id to the Nest
// backend via a Next proxy, and show the generated render. No overlay
// slider tricks; the backend does the actual mannequin face-swap.
export function TryOnModal({
  open,
  onClose,
  product,
  selectedColor,
  selectedSize,
}: Props) {
  const toast = useToast();
  const auth = useAuth();
  const [stage, setStage] = useState<'pick' | 'rendering' | 'done' | 'error'>('pick');
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const variant = product.variants?.find(
    (v) => v.color === selectedColor && v.size === selectedSize,
  ) ?? product.variants?.[0];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) return;
    setStage('pick');
    setPreview(null);
    setResult(null);
    setErrorMsg(null);
    abortRef.current?.abort();
  }, [open]);

  const reset = () => {
    abortRef.current?.abort();
    setStage('pick');
    setPreview(null);
    setResult(null);
    setErrorMsg(null);
  };

  const runFaceSwap = async (file: File) => {
    if (!auth.tokens?.accessToken) {
      setErrorMsg('Kirish talab qilinadi');
      setStage('error');
      return;
    }
    if (!variant) {
      setErrorMsg("Mahsulot variantlari topilmadi");
      setStage('error');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Faqat rasm faylini tanlang');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      toast.error('Rasm hajmi 12MB dan oshmasligi kerak');
      return;
    }

    setPreview(URL.createObjectURL(file));
    setStage('rendering');
    setErrorMsg(null);

    const form = new FormData();
    form.append('face', file);
    form.append('variantId', variant.id);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch('/api/tryon/faceswap', {
        method: 'POST',
        headers: { Authorization: `Bearer ${auth.tokens.accessToken}` },
        body: form,
        signal: ctrl.signal,
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.sessionId) {
        const code = body?.error ?? body?.message ?? `HTTP_${res.status}`;
        throw new Error(String(code));
      }
      // Pull the image through our own proxy so we don't leak the API host.
      setResult(`/api/tryon/preview/${encodeURIComponent(body.sessionId)}/image`);
      setStage('done');
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      const msg = e instanceof Error ? e.message : 'TRYON_FAILED';
      setErrorMsg(humanizeError(msg));
      setStage('error');
    }
  };

  const download = async () => {
    if (!result) return;
    try {
      const r = await fetch(result);
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tryon-${Date.now()}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Rasm yuklab olindi');
    } catch {
      toast.error("Yuklab bo'lmadi");
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-3xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-rule-light">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand text-white flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-semibold text-ink">
                Virtual sinab ko&apos;rish
              </h2>
              <p className="text-xs text-ink-muted">
                {product.name} — {selectedColor}
                {variant ? '' : ' (variant topilmadi)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-bg-warm text-ink-muted hover:text-ink flex items-center justify-center"
            aria-label="Yopish"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {!auth.hydrated ? (
            <div className="py-16 text-center text-ink-muted">
              <Loader2 className="w-6 h-6 animate-spin inline-block" />
            </div>
          ) : !auth.user ? (
            <SignInPrompt />
          ) : stage === 'pick' ? (
            <SelfiePicker onPick={runFaceSwap} />
          ) : stage === 'rendering' ? (
            <RenderingView preview={preview} />
          ) : stage === 'done' && result ? (
            <ResultView
              result={result}
              onRetry={reset}
              onDownload={download}
            />
          ) : stage === 'error' ? (
            <ErrorView message={errorMsg ?? 'Xatolik'} onRetry={reset} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SelfiePicker({ onPick }: { onPick: (f: File) => void }) {
  return (
    <>
      <label className="block cursor-pointer border-2 border-dashed border-rule rounded-2xl p-10 text-center hover:border-brand transition-colors">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPick(f);
          }}
        />
        <div className="w-16 h-16 rounded-full bg-brand/10 text-brand mx-auto flex items-center justify-center">
          <Upload className="w-8 h-8" />
        </div>
        <p className="mt-4 font-medium text-ink">Selfi rasm yuklang</p>
        <p className="mt-1 text-sm text-ink-muted max-w-sm mx-auto">
          Yuzingiz aniq ko&apos;rinadigan, yorug&apos; joyda tushgan oldinga qaragan
          rasm eng yaxshi natija beradi.
        </p>
      </label>
      <p className="mt-4 text-xs text-ink-muted text-center max-w-md mx-auto">
        Rasmingiz AI mannequin ustiga aqlli tarzda joylashtiriladi — mobile
        ilovadagi bilan bir xil algoritm. Natija 24 soat ichida avtomatik
        o&apos;chiriladi.
      </p>
    </>
  );
}

function RenderingView({ preview }: { preview: string | null }) {
  return (
    <div className="py-10 text-center">
      {preview && (
        <div className="relative w-40 h-40 mx-auto rounded-2xl overflow-hidden bg-bg-cream">
          <Image
            src={preview}
            alt=""
            fill
            className="object-cover opacity-80"
            unoptimized
          />
        </div>
      )}
      <Loader2 className="w-7 h-7 animate-spin inline-block mt-5 text-brand" />
      <p className="mt-3 font-medium text-ink">AI sizni mannequinga joylayapti…</p>
      <p className="text-sm text-ink-muted mt-1">
        Odatda 10–20 soniya oladi. Sahifani yopmang.
      </p>
    </div>
  );
}

function ResultView({
  result,
  onRetry,
  onDownload,
}: {
  result: string;
  onRetry: () => void;
  onDownload: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-bg-cream">
        <Image
          src={result}
          alt="Virtual sinab ko'rish natijasi"
          fill
          className="object-contain"
          unoptimized
          priority
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={onRetry}
          className="btn-outline flex-1 flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Boshqa rasm
        </button>
        <button
          onClick={onDownload}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Yuklab olish
        </button>
      </div>
    </div>
  );
}

function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="py-12 text-center">
      <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 mx-auto flex items-center justify-center">
        <Camera className="w-7 h-7" />
      </div>
      <p className="mt-4 font-medium text-ink">Yaratib bo&apos;lmadi</p>
      <p className="text-sm text-ink-muted mt-1 max-w-sm mx-auto">{message}</p>
      <button
        onClick={onRetry}
        className="btn-outline mt-5 inline-flex items-center gap-2"
      >
        <RotateCcw className="w-4 h-4" />
        Qayta urinish
      </button>
    </div>
  );
}

function SignInPrompt() {
  return (
    <div className="py-12 text-center">
      <div className="w-14 h-14 rounded-full bg-brand/10 text-brand mx-auto flex items-center justify-center">
        <LogIn className="w-7 h-7" />
      </div>
      <p className="mt-4 font-medium text-ink">Avval kiring</p>
      <p className="text-sm text-ink-muted mt-1 max-w-sm mx-auto">
        Virtual sinab ko&apos;rish uchun akauntingizga kiring. Selfi faqat shu
        buyurtma uchun ishlatiladi.
      </p>
      <Link
        href="/kirish"
        className="btn-primary mt-5 inline-flex items-center gap-2"
      >
        <LogIn className="w-4 h-4" />
        Kirish
      </Link>
    </div>
  );
}

function humanizeError(code: string): string {
  const map: Record<string, string> = {
    FACE_IMAGE_REQUIRED: 'Selfi yuboring',
    VARIANT_ID_REQUIRED: 'Mahsulot varianti tanlanmagan',
    UNAUTHORIZED: 'Avval akauntingizga kiring',
    NO_MANNEQUIN_FACE: 'Mahsulot uchun mannequin rasm topilmadi',
    FACESWAP_UNPROCESSABLE: "Rasm yuzni aniq ko'rsatmadi — boshqa selfi bilan urinib ko'ring",
    IMAGE_EXPIRED: 'Natija muddati tugadi — qayta urinib ko&apos;ring',
  };
  return map[code] ?? code;
}
