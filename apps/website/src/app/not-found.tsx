import Link from 'next/link';

export const metadata = {
  title: '404 — Topilmadi | Hijob',
};

export default function NotFound() {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-serif text-5xl text-ink">404</h1>
      <p className="max-w-md text-ink-muted">
        Qidirgan sahifa topilmadi. Ro'yxatga qaytib, boshqa narsa ko'rib
        chiqasizmi?
      </p>
      <Link
        href="/"
        className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-cream hover:opacity-90"
      >
        Bosh sahifaga qaytish
      </Link>
    </section>
  );
}
