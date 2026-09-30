import { listSellerProducts } from '@/lib/api';
import Link from 'next/link';
import { Plus, Pencil } from 'lucide-react';

export const dynamic = 'force-dynamic';

const CATEGORY_LABEL: Record<string, string> = {
  scarves: "Ro'mollar",
  dresses: "Ko'ylaklar",
  bags: 'Sumkalar',
  accessories: 'Aksessuarlar',
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  pending: 'Moderatsiya',
  published: 'Live',
  archived: 'Arxiv',
  rejected: 'Rad etildi',
};

export default async function ProductsPage() {
  const products = await listSellerProducts().catch(() => []);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-oliveDeep">Mahsulotlar</h1>
          <p className="text-muted mt-2">{products.length} ta mahsulot</p>
        </div>
        <Link href="/products/new" className="btn-gold">
          <Plus size={18} /> Yangi mahsulot
        </Link>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface2 border-b border-rule">
            <tr>
              <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted">
                Mahsulot
              </th>
              <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted">
                Kategoriya
              </th>
              <th className="text-right p-4 text-xs font-semibold uppercase tracking-wider text-muted">
                Narx
              </th>
              <th className="text-right p-4 text-xs font-semibold uppercase tracking-wider text-muted">
                Zaxira
              </th>
              <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-muted">
                Holat
              </th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-ruleSoft last:border-0 hover:bg-surface2/40">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-surface2 overflow-hidden flex-shrink-0">
                      {p.coverUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.coverUrl} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-ink truncate">{p.titleRu}</div>
                      <div className="text-xs text-muted">
                        {p.variantCount} variant · SKU {p.id.slice(0, 8)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-sm text-ink2">
                  {CATEGORY_LABEL[p.categoryId] ?? p.categoryId}
                </td>
                <td className="p-4 text-right font-display font-semibold text-oliveDeep">
                  ${p.basePriceUsd}
                </td>
                <td className="p-4 text-right text-sm text-ink2">{p.totalStock}</td>
                <td className="p-4">
                  <StatusPill status={p.status} />
                </td>
                <td className="p-4 text-right">
                  <Link
                    href={`/products/${p.id}`}
                    className="inline-flex items-center gap-1 text-sm text-gold hover:underline"
                  >
                    <Pencil size={14} />
                  </Link>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="p-16 text-center text-muted">
                  Hali mahsulot yo'q.{' '}
                  <Link href="/products/new" className="text-gold hover:underline">
                    Yangisini qo'shing
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: 'bg-muted/10 text-muted',
    pending: 'bg-warning/10 text-warning',
    published: 'bg-success/10 text-success',
    archived: 'bg-muted/10 text-muted',
    rejected: 'bg-danger/10 text-danger',
  };
  return (
    <span
      className={`text-xs px-2 py-1 rounded-full font-medium ${map[status] ?? 'bg-muted/10 text-muted'}`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
