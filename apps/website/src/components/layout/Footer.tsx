'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Phone, Mail, MapPin, Instagram, Send, Loader2 } from 'lucide-react';
import { subscribeNewsletter } from '@/lib/api-client';
import { useToast } from '@/components/providers/ToastProvider';

const footerLinks = {
  katalog: [
    { label: "Ipak ro'mollar", href: '/katalog?category=ipak' },
    { label: "Shoyi ro'mollar", href: '/katalog?category=shoyi' },
    { label: "Shifon ro'mollar", href: '/katalog?category=shifon' },
    { label: 'Pashmina', href: '/katalog?category=pashmina' },
    { label: 'Yangi kolleksiya', href: '/katalog?sort=newest' },
  ],
  kompaniya: [
    { label: 'AI Primerka', href: '/primerka' },
    { label: 'Aloqa', href: '/aloqa' },
  ],
  yordam: [
    { label: 'Yetkazib berish', href: '/aloqa#yetkazish' },
    { label: 'Qaytarish', href: '/aloqa#qaytarish' },
    { label: "To'lov usullari", href: '/aloqa#tolov' },
    { label: 'Buyurtmalarim', href: '/buyurtmalarim' },
  ],
};

export function Footer() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true);
    const res = await subscribeNewsletter(email.trim());
    setLoading(false);
    if (res.ok && res.data) {
      toast.success(res.data.message);
      setEmail('');
    } else {
      toast.error(res.error ?? "Xatolik yuz berdi");
    }
  };

  return (
    <footer className="bg-bg-dark text-white pb-24 md:pb-0">
      <div className="container-main py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Hijob"
                width={40}
                height={40}
                className="w-10 h-10 rounded-lg"
              />
              <span className="font-serif text-2xl font-bold text-white">
                Hijob
              </span>
            </Link>
            <p className="mt-4 text-sm text-white/60 leading-relaxed">
              Premium sifatli ro&apos;mollar va hijoblar. Har bir ayol uchun mukammal uslub.
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://t.me"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="Telegram"
              >
                <Send className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Katalog */}
          <div>
            <h4 className="font-sans text-sm font-semibold text-white mb-4">Katalog</h4>
            <ul className="space-y-3">
              {footerLinks.katalog.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-white/50 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kompaniya */}
          <div>
            <h4 className="font-sans text-sm font-semibold text-white mb-4">Kompaniya</h4>
            <ul className="space-y-3">
              {footerLinks.kompaniya.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-white/50 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Aloqa */}
          <div>
            <h4 className="font-sans text-sm font-semibold text-white mb-4">Aloqa</h4>
            <ul className="space-y-3">
              {footerLinks.yordam.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-white/50 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-2">
              <a href="tel:+998901234567" className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
                <Phone className="w-4 h-4 shrink-0" />
                <span>+998 90 123 45 67</span>
              </a>
              <a href="mailto:info@hijob.uz" className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
                <Mail className="w-4 h-4 shrink-0" />
                <span>info@hijob.uz</span>
              </a>
              <div className="flex items-center gap-2 text-sm text-white/50">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>Toshkent, Uzbekistan</span>
              </div>
            </div>

            <form onSubmit={subscribe} className="mt-6 flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="flex-1 bg-white/10 text-white placeholder:text-white/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-white/15 hover:bg-white/25 text-white rounded-lg px-3 flex items-center justify-center transition-colors disabled:opacity-60"
                aria-label="Obuna bo'lish"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} Hijob. Barcha huquqlar himoyalangan.
          </p>
          <div className="flex items-center gap-2 text-xs text-white/40">
            <span className="px-2 py-1 bg-white/10 rounded">Humo</span>
            <span className="px-2 py-1 bg-white/10 rounded">Uzcard</span>
            <span className="px-2 py-1 bg-white/10 rounded">Click</span>
            <span className="px-2 py-1 bg-white/10 rounded">Payme</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
