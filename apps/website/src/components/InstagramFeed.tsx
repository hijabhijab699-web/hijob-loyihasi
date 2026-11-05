import Image from 'next/image';
import Link from 'next/link';
import { Instagram, Heart, MessageCircle } from 'lucide-react';
import type { Product } from '@/lib/types';

interface Props {
  posts: Product[];
}

const PRESET_META = [
  { likes: 1240, comments: 32 },
  { likes: 892, comments: 18 },
  { likes: 2103, comments: 56 },
  { likes: 1572, comments: 41 },
  { likes: 1823, comments: 67 },
  { likes: 756, comments: 24 },
];

export function InstagramFeed({ posts }: Props) {
  if (!posts || posts.length === 0) return null;
  return (
    <section className="py-12 md:py-16 bg-bg-warm">
      <div className="container-main">
        <div className="text-center mb-10">
          <a
            href="https://www.instagram.com/2431.uz/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-brand font-medium hover:text-brand-dark"
          >
            <Instagram className="w-5 h-5" />
            @2431.uz
          </a>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-ink mt-3">
            Instagram&apos;dan
          </h2>
          <p className="mt-2 text-ink-muted max-w-md mx-auto text-sm">
            So&apos;nggi yangiliklar va stil ilhomlari uchun bizni kuzatib boring
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
          {posts.slice(0, 6).map((p, i) => {
            const meta = PRESET_META[i % PRESET_META.length];
            return (
              <Link
                key={p.id}
                href={`/mahsulot/${p.id}`}
                className="group relative aspect-square rounded-xl overflow-hidden bg-bg-cream"
              >
                {/* Same marble-arch backdrop as catalog cards so dark
                    full-length shots don't read as a solid grey block
                    when cover-cropped. */}
                <Image
                  src="/images/card-backdrop.webp"
                  alt=""
                  fill
                  sizes="(max-width: 768px) 50vw, 16vw"
                  className="object-cover opacity-50"
                  aria-hidden
                />
                <div className="absolute inset-0 bg-gradient-to-b from-bg-cream/40 via-transparent to-bg-cream/60" />
                <Image
                  src={p.image}
                  alt={p.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 16vw"
                  className="object-contain transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white flex items-center gap-4 text-sm font-medium">
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4 fill-white" />
                      {meta.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4 fill-white" />
                      {meta.comments}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
