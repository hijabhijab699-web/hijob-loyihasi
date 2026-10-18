'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { fetchProducts } from '@/lib/api-client';
import type { Product, ProductsListResponse } from '@/lib/types';
import { ProductCard } from '@/components/ProductCard';

const CATEGORIES = ['Barchasi', 'Ipak', 'Shoyi', 'Shifon', 'Pashmina'] as const;

const COLORS: { name: string; hex: string; border?: boolean }[] = [
  { name: 'Oq', hex: '#FFFFFF', border: true },
  { name: 'Qora', hex: '#1a1a1a' },
  { name: 'Jigarrang', hex: '#7C6354' },
  { name: 'Kumush', hex: '#C0C0C0' },
  { name: 'Pushti', hex: '#FFB6C1' },
  { name: 'Moviy', hex: '#87CEEB' },
  { name: 'Yashil', hex: '#90EE90' },
  { name: 'Sariq', hex: '#FFD700' },
];

const FABRICS = [
  { label: 'Ipak' },
  { label: 'Shoyi' },
  { label: 'Shifon' },
  { label: 'Pashmina' },
] as const;

const SIZES = ['S', 'M', 'L', 'XL'] as const;

const SORT_OPTIONS: { label: string; key: string }[] = [
  { label: 'Mashhurlik', key: 'popular' },
  { label: 'Narx: arzon', key: 'price-asc' },
  { label: 'Narx: qimmat', key: 'price-desc' },
  { label: 'Yangi', key: 'newest' },
  { label: 'Reyting', key: 'rating' },
];

