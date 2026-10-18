import { Suspense } from 'react';
import KatalogClient from './KatalogClient';

export const metadata = {
  title: 'Katalog — Hijob',
  description: "Barcha ro'mollar katalogi — ipak, shoyi, shifon, pashmina.",
};

export default function KatalogPage() {
  return (
    <Suspense
      fallback={
        <section className="py-16 text-center text-ink-muted">
          Yuklanmoqda…
        </section>
      }
    >
      <KatalogClient />
    </Suspense>
  );
}
