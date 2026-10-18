'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useLocale } from '@/components/i18n/LocaleProvider';

export function HeroSection() {
  const { t } = useLocale();
  return (
    <section className="bg-bg-cream">
      <div className="container-main py-12 md:py-20">
        <div className="flex flex-col-reverse md:flex-row items-center gap-10 md:gap-16">
          <div className="flex-1 text-center md:text-left animate-fade-in-up">
            <h1 className="font-serif text-5xl md:text-6xl font-bold text-ink leading-tight">
              {t.hero.title1} <br className="hidden md:block" />
              {t.hero.title2}
            </h1>
            <p className="mt-6 text-lg text-ink-muted max-w-lg mx-auto md:mx-0">
              {t.hero.subtitle}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link
                href="/katalog"
                className="btn-primary inline-flex items-center justify-center gap-2 hover:gap-3 transition-all"
              >
                {t.cta.viewCollection}
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/ai-maslahatchi"
                className="btn-outline inline-flex items-center justify-center gap-2"
              >
                <Sparkles size={18} />
                {t.cta.aiAdvisor}
              </Link>
            </div>
          </div>

          <div
            className="flex-1 flex justify-center md:justify-end animate-fade-in-up"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="relative w-full max-w-[560px] animate-float-slow">
              <div className="absolute inset-x-6 top-10 bottom-10 rounded-full bg-gradient-to-br from-accent/25 via-brand/10 to-bg-warm -z-0" />
              <Image
                src="/images/hero.png"
                alt="Hijob"
                width={1200}
                height={1200}
                className="relative z-10 w-full h-auto object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
