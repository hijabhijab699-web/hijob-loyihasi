'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface FaqItem {
  q: string;
  a: string;
}

const DEFAULT_ITEMS: FaqItem[] = [
  {
    q: "Yetkazib berish qancha vaqt oladi?",
    a: "Toshkent bo'ylab 24 soat ichida, boshqa viloyatlarga 2–4 kun ichida yetkazamiz. 500 000 so'mdan ortiq buyurtmaga bepul yetkazish qo'llaniladi.",
  },
  {
    q: "Qanday to'lov usullari mavjud?",
    a: "Naqd (yetkazishda), Humo/Uzcard plastik kartalari, Click va Payme — hammasi xavfsiz va shifrlangan.",
  },
  {
    q: "Mahsulotni qaytarish mumkinmi?",
    a: "Ha, 14 kun ichida mahsulotni almashtirish yoki pulni to'liq qaytarish mumkin. Mahsulot ishlatilmagan va yorlig'i joyida bo'lishi kerak.",
  },
  {
    q: "O'lcham qanday tanlanadi?",
    a: "Har bir mahsulot sahifasida o'lchamlar jadvali bor. Agar shubhada bo'lsangiz — AI maslahatchidan yoki operatorlardan so'rang.",
  },
  {
    q: "Mahsulot asliga qanchalik mos?",
    a: "Barcha ro'mollarimiz studiyada tabiiy nurda suratga olinadi. Monitorlar ranglarni bir oz boshqacha ko'rsatishi mumkin, lekin biz imkoni boricha haqqoniy tasvirga intilamiz.",
  },
  {
    q: "Promo-kodlarni qayerdan olish mumkin?",
    a: "Instagram va Telegram kanallarimizga obuna bo'ling, hamda newsletterga obuna bo'ling — barcha chegirmalar u yerda e'lon qilinadi.",
  },
];

export function FaqAccordion({ items = DEFAULT_ITEMS }: { items?: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-3 max-w-3xl mx-auto">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            className={`card overflow-hidden transition-colors ${
              isOpen ? 'ring-1 ring-brand/20' : ''
            }`}
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
              aria-expanded={isOpen}
            >
              <span className="font-medium text-ink text-base md:text-lg">
                {it.q}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-ink-muted shrink-0 transition-transform ${
                  isOpen ? 'rotate-180 text-brand' : ''
                }`}
              />
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-ink-muted leading-relaxed text-sm md:text-base">
                  {it.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
