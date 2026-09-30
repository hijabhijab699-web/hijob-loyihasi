'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface UploadedFile {
  url: string;
  key: string;
  size: number;
  name: string;
}

interface Props {
  value: string[]; // array of URLs
  onChange: (urls: string[]) => void;
  max?: number;
  multiple?: boolean;
  aspect?: 'square' | 'portrait' | 'auto';
  label?: string;
  hint?: string;
}

async function uploadFiles(files: File[]): Promise<UploadedFile[]> {
  const form = new FormData();
  for (const f of files) form.append('files', f, f.name);
  const res = await fetch('/api/upload', { method: 'POST', body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message ?? body?.error ?? `upload_failed_${res.status}`);
  }
  const data = await res.json();
  return data.files;
}

export function ImageUploader({
  value,
  onChange,
  max = 1,
  multiple = false,
  aspect = 'portrait',
  label,
  hint,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const remaining = max - value.length;
  const canAdd = remaining > 0;

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (list.length === 0) return;
      if (list.length > remaining) list.splice(remaining);

      setError(null);
      setUploading(true);
      try {
        const uploaded = await uploadFiles(list);
        onChange([...value, ...uploaded.map((u) => u.url)].slice(0, max));
      } catch (e: any) {
        setError(e?.message ?? 'Upload failed');
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = '';
      }
    },
    [value, onChange, max, remaining],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const removeAt = (idx: number) => onChange(value.filter((_, i) => i !== idx));

  const aspectClass =
    aspect === 'square' ? 'aspect-square' : aspect === 'portrait' ? 'aspect-[3/4]' : '';

  return (
    <div className="space-y-2">
      {label && (
        <div className="text-xs font-medium text-ink2 uppercase tracking-wider">{label}</div>
      )}
      <div
        className={clsx(
          'grid gap-3',
          multiple ? 'grid-cols-3' : 'grid-cols-1',
          !canAdd && 'grid-cols-3',
        )}
      >
        {value.map((url, idx) => (
          <div
            key={url}
            className={clsx(
              'relative rounded-xl overflow-hidden border border-rule bg-surface2 group',
              aspectClass,
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(idx)}
              className="absolute top-2 right-2 w-8 h-8 grid place-items-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={16} />
            </button>
          </div>
        ))}

        {canAdd && (
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={clsx(
              'relative rounded-xl border-2 border-dashed cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 p-4',
              aspectClass,
              dragOver
                ? 'border-gold bg-goldSoft/20'
                : 'border-rule hover:border-oliveDeep bg-surface2/40',
              uploading && 'pointer-events-none opacity-70',
            )}
          >
            <input
              ref={inputRef}
              type="file"
              multiple={multiple}
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
              disabled={uploading}
            />
            {uploading ? (
              <>
                <Loader2 size={22} className="animate-spin text-oliveDeep" />
                <div className="text-xs text-muted">Yuklanmoqda…</div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-goldSoft/40 grid place-items-center">
                  <Upload size={16} className="text-oliveDeep" />
                </div>
                <div className="text-sm text-ink text-center">
                  {value.length === 0 ? 'Rasm qo\'shish' : `Yana ${remaining}`}
                </div>
                <div className="text-xs text-muted text-center px-2">
                  JPG · PNG · WebP · ≤12 MB
                </div>
              </>
            )}
          </label>
        )}
      </div>

      {hint && !error && <div className="text-xs text-muted">{hint}</div>}
      {error && (
        <div className="text-xs text-danger flex items-center gap-1">
          <ImageIcon size={12} /> {error}
        </div>
      )}
    </div>
  );
}
