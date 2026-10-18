import { Suspense } from 'react';
import SearchClient from './SearchClient';

export const metadata = {
  title: "Qidiruv — Hijob",
};

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <section className="py-16 text-center text-ink-muted">Yuklanmoqda…</section>
      }
    >
      <SearchClient />
    </Suspense>
  );
}
