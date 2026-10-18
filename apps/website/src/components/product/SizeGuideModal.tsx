'use client';

import { useEffect } from 'react';
import { X, Ruler } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

const SIZE_TABLE = [
  { size: 'S', length: '85 × 85 sm', wrap: "Yengil o'rash", head: '54–55' },
  { size: 'M', length: '90 × 90 sm', wrap: "Standart o'rash", head: '55–57' },
  { size: 'L', length: '95 × 95 sm', wrap: "Bemalol o'rash", head: '57–59' },
  { size: 'XL', length: '110 × 110 sm', wrap: "To'liq qamrash", head: '59–61' },
];

const SHAWL_TABLE = [
  { size: 'S', length: '170 × 65 sm', note: "Yoz uchun" },
  { size: 'M', length: '180 × 70 sm', note: "Universal" },
  { size: 'L', length: '190 × 75 sm', note: "Kuzgi" },
  { size: 'XL', length: '200 × 80 sm', note: "Qishki" },
];

export function SizeGuideModal({ open, onClose }: Props) {
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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-rule-light">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
              <Ruler className="w-5 h-5" />
            </div>
            <h2 className="font-serif text-xl font-semibold text-ink">
              O&apos;lcham qo&apos;llanmasi
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-bg-warm text-ink-muted hover:text-ink flex items-center justify-center"
            aria-label="Yopish"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 md:p-6 space-y-6">
          <div>
            <h3 className="font-serif text-lg font-semibold text-ink mb-3">
              Kvadrat ro&apos;mol
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-ink-muted bg-bg-warm">
                  <tr>
                    <th className="px-3 py-2">O&apos;lcham</th>
                    <th className="px-3 py-2">Hajm</th>
                    <th className="px-3 py-2">Tavsif</th>
                    <th className="px-3 py-2">Bosh (sm)</th>
                  </tr>
                </thead>
                <tbody>
                  {SIZE_TABLE.map((r) => (
                    <tr key={r.size} className="border-t border-rule-light">
                      <td className="px-3 py-2 font-semibold text-brand">
                        {r.size}
                      </td>
                      <td className="px-3 py-2">{r.length}</td>
                      <td className="px-3 py-2 text-ink-muted">{r.wrap}</td>
                      <td className="px-3 py-2">{r.head}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="font-serif text-lg font-semibold text-ink mb-3">
              To&apos;rtburchak (shoyi/shifon/pashmina)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-ink-muted bg-bg-warm">
                  <tr>
                    <th className="px-3 py-2">O&apos;lcham</th>
                    <th className="px-3 py-2">Hajm</th>
                    <th className="px-3 py-2">Mavsum</th>
                  </tr>
                </thead>
                <tbody>
                  {SHAWL_TABLE.map((r) => (
                    <tr key={r.size} className="border-t border-rule-light">
                      <td className="px-3 py-2 font-semibold text-brand">
                        {r.size}
                      </td>
                      <td className="px-3 py-2">{r.length}</td>
                      <td className="px-3 py-2 text-ink-muted">{r.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-bg-warm rounded-xl p-4 text-sm text-ink-muted">
            <p className="font-medium text-ink mb-1">O&apos;lcham tanlashda yordam kerakmi?</p>
            <p>
              AI maslahatchimizdan so&apos;rang — u sizning ehtiyojingizga mos
              o&apos;lchamni tavsiya qiladi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
