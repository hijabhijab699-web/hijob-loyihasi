'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Phone,
  Mail,
  MapPin,
  Instagram,
  Send,
  Loader2,
  Truck,
  Wallet,
  RotateCcw,
} from 'lucide-react';
import { sendContact } from '@/lib/api-client';
import { useToast } from '@/components/providers/ToastProvider';
import { FaqAccordion } from '@/components/FaqAccordion';

export default function ContactPage() {
  const toast = useToast();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    const res = await sendContact(form);
    setLoading(false);
    if (res.ok && res.data) {
      toast.success(res.data.message);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } else {
      toast.error(res.error ?? "Yuborishda xatolik");
    }
  };

  return (
    <>
      <section className="bg-bg-cream pt-10 pb-12">
        <div className="container-main">
          <nav className="text-sm text-ink-muted mb-4">
            <Link href="/" className="hover:text-brand">
              Bosh sahifa
            </Link>
            <span className="mx-2">/</span>
            <span className="text-ink font-medium">Aloqa</span>
          </nav>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-ink">
            Biz bilan bog&apos;laning
          </h1>
          <p className="mt-3 text-ink-muted max-w-xl">
            Savol, taklif yoki buyurtma bo&apos;yicha biz bilan har qanday
            qulay usulda aloqaga chiqishingiz mumkin.
          </p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container-main grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <InfoRow
              Icon={Phone}
              title="Telefon"
              value="+998 90 123 45 67"
              href="tel:+998901234567"
              hint="Dush–Shan 9:00 — 20:00"
            />
            <InfoRow
              Icon={Mail}
              title="Email"
              value="info@hijob.uz"
              href="mailto:info@hijob.uz"
              hint="24 soat ichida javob"
            />
            <InfoRow
              Icon={MapPin}
              title="Manzil"
              value="Toshkent, O'zbekiston"
              hint="Chilonzor tumani"
            />
            <div className="card p-5 flex items-center justify-between">
              <div>
                <p className="font-medium text-ink">Ijtimoiy tarmoqlar</p>
                <p className="text-xs text-ink-muted mt-1">
                  Yangiliklardan birinchi bo&apos;lib xabardor bo&apos;ling
                </p>
              </div>
              <div className="flex gap-2">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center hover:bg-brand hover:text-white transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href="https://t.me"
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center hover:bg-brand hover:text-white transition-colors"
                  aria-label="Telegram"
                >
                  <Send className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          <form
            onSubmit={submit}
            className="lg:col-span-3 card p-6 md:p-8 space-y-4"
          >
            <h2 className="font-serif text-2xl font-semibold text-ink">
              Xabar yuboring
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ism *"
                className="w-full border border-rule rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Email *"
                className="w-full border border-rule rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Telefon"
                className="w-full border border-rule rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
              <input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Mavzu"
                className="w-full border border-rule rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            </div>
            <textarea
              required
              rows={5}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Xabaringiz... *"
              className="w-full border border-rule rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Yuborish
            </button>
          </form>
        </div>
      </section>

      <section id="yetkazish" className="bg-bg-warm py-12 md:py-16">
        <div className="container-main">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-center mb-10">
            Ko&apos;p so&apos;raladigan savollar
          </h2>
          <div className="grid md:grid-cols-3 gap-5 mb-12">
            <FaqCard
              Icon={Truck}
              title="Yetkazib berish"
              id="yetkazish"
              text="Toshkent bo'ylab 24 soat ichida yetkazib beramiz. Boshqa viloyatlarga 2–4 kun. 500 000 so'mdan ortiq buyurtmaga bepul."
            />
            <FaqCard
              Icon={Wallet}
              title="To'lov usullari"
              id="tolov"
              text="Naqd (yetkazishda), Humo/Uzcard plastik kartalari, Click va Payme orqali onlayn to'lov qila olasiz."
            />
            <FaqCard
              Icon={RotateCcw}
              title="Qaytarish"
              id="qaytarish"
              text="14 kun ichida mahsulotni almashtirish yoki pulni qaytarish mumkin. Mahsulot ishlatilmagan va yorlig'i joyida bo'lishi kerak."
            />
          </div>
          <FaqAccordion />
        </div>
      </section>
    </>
  );
}

function InfoRow({
  Icon,
  title,
  value,
  href,
  hint,
}: {
  Icon: typeof Phone;
  title: string;
  value: string;
  href?: string;
  hint?: string;
}) {
  const content = (
    <div className="card p-5 flex items-start gap-4 hover-lift">
      <div className="w-11 h-11 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="font-medium text-ink">{title}</p>
        <p className="text-ink mt-0.5 truncate">{value}</p>
        {hint && <p className="text-xs text-ink-muted mt-1">{hint}</p>}
      </div>
    </div>
  );
  if (href) return <a href={href}>{content}</a>;
  return content;
}

function FaqCard({
  Icon,
  title,
  text,
  id,
}: {
  Icon: typeof Truck;
  title: string;
  text: string;
  id?: string;
}) {
  return (
    <div id={id} className="card p-6">
      <div className="w-11 h-11 rounded-xl bg-brand text-white flex items-center justify-center mb-4">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="font-serif text-xl font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm text-ink-muted leading-relaxed">{text}</p>
    </div>
  );
}