const PAGE_SIZE = 9;

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function KatalogClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialCategory = searchParams.get('category');
  const initialSort = searchParams.get('sort') ?? 'popular';
  const initialSearch = searchParams.get('q') ?? '';

  const [activeCategory, setActiveCategory] = useState<string>(() => {
    if (!initialCategory) return 'Barchasi';
    const match = CATEGORIES.find(
      (c) => c.toLowerCase() === initialCategory.toLowerCase(),
    );
    return match ?? 'Barchasi';
  });
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [search] = useState(initialSearch);

  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortKey, setSortKey] = useState<string>(initialSort);
  const [currentPage, setCurrentPage] = useState(1);

  const [data, setData] = useState<ProductsListResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const sortLabel =
    SORT_OPTIONS.find((o) => o.key === sortKey)?.label ?? 'Mashhurlik';

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchProducts({
      category: activeCategory !== 'Barchasi' ? activeCategory : undefined,
      colors: selectedColors.join(','),
      fabrics: selectedFabrics.join(','),
      sizes: selectedSizes.join(','),
      minPrice: minPrice ? Number(minPrice.replace(/\s/g, '')) : undefined,
      maxPrice: maxPrice ? Number(maxPrice.replace(/\s/g, '')) : undefined,
      sort: sortKey,
      page: currentPage,
      pageSize: PAGE_SIZE,
      q: search || undefined,
    });
    if (res.ok && res.data) setData(res.data);
    setLoading(false);
  }, [
    activeCategory,
    selectedColors,
    selectedFabrics,
    selectedSizes,
    minPrice,
    maxPrice,
    sortKey,
    currentPage,
    search,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, selectedColors, selectedFabrics, selectedSizes, minPrice, maxPrice, sortKey]);

  const toggleColor = (name: string) =>
    setSelectedColors((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name],
    );
  const toggleFabric = (label: string) =>
    setSelectedFabrics((prev) =>
      prev.includes(label) ? prev.filter((f) => f !== label) : [...prev, label],
    );
  const toggleSize = (size: string) =>
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
    );

  const clearAll = () => {
    setActiveCategory('Barchasi');
    setSelectedColors([]);
    setSelectedFabrics([]);
    setSelectedSizes([]);
    setMinPrice('');
    setMaxPrice('');
  };

  const activeFilters = useMemo(() => {
    const arr: { label: string; clear: () => void }[] = [];
    if (activeCategory !== 'Barchasi')
      arr.push({ label: activeCategory, clear: () => setActiveCategory('Barchasi') });
    selectedColors.forEach((c) => arr.push({ label: c, clear: () => toggleColor(c) }));
    selectedFabrics.forEach((f) => arr.push({ label: f, clear: () => toggleFabric(f) }));
    selectedSizes.forEach((s) => arr.push({ label: `O'lcham: ${s}`, clear: () => toggleSize(s) }));
    if (minPrice) arr.push({ label: `Min: ${minPrice}`, clear: () => setMinPrice('') });
    if (maxPrice) arr.push({ label: `Max: ${maxPrice}`, clear: () => setMaxPrice('') });
    return arr;
  }, [activeCategory, selectedColors, selectedFabrics, selectedSizes, minPrice, maxPrice]);

  const products: Product[] = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  function FilterBlock({ isMobile = false }: { isMobile?: boolean }) {
    return (
      <div className={isMobile ? 'space-y-6' : 'space-y-8'}>
        {/* Price */}
        <div>
          <h4 className="font-sans font-semibold text-ink mb-3">Narx</h4>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="50 000"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full border border-rule rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
            <span className="text-ink-muted text-sm">—</span>
            <input
              type="text"
              placeholder="500 000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full border border-rule rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
          </div>
          <p className="text-xs text-ink-muted mt-1.5">so&apos;m</p>
        </div>

        {/* Colors */}
        <div>
          <h4 className="font-sans font-semibold text-ink mb-3">Rang</h4>
          <div className="grid grid-cols-4 gap-3">
            {COLORS.map((c) => (
              <button
                key={c.name}
                title={c.name}
                onClick={() => toggleColor(c.name)}
                className={`w-8 h-8 rounded-full transition-all ${
                  c.border ? 'border border-rule' : ''
                } ${
                  selectedColors.includes(c.name)
                    ? 'ring-2 ring-brand ring-offset-2'
                    : 'hover:ring-2 hover:ring-rule hover:ring-offset-1'
                }`}
                style={{ backgroundColor: c.hex }}
                aria-label={c.name}
              />
            ))}
          </div>
        </div>

        {/* Fabric */}
        <div>
          <h4 className="font-sans font-semibold text-ink mb-3">Mato turi</h4>
          <div className="space-y-2.5">
            {FABRICS.map((f) => (
              <label
                key={f.label}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={selectedFabrics.includes(f.label)}
                  onChange={() => toggleFabric(f.label)}
                  className="w-4 h-4 rounded border-rule text-brand focus:ring-brand/30 cursor-pointer"
                />
                <span className="text-sm text-ink group-hover:text-brand transition-colors">
                  {f.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Size */}
        <div>
          <h4 className="font-sans font-semibold text-ink mb-3">O&apos;lcham</h4>
          <div className="flex gap-2">
            {SIZES.map((s) => (
              <button
                key={s}
                onClick={() => toggleSize(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedSizes.includes(s)
                    ? 'bg-brand text-white'
                    : 'bg-bg-warm text-ink hover:bg-rule-light'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {activeFilters.length > 0 && (
          <button
            onClick={clearAll}
            className="w-full text-sm text-brand hover:text-brand-dark font-medium"
          >
            Barcha filtrlarni tozalash
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <section className="bg-bg-cream pt-6 pb-8">
        <div className="container-main">
          <nav className="text-sm text-ink-muted mb-4">
            <Link href="/" className="hover:text-brand transition-colors">
              Bosh sahifa
            </Link>
            <span className="mx-2">/</span>
            <span className="text-ink font-medium">Katalog</span>
          </nav>
          <h1 className="font-serif text-4xl font-semibold text-ink">Katalog</h1>
          <p className="text-ink-muted mt-2">
            {search ? (
              <>Qidiruv: &ldquo;{search}&rdquo;</>
            ) : (
              <>Premium ro&apos;mollar kolleksiyasi</>
            )}
          </p>
        </div>
      </section>

      {/* Category tabs */}
      <section className="border-b border-rule-light bg-white sticky top-16 md:top-20 z-30">
        <div className="container-main">
          <div className="flex gap-2 py-3 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? 'bg-brand text-white'
                    : 'bg-bg-warm text-ink hover:bg-rule-light'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-8">
        <div className="container-main">
          <div className="flex gap-8">
            {/* Sidebar */}
            <aside className="hidden lg:block w-[280px] shrink-0">
              <div className="sticky top-40">
                <FilterBlock />
              </div>
            </aside>

            <div className="flex-1 min-w-0">
              {/* Sort bar */}
              <div className="flex items-center justify-between mb-6 gap-3">
                <p className="hidden md:block text-sm text-ink-muted">
                  <span className="font-semibold text-ink">{total}</span> ta mahsulot topildi
                </p>

                <div className="flex md:hidden items-center gap-2 w-full">
                  <button
                    onClick={() => setShowMobileFilters(true)}
                    className="flex items-center gap-2 px-4 py-2.5 border border-rule rounded-lg text-sm font-medium text-ink flex-1 justify-center"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    Filtr
                    {activeFilters.length > 0 && (
                      <span className="bg-brand text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {activeFilters.length}
                      </span>
                    )}
                  </button>
                  <div className="relative flex-1">
                    <button
                      onClick={() => setSortOpen(!sortOpen)}
                      className="flex items-center gap-2 px-4 py-2.5 border border-rule rounded-lg text-sm font-medium text-ink w-full justify-center"
                    >
                      <ArrowUpDown className="w-4 h-4" />
                      {sortLabel}
                      <ChevronDown className="w-3.5 h-3.5 ml-auto" />
                    </button>
                    {sortOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-rule rounded-lg shadow-lg py-1 z-40">
                        {SORT_OPTIONS.map((opt) => (
                          <button
                            key={opt.key}
                            onClick={() => {
                              setSortKey(opt.key);
                              setSortOpen(false);
                            }}
                            className={`block w-full text-left px-4 py-2 text-sm ${
                              sortKey === opt.key
                                ? 'text-brand font-medium bg-bg-warm'
                                : 'text-ink hover:bg-bg-cream'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="hidden md:block relative">
                  <button
                    onClick={() => setSortOpen(!sortOpen)}
                    className="flex items-center gap-2 text-sm text-ink hover:text-brand transition-colors"
                  >
                    Saralash: <span className="font-medium">{sortLabel}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {sortOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-rule rounded-xl shadow-lg py-1 z-40">
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => {
                            setSortKey(opt.key);
                            setSortOpen(false);
                          }}
                          className={`block w-full text-left px-4 py-2.5 text-sm ${
                            sortKey === opt.key
                              ? 'text-brand font-medium bg-bg-warm'
                              : 'text-ink hover:bg-bg-cream'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {activeFilters.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 lg:hidden">
                  {activeFilters.map((f, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bg-warm rounded-full text-xs font-medium text-ink"
                    >
                      {f.label}
                      <button
                        onClick={f.clear}
                        className="text-ink-muted hover:text-ink"
                        aria-label={`${f.label} ni o'chirish`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {loading && (
                <div className="py-20 flex items-center justify-center text-ink-muted">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              )}

              {!loading && products.length === 0 && (
                <div className="py-20 text-center">
                  <p className="text-ink-muted mb-4">Mahsulot topilmadi</p>
                  <button
                    onClick={clearAll}
                    className="btn-outline text-sm"
                  >
                    Filtrlarni tozalash
                  </button>
                </div>
              )}

              {!loading && products.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {products.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <nav className="flex items-center justify-center gap-1.5 mt-10">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-2 text-sm text-ink-muted hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Oldingi</span>
                  </button>

                  {Array.from({ length: totalPages }).map((_, i) => {
                    const p = i + 1;
                    if (
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - currentPage) <= 1
                    ) {
                      return (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p)}
                          className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === p
                              ? 'bg-brand text-white'
                              : 'text-ink hover:bg-bg-warm'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    }
                    if (p === currentPage - 2 || p === currentPage + 2) {
                      return (
                        <span key={p} className="px-1 text-ink-muted">
                          …
                        </span>
                      );
                    }
                    return null;
                  })}

                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-2 text-sm text-ink-muted hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="hidden sm:inline">Keyingi</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </nav>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Filter Bottom Sheet */}
      {showMobileFilters && (
        <div
          className="fixed inset-0 bg-black/40 z-50 lg:hidden"
          onClick={() => setShowMobileFilters(false)}
        />
      )}

      <div
        className={`fixed inset-x-0 bottom-0 z-50 lg:hidden bg-white rounded-t-3xl transition-transform duration-300 ease-out ${
          showMobileFilters ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '85vh' }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-rule" />
        </div>
        <div className="flex items-center justify-between px-5 pb-4 border-b border-rule-light">
          <h3 className="font-serif text-xl font-semibold text-ink">Filtrlar</h3>
          <button
            onClick={() => setShowMobileFilters(false)}
            className="w-8 h-8 rounded-full bg-bg-warm flex items-center justify-center text-ink-muted hover:text-ink"
            aria-label="Yopish"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div
          className="overflow-y-auto px-5 py-5"
          style={{ maxHeight: 'calc(85vh - 140px)' }}
        >
          <FilterBlock isMobile />
        </div>
        <div className="px-5 py-4 border-t border-rule-light">
          <button
            onClick={() => setShowMobileFilters(false)}
            className="btn-primary w-full"
          >
            {total > 0 ? `${total} ta natijani ko'rsatish` : "Natijalarni ko'rsatish"}
          </button>
        </div>
      </div>
    </>
  );
}
