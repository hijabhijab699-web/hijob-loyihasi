'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Download, Loader2, Sparkles, Upload, X } from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';

interface Props {
  open: boolean;
  onClose: () => void;
  productImage: string;
  productName: string;
}

interface Overlay {
  x: number;
  y: number;
  scale: number;
  opacity: number;
}

const DEFAULT_OVERLAY: Overlay = {
  x: 0.5,
  y: 0.5,
  scale: 1,
  opacity: 0.9,
};

export function TryOnModal({ open, onClose, productImage, productName }: Props) {
  const toast = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [overlay, setOverlay] = useState<Overlay>(DEFAULT_OVERLAY);
  const [loading, setLoading] = useState(false);
  const scarfRef = useRef<HTMLImageElement | null>(null);

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
    if (!open) {
      setPhoto(null);
      setOverlay(DEFAULT_OVERLAY);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = productImage;
    img.onload = () => (scarfRef.current = img);
  }, [open, productImage]);

  useEffect(() => {
    if (!photo || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const maxW = 720;
    const scale = Math.min(1, maxW / photo.width);
    canvas.width = photo.width * scale;
    canvas.height = photo.height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(photo, 0, 0, canvas.width, canvas.height);

    const scarf = scarfRef.current;
    if (!scarf) return;
    const w = canvas.width * 0.75 * overlay.scale;
    const h = (w * scarf.height) / scarf.width;
    const cx = canvas.width * overlay.x;
    const cy = canvas.height * overlay.y;
    ctx.globalAlpha = overlay.opacity;
    ctx.drawImage(scarf, cx - w / 2, cy - h / 2, w, h);
    ctx.globalAlpha = 1;
  }, [photo, overlay]);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Faqat rasm faylini tanlang');
      return;
    }
    setLoading(true);
    try {
      const url = URL.createObjectURL(file);
      const img = new window.Image();
      img.src = url;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('image load error'));
      });
      setPhoto(img);
      setOverlay(DEFAULT_OVERLAY);
    } catch {
      toast.error("Rasmni yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `hijob-tryon-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success('Rasm yuklab olindi');
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
                {productName} ni rasmingizga qo&apos;ying
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

        <div className="flex-1 overflow-y-auto">
          {!photo ? (
            <label className="block cursor-pointer m-5 border-2 border-dashed border-rule rounded-2xl p-10 text-center hover:border-brand transition-colors">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <div className="w-16 h-16 rounded-full bg-brand/10 text-brand mx-auto flex items-center justify-center">
                {loading ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <Upload className="w-8 h-8" />
                )}
              </div>
              <p className="mt-4 font-medium text-ink">
                Rasm yuklang
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                O&apos;z selfiengizni tanlang — ro&apos;mol tasvir ustiga joylashtiriladi
              </p>
              <p className="mt-4 text-xs text-ink-muted">
                Fayllar faqat brauzeringizda ishlanadi — serverga yuborilmaydi.
              </p>
            </label>
          ) : (
            <div className="p-5 space-y-5">
              <div className="relative mx-auto bg-bg-warm rounded-2xl overflow-hidden">
                <canvas
                  ref={canvasRef}
                  className="w-full h-auto block mx-auto"
                />
              </div>

              <div className="space-y-3">
                <SliderRow
                  label="Gorizontal"
                  value={overlay.x}
                  min={0.2}
                  max={0.8}
                  step={0.01}
                  onChange={(v) => setOverlay({ ...overlay, x: v })}
                />
                <SliderRow
                  label="Vertikal"
                  value={overlay.y}
                  min={0.2}
                  max={0.8}
                  step={0.01}
                  onChange={(v) => setOverlay({ ...overlay, y: v })}
                />
                <SliderRow
                  label="Hajm"
                  value={overlay.scale}
                  min={0.4}
                  max={1.8}
                  step={0.01}
                  onChange={(v) => setOverlay({ ...overlay, scale: v })}
                />
                <SliderRow
                  label="Shaffoflik"
                  value={overlay.opacity}
                  min={0.3}
                  max={1}
                  step={0.01}
                  onChange={(v) => setOverlay({ ...overlay, opacity: v })}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <label className="btn-outline flex-1 flex items-center justify-center gap-2 cursor-pointer">
                  <Camera className="w-4 h-4" />
                  Boshqa rasm
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                    }}
                  />
                </label>
                <button
                  onClick={download}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Yuklab olish
                </button>
              </div>

              <p className="text-xs text-ink-muted text-center">
                Bu — teaser demo. Tez orada haqiqiy AI face-fit algoritmi
                ishga tushadi.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-xs text-ink-muted">{label}</span>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-brand"
      />
    </div>
  );
}
