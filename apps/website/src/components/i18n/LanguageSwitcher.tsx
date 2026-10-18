'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Globe } from 'lucide-react';
import { useLocale } from './LocaleProvider';
import { LOCALES } from './dict';

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [open]);

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 transition-colors ${
          compact
            ? 'p-2 text-ink-muted hover:text-brand'
            : 'px-3 py-1.5 rounded-lg text-sm text-ink hover:bg-bg-warm'
        }`}
        aria-label="Tilni tanlash"
      >
        {compact ? (
          <>
            <Globe className="w-5 h-5" />
            <span className="text-xs font-medium uppercase">{current.code}</span>
          </>
        ) : (
          <>
            <span className="text-base leading-none">{current.flag}</span>
            <span className="text-sm font-medium">{current.code.toUpperCase()}</span>
          </>
        )}
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 w-44 bg-white border border-rule rounded-xl shadow-lg py-1 z-50">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLocale(l.code);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm transition-colors ${
                l.code === locale
                  ? 'text-brand font-medium bg-bg-warm'
                  : 'text-ink hover:bg-bg-cream'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-base leading-none">{l.flag}</span>
                {l.label}
              </span>
              {l.code === locale && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
