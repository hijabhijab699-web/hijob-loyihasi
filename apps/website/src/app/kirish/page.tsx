import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import KirishClient from './KirishClient';

export const metadata = {
  title: 'Kirish — Hijob',
  description: "Hijob hisobingizga kiring yoki yangi akkaunt oching.",
};

// useSearchParams in the client component forces a Suspense boundary at
// a server-rendered parent so Next can bail out of static prerender
// cleanly. Without this the whole /kirish page errors at build time.
export default function KirishPage() {
  return (
    <Suspense
      fallback={
        <section className="py-16 text-center text-ink-muted">
          <Loader2 className="w-6 h-6 animate-spin inline-block" />
        </section>
      }
    >
      <KirishClient />
    </Suspense>
  );
}
