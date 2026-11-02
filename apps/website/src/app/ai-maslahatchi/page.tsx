import Link from 'next/link';
import {
  Sparkles,
  Camera,
  ShoppingBag,
  Palette,
  Smartphone,
  ArrowRight,
} from 'lucide-react';

export const metadata = {
  title: 'AI Maslahatchi — Hijob',
  description:
    "Hijob AI maslahatchi — yuzingiz, tanangiz va rang sevimlilaringiz asosida eng mos ro'mol va kiyimlarni tanlab beradi.",
};

const STEPS = [
  {
    icon: Camera,
    title: 'Yuzingizni skaner qiling',
    text: "Oldi, chap va o'ng tomondan 3 ta rasm. Hamma ma'lumot qurilmangizda qoladi.",
  },
  {
    icon: Palette,
    title: "O'lchamlaringizni kiriting",
    text: "Bo'y, vazn va kiyim o'lchamingizni belgilang — tavsiyalar aniqroq bo'ladi.",
  },
  {
    icon: Sparkles,
    title: 'Mos keluvchi variantlar',
    text: "AI yuz shakli va tanangizga mos keluvchi 3-5 ta ro'mol/kiyim tanlab beradi.",
  },
  {
    icon: ShoppingBag,
    title: 'Sinab ko\'ring va sotib oling',
    text: "Primerka orqali o'zingizda qanday ko'rinishini ko'ring, savatga qo'shing.",
  },
];

export default function AiMaslahatchiPage() {
  return (
    <section className="py-10 md:py-16 bg-gradient-to-b from-bg-warm to-white">
      <div className="container-main max-w-5xl">
        <nav className="text-sm text-ink-muted mb-4">
          <Link href="/" className="hover:text-brand">
            Bosh sahifa
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ink font-medium">AI Maslahatchi</span>
        </nav>

        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-brand/10 text-brand px-4 py-1.5 rounded-full text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            Hijob AI
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-ink mt-4">
            Sizga mos ro&apos;mol va kiyimlarni toping
          </h1>
          <p className="text-ink-muted text-lg mt-4">
            Yuz shaklingiz, tanangiz va sevimli ranglaringiz asosida sun&apos;iy
            intellekt mos keluvchi variantlarni tanlab beradi. 24/7 ishlaydi,
            uyingizdan chiqmasdan.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link href="/primerka" className="btn-primary inline-flex items-center justify-center gap-2">
              <Camera className="w-4 h-4" />
              Primerkadan boshlash
            </Link>
            <Link href="/katalog" className="btn-outline inline-flex items-center justify-center gap-2">
              Katalogni ko&apos;rish
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((s, i) => (
            <div key={s.title} className="card p-6 relative">
              <div className="absolute top-3 right-4 font-serif text-5xl text-brand/10 font-bold">
                {i + 1}
              </div>
              <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
                <s.icon className="w-6 h-6" />
              </div>
              <h3 className="mt-4 font-semibold text-ink">{s.title}</h3>
              <p className="mt-2 text-sm text-ink-muted">{s.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-3xl bg-ink text-white p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-medium">
              <Smartphone className="w-3.5 h-3.5" />
              Mobil ilovada ham bor
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mt-3">
              Butun imkoniyatlar — mobil ilovada
            </h2>
            <p className="mt-3 text-white/70 md:max-w-md">
              Yuz skaner, real-time primerka, buyurtmalarni kuzatish va
              shaxsiy tavsiyalar — Hijob mobil ilovasida.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="https://apps.apple.com/"
                target="_blank"
                rel="noreferrer"
                className="bg-white text-ink px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-white/90 transition"
              >
                App Store
              </a>
              <a
                href="#"
                className="bg-white/10 text-white border border-white/20 px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-white/15 transition"
              >
                Google Play (tez orada)
              </a>
            </div>
          </div>
          <div className="w-40 h-40 md:w-56 md:h-56 shrink-0 rounded-3xl bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center">
            <Sparkles className="w-20 h-20 text-white/40" />
          </div>
        </div>
      </div>
    </section>
  );
}
