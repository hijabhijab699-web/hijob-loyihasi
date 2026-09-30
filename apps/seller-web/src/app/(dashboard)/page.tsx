import { listSellerProducts } from '@/lib/api';
import Link from 'next/link';
import { Package, ShoppingBag, TrendingUp, Plus } from 'lucide-react';

export default async function DashboardHome() {
  const products = await listSellerProducts().catch(() => []);
  const totalStock = products.reduce((sum, p) => sum + p.totalStock, 0);
  const published = products.filter((p) => p.status === 'published').length;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-oliveDeep">Bosh sahifa</h1>
          <p className="text-muted mt-2">Do'koningizning umumiy holati</p>
        </div>
        <Link href="/products/new" className="btn-gold">
          <Plus size={18} /> Yangi mahsulot
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Mahsulotlar" value={products.length} icon={Package} tone="olive" />
        <StatCard label="Nashr etilgan" value={published} icon={TrendingUp} tone="gold" />
        <StatCard label="Umumiy zaxira" value={totalStock} icon={ShoppingBag} tone="olive" />
      </div>

      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-2xl font-bold text-oliveDeep">So'nggi mahsulotlar</h2>
          <Link href="/products" className="text-sm text-gold hover:underline">
            Barchasini ko'rish →
          </Link>
        </div>
        {products.length === 0 ? (
          <EmptyProducts />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {products.slice(0, 6).map((p) => (
              <ProductPreview key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: any;
  tone: 'olive' | 'gold';
}) {
  const badge =
    tone === 'gold' ? 'bg-goldSoft/50 text-goldDark' : 'bg-oliveDeep/10 text-oliveDeep';
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted uppercase tracking-wider">{label}</div>
          <div className="text-4xl font-display font-bold text-oliveDeep mt-2">{value}</div>
        </div>
        <div className={`w-12 h-12 rounded-full grid place-items-center ${badge}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function ProductPreview({ p }: { p: any }) {
  return (
    <Link href={`/products/${p.id}`} className="card block hover:shadow-lg transition-shadow group">
      <div className="aspect-[3/4] rounded-xl bg-surface2 mb-3 overflow-hidden">
        {p.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.coverUrl}
            alt={p.titleRu}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        )}
      </div>
      <div className="text-sm text-ink font-medium truncate">{p.titleRu}</div>
      <div className="flex items-center justify-between mt-1">
        <div className="text-lg font-display font-bold text-oliveDeep">${p.basePriceUsd}</div>
        <StatusBadge status={p.status} />
      </div>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'bg-muted/10 text-muted' },
    pending: { label: 'Kutmoqda', className: 'bg-warning/10 text-warning' },
    published: { label: 'Live', className: 'bg-success/10 text-success' },
    archived: { label: 'Arxiv', className: 'bg-muted/10 text-muted' },
    rejected: { label: 'Rad etildi', className: 'bg-danger/10 text-danger' },
  };
  const cfg = map[status] ?? { label: status, className: 'bg-muted/10 text-muted' };
  return (
    <span className={`text-xs px-2 py-1 rounded-full ${cfg.className}`}>{cfg.label}</span>
  );
}

function EmptyProducts() {
  return (
    <div className="card text-center py-16">
      <div className="w-16 h-16 mx-auto rounded-full bg-goldSoft/40 grid place-items-center mb-4">
        <Package size={28} className="text-oliveDeep" />
      </div>
      <h3 className="text-xl font-display font-bold text-oliveDeep">Hali mahsulot yo'q</h3>
      <p className="text-muted mt-2 mb-6">Birinchi mahsulotingizni qo'shing va sotishni boshlang</p>
      <Link href="/products/new" className="btn-gold inline-flex">
        <Plus size={18} /> Birinchi mahsulot
      </Link>
    </div>
  );
}
