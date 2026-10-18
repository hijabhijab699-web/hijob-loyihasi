'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Upload, Loader2, X, Sparkles, Check } from 'lucide-react';
import { useFace, type BodyType } from '@/components/providers/FaceProvider';
import { useToast } from '@/components/providers/ToastProvider';

interface Props {
  onDone?: () => void;
}

type Step = 'intro' | 'camera' | 'body' | 'ready';

const BODY_OPTIONS: {
  key: BodyType;
  label: string;
  sub: string;
  image: string;
}[] = [
  { key: 'slim', label: "Ozg'in", sub: 'Nozik', image: '/images/body-slim.webp' },
  {
    key: 'medium',
    label: "O'rtacha",
    sub: 'Normal',
    image: '/images/body-medium.webp',
  },
  { key: 'full', label: "To'la", sub: "Biroz to'la", image: '/images/body-full.webp' },
];

export function FaceScanner({ onDone }: Props) {
  const toast = useToast();
  const { setFace, setBody, faceUri } = useFace();

  const [step, setStep] = useState<Step>(faceUri ? 'body' : 'intro');
  const [bodyType, setBodyTypeLocal] = useState<BodyType>('medium');
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [localFaceUri, setLocalFaceUri] = useState<string | null>(faceUri);
  const [animating, setAnimating] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Camera lifecycle
  useEffect(() => {
    if (step !== 'camera') return;
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 960 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
          setCameraReady(true);
        }
      } catch (e) {
        toast.error(
          "Kamera ruxsat berilmadi. Fayl yuklash yoki demo'dan foydalaning.",
        );
        setStep('intro');
      }
    })();
    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setCameraReady(false);
    };
  }, [step, toast]);

  const captureFromVideo = () => {
    const v = videoRef.current;
    if (!v) return;
    setCapturing(true);
    try {
      const w = v.videoWidth;
      const h = v.videoHeight;
      if (!w || !h) {
        toast.error("Kamera hali tayyor emas");
        return;
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      // Mirror horizontally so result matches what the user sees
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(v, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setLocalFaceUri(dataUrl);
      setFace(dataUrl);
      setStep('body');
    } finally {
      setCapturing(false);
    }
  };

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Faqat rasm faylini tanlang');
      return;
    }
    const url = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => reject(new Error('read failed'));
      r.readAsDataURL(file);
    }).catch(() => null);
    if (!url) {
      toast.error("Rasmni yuklab bo'lmadi");
      return;
    }
    setLocalFaceUri(url);
    setFace(url);
    setStep('body');
  };

  const useDemo = () => {
    const url = '/images/demo-face.jpg';
    setLocalFaceUri(url);
    setFace(url);
    setStep('body');
  };

  const confirmBody = () => {
    setStep('ready');
    setAnimating(true);
    setTimeout(() => setAnimating(false), 700);
  };

  const finish = () => {
    setBody(bodyType);
    onDone?.();
  };

  // ======= STEP: INTRO =======
  if (step === 'intro') {
    return (
      <div className="relative min-h-[70vh] flex flex-col items-center justify-center px-5 py-10 text-center">
        <div className="w-20 h-20 rounded-full bg-[#D4B87A]/15 flex items-center justify-center">
          <Sparkles className="w-10 h-10 text-[#D4B87A]" />
        </div>
        <h2 className="mt-5 font-serif text-2xl md:text-3xl font-bold text-[#F0EBDA]">
          Avatar yarataylik
        </h2>
        <p className="mt-3 text-sm text-[#948E7E] max-w-md">
          Boshida yuzingizni skaner qilamiz, keyin manekenga joylashtirib
          istalgan ro&apos;molni sinab ko&apos;rasiz.
        </p>

        <div className="mt-8 w-full max-w-xs space-y-3">
          <button
            onClick={() => setStep('camera')}
            className="w-full bg-[#D4B87A] text-[#1B1B14] rounded-xl px-6 py-3.5 font-medium flex items-center justify-center gap-2 hover:bg-[#D4B87A]/90 transition-colors"
          >
            <Camera className="w-5 h-5" />
            Yuz skaneri (kamera)
          </button>
          <label className="w-full bg-white/5 border border-white/10 text-[#F0EBDA] rounded-xl px-6 py-3.5 font-medium flex items-center justify-center gap-2 cursor-pointer hover:bg-white/10 transition-colors">
            <Upload className="w-5 h-5" />
            Rasm yuklash
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
              }}
            />
          </label>
          <button
            onClick={useDemo}
            className="w-full text-sm text-[#948E7E] hover:text-[#F0EBDA] py-2"
          >
            yoki demo yuz bilan davom etish →
          </button>
        </div>

        <div className="mt-10 flex items-center gap-2 text-xs text-[#948E7E]">
          <Check className="w-3.5 h-3.5" />
          Rasmlar faqat brauzeringizda saqlanadi
        </div>
      </div>
    );
  }

  // ======= STEP: CAMERA =======
  if (step === 'camera') {
    return (
      <div className="relative aspect-[3/4] max-w-md mx-auto rounded-3xl overflow-hidden bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />
        {/* Elliptical face frame */}
        <svg
          viewBox="0 0 260 320"
          className="absolute inset-0 w-full h-full pointer-events-none"
          preserveAspectRatio="xMidYMid meet"
        >
          <ellipse
            cx="130"
            cy="160"
            rx="110"
            ry="140"
            fill="none"
            stroke="#D4B87A"
            strokeWidth="3"
            strokeDasharray="8 6"
          />
        </svg>

        {/* Close */}
        <button
          onClick={() => setStep('intro')}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
          aria-label="Yopish"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Hint */}
        <p className="absolute top-4 right-4 left-16 text-center text-xs text-white/90 bg-black/50 rounded-full px-3 py-1.5">
          Yuzingizni ramkaga joylashtiring
        </p>

        {/* Capture */}
        <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center">
          <button
            onClick={captureFromVideo}
            disabled={!cameraReady || capturing}
            className="w-16 h-16 rounded-full bg-[#D4B87A] hover:bg-[#D4B87A]/90 flex items-center justify-center shadow-lg disabled:opacity-50"
            aria-label="Suratga olish"
          >
            {capturing ? (
              <Loader2 className="w-7 h-7 animate-spin text-[#1B1B14]" />
            ) : (
              <div className="w-14 h-14 rounded-full border-4 border-[#1B1B14]" />
            )}
          </button>
        </div>

        {!cameraReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        )}
      </div>
    );
  }

  // ======= STEP: BODY PICKER =======
  if (step === 'body') {
    return (
      <div className="px-5 py-6">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-6 h-1 rounded-full bg-[#D4B87A]" />
          <div className="w-6 h-1 rounded-full bg-[#D4B87A]" />
          <div className="w-6 h-1 rounded-full bg-white/15" />
          <div className="w-6 h-1 rounded-full bg-white/15" />
        </div>
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#F0EBDA] text-center">
          Qomatingiz
        </h2>
        <p className="mt-2 text-sm text-[#948E7E] text-center">
          Mos manekenni tanlang
        </p>

        <div className="mt-6 grid grid-cols-3 gap-3 max-w-md mx-auto">
          {BODY_OPTIONS.map((b) => {
            const active = bodyType === b.key;
            return (
              <button
                key={b.key}
                onClick={() => setBodyTypeLocal(b.key)}
                className={`relative aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all ${
                  active
                    ? 'border-[#D4B87A] bg-[#D4B87A]/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <img
                  src={b.image}
                  alt={b.label}
                  className="w-full h-full object-contain mix-blend-screen opacity-80"
                  loading="lazy"
                />
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                  <p
                    className={`text-xs font-medium ${
                      active ? 'text-[#D4B87A]' : 'text-[#F0EBDA]'
                    }`}
                  >
                    {b.label}
                  </p>
                  <p className="text-[10px] text-[#948E7E]">{b.sub}</p>
                </div>
                {active && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#D4B87A] flex items-center justify-center">
                    <Check className="w-3 h-3 text-[#1B1B14]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-8 max-w-md mx-auto space-y-3">
          <button
            onClick={confirmBody}
            className="w-full bg-[#D4B87A] text-[#1B1B14] rounded-xl px-6 py-3.5 font-medium flex items-center justify-center gap-2 hover:bg-[#D4B87A]/90 transition-colors"
          >
            Davom etish
          </button>
          <button
            onClick={() => setStep('intro')}
            className="w-full text-sm text-[#948E7E] hover:text-[#F0EBDA] py-2"
          >
            ← Yuzni qayta skaner qilish
          </button>
        </div>
      </div>
    );
  }

  // ======= STEP: READY =======
  const faceSrc = localFaceUri || '/images/demo-face.jpg';
  // Always use the clean cutout for the avatar reveal (slim/medium/full
  // thumbnails bake-in a checkered background).
  const bodySrc = '/images/body-woman.webp';

  return (
    <div className="relative px-5 py-10 flex flex-col items-center text-center min-h-[70vh]">
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className="w-6 h-1 rounded-full bg-[#D4B87A]" />
        <div className="w-6 h-1 rounded-full bg-[#D4B87A]" />
        <div className="w-6 h-1 rounded-full bg-[#D4B87A]" />
        <div className="w-6 h-1 rounded-full bg-[#D4B87A]" />
      </div>

      <div className="w-10 h-10 rounded-full bg-[#D4B87A] flex items-center justify-center">
        <Check className="w-5 h-5 text-[#1B1B14]" />
      </div>
      <h2 className="mt-4 font-serif text-2xl md:text-3xl font-bold text-[#F0EBDA]">
        Avatar tayyor!
      </h2>
      <p className="mt-2 text-sm text-[#948E7E] max-w-md">
        Yuzingiz manekenga joylashtirildi. Endi istalgan ro&apos;molni sinab
        ko&apos;ring.
      </p>

      <div className="mt-8 relative w-48 h-64">
        {/* Rotating halo */}
        <div
          className="absolute inset-0 rounded-full border border-[#D4B87A]/30"
          style={{
            animation: 'spin 18s linear infinite',
          }}
        />
        {/* Body silhouette */}
        <img
          src={bodySrc}
          alt="Avatar"
          className={`absolute inset-0 w-full h-full object-contain mix-blend-screen opacity-85 ${
            animating ? 'transition-transform duration-700 scale-95' : ''
          }`}
        />
        {/* Face */}
        <div
          className={`absolute left-1/2 top-6 w-16 h-16 -translate-x-1/2 rounded-full overflow-hidden border-2 border-[#D4B87A] shadow-lg transition-all ${
            animating ? 'opacity-0 scale-50' : 'opacity-100 scale-100'
          }`}
          style={{
            transitionDuration: '700ms',
          }}
        >
          <img
            src={faceSrc}
            alt="Yuz"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <div className="mt-10 max-w-md mx-auto w-full space-y-3">
        <button
          onClick={finish}
          className="w-full bg-[#D4B87A] text-[#1B1B14] rounded-xl px-6 py-3.5 font-medium flex items-center justify-center gap-2 hover:bg-[#D4B87A]/90 transition-colors"
        >
          Primerkani boshlash
        </button>
        <button
          onClick={() => setStep('body')}
          className="w-full text-sm text-[#948E7E] hover:text-[#F0EBDA] py-2"
        >
          ← Qomatni o&apos;zgartirish
        </button>
      </div>
    </div>
  );
}
