'use client';

/**
 * Base mannequins status panel for Dev AI.
 *
 * The 9 base mannequins (3 body types × 3 height bands) are now generated
 * end-to-end by the Chrome extension: popup button "⚙ 9 ta base maneken"
 * sends the grid prompt to ChatGPT, waits for the 3×3 composite, slices it
 * into 9 cells and uploads each to its sizeKey. This panel just shows the
 * current slot status and keeps the prompt visible for reference.
 */
import { useState } from 'react';
import { Check, Upload, X } from 'lucide-react';
import type { MannequinTemplate } from '@/lib/api';

const PROMPT = [
  'Ultra-realistic composite photo containing NINE (9) full-body modest-fashion female mannequins',
  'arranged in a 3×3 grid (3 rows × 3 columns), SAME baseline per row, SAME lighting.',
  '',
  'ROWS = body type (top → bottom):',
  '  • Row 1 — SLIM: narrow shoulders and waist, overall thin frame',
  '  • Row 2 — MEDIUM: average healthy proportions',
  '  • Row 3 — FULL: wider hips, fuller waist, plus-size figure',
  '',
  'COLUMNS = height band (left → right, within each row):',
  '  • Col 1 — SHORT (~150-160 cm)',
  '  • Col 2 — MID   (~161-170 cm)',
  '  • Col 3 — TALL  (~171-185 cm)',
  '',
  'FACE REQUIREMENTS (CRITICAL — enables downstream face-swap):',
  '  • Each mannequin has a SIMPLE NEUTRAL FEMALE FACE — soft neutral features, closed mouth, calm neutral expression, eyes open and looking straight at the camera.',
  '  • SAME face across all 9 mannequins (same identity reference, same age ~25, light-tan skin tone, dark hair hidden by hijab area).',
  '  • Face must be clearly visible, well-lit, no sunglasses, no mask, no hair over the eyes.',
  '',
  'OUTFIT:',
  '  • Fully MODEST: plain SOFT BEIGE / CREAM long-sleeve ankle-length dress (abaya-like simple gown in warm beige #e8dcc6 colour, NOT white) — long sleeves to the wrists, closed high neckline, hem reaching the ankles. No bare skin anywhere.',
  '  • Plain BEIGE closed flat shoes on the feet — NO bare feet.',
  '  • The dress colour must be visibly DIFFERENT from the (transparent/white) background so the whole figure stays visible when the background is removed.',
  '  • NO hijab or head covering on the base mannequin (that is added separately per product).',
  '',
  'LAYOUT:',
  '  • Full head-to-toe visible in every cell (face, body, dress, shoes).',
  '  • Front view, arms slightly away from body, hands relaxed.',
  '  • Equal horizontal gap between columns, equal vertical gap between rows.',
  '  • Each cell has the same canvas size (so a 3×3 grid cut is clean).',
  '  • SOLID MATTE DARK BACKGROUND — fill the entire canvas with a solid flat dark colour #1b1b14 (very dark olive-brown, near-black). FULLY OPAQUE, no transparency, no alpha channel. Same solid colour behind every mannequin, no gradient, no texture, no shadow pattern on the floor.',
  '  • NO text, NO labels, NO rulers, NO watermarks drawn into the image.',
  '  • Output ONE OPAQUE image (JPEG or PNG without alpha), 1:1 or 4:5 aspect ratio. Do NOT use transparency.',
].join('\n');

export function BaseMannequinsPanel({ items }: { items: MannequinTemplate[] }) {
  const [copied, setCopied] = useState(false);
  const uploaded = items.filter((i) => i.uploaded).length;

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="card p-5 mb-6">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-ink mb-0.5">Base manekinlar bazasi</h2>
          <p className="text-xs text-muted max-w-2xl">
            Chrome extension popup'ida{' '}
            <span className="font-mono text-ink/80">⚙ 9 ta base maneken</span>{' '}
            tugmasini bosing — ChatGPT'ga grid prompt yuboradi, 3×3 kompozitni oladi, 9 ga qirqib avto-yuklaydi.
          </p>
        </div>
        <div className="text-xs text-muted font-mono">
          <span className={uploaded === items.length ? 'text-success' : 'text-warning'}>
            {uploaded}/{items.length}
          </span>
          {' '}yuklangan
        </div>
      </div>

      {/* Reference prompt — handy if you want to re-run manually in ChatGPT */}
      <details className="rounded-lg bg-surface2 border border-rule p-3 mb-4">
        <summary className="cursor-pointer flex items-center justify-between gap-3">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-muted">
            ChatGPT prompt (ma'lumot uchun)
          </span>
          <button
            onClick={(e) => { e.preventDefault(); copyPrompt(); }}
            className="text-xs text-oliveDeep hover:underline inline-flex items-center gap-1"
          >
            {copied ? <Check size={11} /> : <Upload size={11} />}
            {copied ? 'Ko\'chirildi' : 'Ko\'chirish'}
          </button>
        </summary>
        <pre className="text-[11px] text-ink/80 whitespace-pre-wrap font-mono mt-3">{PROMPT}</pre>
      </details>

      {/* Per-size status grid — 3×3 matching the composite layout */}
      <div className="grid grid-cols-3 gap-2 max-w-xl">
        {items.map((it) => (
          <div
            key={it.sizeKey}
            className={`rounded-lg border p-2 text-center ${
              it.uploaded ? 'border-success/40 bg-success/5' : 'border-rule bg-surface2'
            }`}
          >
            <div className="text-[10px] font-mono uppercase text-muted">{it.sizeKey}</div>
            <div className="text-[10px] text-ink mt-0.5 leading-tight">{it.label}</div>
            <div className="text-[9px] text-muted leading-tight">{it.minHeightCm}-{it.maxHeightCm}cm</div>
            <div className="mt-1">
              {it.uploaded ? (
                <span className="text-success inline-flex items-center gap-0.5 text-[10px]">
                  <Check size={10} /> ok
                </span>
              ) : (
                <span className="text-warning inline-flex items-center gap-0.5 text-[10px]">
                  <X size={10} /> yo'q
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
