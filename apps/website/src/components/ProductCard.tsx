'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import type { Product } from '@/lib/types';
import { useCart } from '@/components/providers/CartProvider';
import { useWishlist } from '@/components/providers/WishlistProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { formatPrice } from '@/lib/format';

interface Props {
  product: Product;
  showAddToCart?: boolean;
}

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={
            i < Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'fill-rule-light text-rule-light'
          }
        />
      ))}
    </span>
  );
}

function Badge({ product }: { product: Product }) {
  if (!product.badge) return null;
  if (product.badge === 'sale')
    return <span className="badge-sale">-{product.discount ?? 10}%</span>;
  if (product.badge === 'bestseller')
    return <span className="badge-bestseller">Bestseller</span>;
  if (product.badge === 'new') return <span className="badge-new">Yangi</span>;
  return null;
}

export function ProductCard({ product, showAddToCart = true }: Props) {
  const cart = useCart();
  const wl = useWishlist();
  const toast = useToast();

  const liked = wl.has(product.id);

  return (
    <div className="card group hover-lift">
      <div className="relative">
        <Link
          href={`/mahsulot/${product.id}`}
          className="relative block aspect-square rounded-t-2xl overflow-hidden"
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>
        {product.badge && (
          <div className="absolute top-3 left-3">
            <Badge product={product} />
          </div>
        )}
        <button
          onClick={() => {
            const added = wl.toggle(product.id);
            toast.success(
              added ? 'Sevimlilarga qoʻshildi' : 'Sevimlilardan oʻchirildi',
            );
          }}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center transition-colors ${
            liked ? 'text-red-500' : 'text-ink-muted hover:text-red-400'
          }`}
          aria-label="Sevimlilar"
        >
          <Heart size={18} className={liked ? 'fill-red-500' : ''} />
        </button>
      </div>

      <div className="p-4">
        <Link
          href={`/mahsulot/${product.id}`}
          className="font-medium text-ink text-sm md:text-base hover:text-brand transition-colors line-clamp-1"
        >
          {product.name}
        </Link>

        <div className="flex items-center gap-1.5 mt-1.5">
          <Stars rating={product.rating} />
          <span className="text-xs text-ink-muted">
            {product.rating.toFixed(1)} ({product.reviews})
          </span>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <span className="font-semibold text-ink">
            {formatPrice(product.price)} so&apos;m
          </span>
          {product.oldPrice && (
            <span className="text-sm text-ink-muted line-through">
              {formatPrice(product.oldPrice)}
            </span>
          )}
        </div>

        {showAddToCart && (
          <button
            onClick={() => {
              cart.addItem(product);
              toast.success(`"${product.name}" savatga qoʻshildi`);
            }}
            className="mt-3 w-full btn-primary text-sm py-2.5 flex items-center justify-center gap-2"
          >
            <ShoppingBag size={16} />
            Savatga qo&apos;shish
          </button>
        )}
      </div>
    </div>
  );
}
