'use client';

import { useEffect } from 'react';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-serif text-4xl text-ink">Xatolik yuz berdi</h1>
      <p className="max-w-md text-ink-muted">
        Kutilmagan muammo. Sahifani qayta yuklab ko'ring.
      </p>
      <button
        onClick={reset}
        className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-cream hover:opacity-90"
      >
        Qayta urinish
      </button>
    </section>
  );
}
