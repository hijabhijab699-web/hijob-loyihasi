'use client';

import { useEffect, useRef, useState } from 'react';
import { submitDressMannequin, getLatestStyleJob, type StyleJob } from '@/lib/api';
import { Loader2, Sparkles, AlertTriangle, Check } from 'lucide-react';

const STYLE_OPTIONS: Array<{ value: 'classical' | 'loose' | 'double'; label: string }> = [
  { value: 'classical', label: 'Klassik' },
  { value: 'loose', label: 'Yumshoq' },
  { value: 'double', label: 'Ikki qavat' },
];

interface Props {
  productId: string;
  initialJob: StyleJob | null;
}

export function DressMannequinForm({ productId, initialJob }: Props) {
  const [mannequinUrl, setMannequinUrl] = useState('');
  const [hijabUrl, setHijabUrl] = useState('');
  const [tyingStyle, setTyingStyle] = useState<'classical' | 'loose' | 'double'>('classical');
  const [colorHex, setColorHex] = useState('#8A8D5B');
  const [submitting, setSubmitting] = useState(false);
  const [job, setJob] = useState<StyleJob | null>(initialJob);
  const [error, setError] = useState<string | null>(null);

  // Poll for status updates while a job is in flight. Stops once the job
  // settles into done / failed so we don't hammer the API forever.
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    const active = job && (job.status === 'pending' || job.status === 'running');
    if (!active) {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      return;
    }
    if (pollRef.current) return;
    pollRef.current = setInterval(async () => {
      try {
        const next = await getLatestStyleJob(productId);
        if (next) setJob(next);
      } catch {
        // transient — the next tick retries.
      }
    }, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [productId, job?.status, job?.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!mannequinUrl.trim() || !hijabUrl.trim()) {
      setError('Mannequin va hijob URL kiriting');
      return;
    }
    setSubmitting(true);
    try {
      const created = await submitDressMannequin(productId, {
        mannequinUrl: mannequinUrl.trim(),
        hijabUrl: hijabUrl.trim(),
        tyingStyle,
        colorHex,
      });
      setJob(created);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Yuborishda xato';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card p-6 space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-oliveDeep flex items-center gap-2">
          <Sparkles size={20} /> Mannequin&apos;ga kiyintir
        </h2>
        <p className="text-sm text-muted mt-1">
          Standart manekin rasmi va hijob yorlig&apos;ini bering. Fon ishchi uni biriktirib,
          natijani katalogdagi &quot;styledImageUrl&quot; sifatida saqlaydi.
        </p>
      </div>

      {job && <StatusChip job={job} />}

      <form onSubmit={submit} className="space-y-4">
        <Field
          label="Manekin rasmi URL"
          value={mannequinUrl}
          onChange={setMannequinUrl}
          placeholder="https://… .jpg"
        />
        <Field
          label="Hijob rasmi URL"
          value={hijabUrl}
          onChange={setHijabUrl}
          placeholder="https://… .png"
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
              Bog&apos;lash uslubi
            </label>
            <select
              value={tyingStyle}
              onChange={(e) => setTyingStyle(e.target.value as typeof tyingStyle)}
              className="input w-full"
            >
              {STYLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
              Asosiy rang
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                className="w-10 h-10 rounded border border-rule cursor-pointer"
              />
              <input
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                className="input flex-1 font-mono text-sm"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-sm text-danger bg-danger/10 rounded-lg p-3">
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || (job?.status === 'running' || job?.status === 'pending')}
          className="btn-gold w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          Navbatga yuborish
        </button>
      </form>
    </div>
  );
}

function StatusChip({ job }: { job: StyleJob }) {
  const config: Record<
    StyleJob['status'],
    { bg: string; text: string; icon: React.ReactNode; label: string }
  > = {
    pending: {
      bg: 'bg-warning/10',
      text: 'text-warning',
      icon: <Loader2 size={16} className="animate-spin" />,
      label: 'Navbatda…',
    },
    running: {
      bg: 'bg-gold/10',
      text: 'text-gold',
      icon: <Loader2 size={16} className="animate-spin" />,
      label: 'Jarayonda — AI mannequin\'ga kiyintiryapti',
    },
    done: {
      bg: 'bg-success/10',
      text: 'text-success',
      icon: <Check size={16} />,
      label: 'Tayyor — katalogga qo\'yildi',
    },
    failed: {
      bg: 'bg-danger/10',
      text: 'text-danger',
      icon: <AlertTriangle size={16} />,
      label: 'Xato',
    },
  };
  const c = config[job.status];
  return (
    <div className={`rounded-lg ${c.bg} p-3 space-y-2`}>
      <div className={`flex items-center gap-2 text-sm font-medium ${c.text}`}>
        {c.icon}
        <span>{c.label}</span>
      </div>
      {job.errorMessage && (
        <div className="text-xs text-danger/80 font-mono bg-black/5 rounded p-2">
          {job.errorMessage}
        </div>
      )}
      {job.status === 'done' && job.resultUrl && (
        <div className="flex items-start gap-3 pt-2">
          <div className="w-28 h-28 rounded-lg overflow-hidden border border-rule bg-surface2 flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={job.resultUrl} alt="Styled mannequin" className="w-full h-full object-cover" />
          </div>
          <div className="text-xs text-muted font-mono break-all pt-1">{job.resultUrl}</div>
        </div>
      )}
      <div className="text-[11px] text-muted">
        {new Date(job.createdAt).toLocaleString()} · urinishlar: {job.attempts}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input w-full"
      />
    </div>
  );
}
