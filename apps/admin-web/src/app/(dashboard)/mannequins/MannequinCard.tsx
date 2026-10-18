'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, Upload, X } from 'lucide-react';
import type { MannequinTemplate } from '@/lib/api';

export function MannequinCard({ item }: { item: MannequinTemplate }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (file: File) => {
    setBusy(true);
    try {
      const form = new FormData();
      form.append('file', file, file.name);
      const res = await fetch(`/api/mannequins/${item.sizeKey}/upload`, { method: 'POST', body: form });
      if (!res.ok) throw new Error(await res.text());
      router.refresh();
    } catch (e: any) {
      alert('Yuklanmadi: ' + (e?.message ?? 'xato'));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const label = `${item.sizeKey.toUpperCase()} — ${item.label}, ~${item.minHeightCm}-${item.maxHeightCm}cm`;

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold text-ink">{item.label}</div>
          <div className="text-xs text-muted">
            <span className="font-mono uppercase">{item.sizeKey}</span>
            {' · '}{item.minHeightCm}-{item.maxHeightCm} cm
          </div>
        </div>
        {item.uploaded ? (
          <span className="text-xs rounded-pill px-2 py-0.5 bg-success/10 text-success inline-flex items-center gap-1">
            <Check size={10} /> Yuklangan
          </span>
        ) : (
          <span className="text-xs rounded-pill px-2 py-0.5 bg-warning/10 text-warning inline-flex items-center gap-1">
            <X size={10} /> Yuklanmagan
          </span>
        )}
      </div>

      <div className="rounded-lg border border-rule overflow-hidden bg-surface2 aspect-[4/5]">
        {item.imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={item.imageUrl} alt={item.label} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted text-xs">
            Hali rasm yo'q
          </div>
        )}
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-wider font-semibold text-muted mb-1">Prompt uchun yorliq</div>
        <input
          readOnly
          value={label}
          className="input font-mono text-[11px]"
          onFocus={(e) => e.currentTarget.select()}
        />
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
        }}
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        className="btn-primary w-full justify-center"
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
        {busy ? 'Yuklanmoqda…' : item.uploaded ? 'Qayta yuklash' : 'Yuklash'}
      </button>
    </div>
  );
}
