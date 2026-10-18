import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { Check, X } from 'lucide-react';
import { adminListProducts, adminSetProductStatus, type AdminProduct } from '@/lib/api';

const STATUS_LABEL: Record<AdminProduct['status'], { label: string; cls: string }> = {
  draft: { label: 'Draft', cls: 'bg-muted/10 text-muted' },
  pending: { label: 'Kutmoqda', cls: 'bg-warning/10 text-warning' },
  published: { label: 'Live', cls: 'bg-success/10 text-success' },
  archived: { label: 'Arxiv', cls: 'bg-muted/10 text-muted' },
  rejected: { label: 'Rad etilgan', cls: 'bg-danger/10 text-danger' },
};

const FILTERS = ['all', 'pending', 'published', 'draft', 'rejected', 'archived'] as const;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const current = (sp.status as typeof FILTERS[number] | undefined) ?? 'all';
  const products = await adminListProducts(current === 'all' ? undefined : current);

  async function setStatus(formData: FormData) {
    'use server';
    const id = String(formData.get('id'));
    const status = String(formData.get('status')) as AdminProduct['status'];
    await adminSetProductStatus(id, status);
    revalidatePath('/products');
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink mb-1">Mahsulotlar</h1>
          <p className="text-sm text-muted">{products.length} ta mahsulot</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={`/products${f === 'all' ? '' : `?status=${f}`}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
              current === f ? 'bg-oliveDeep text-goldSoft border-oliveDeep' : 'bg-surface border-rule text-ink'
            }`}
          >
            {f === 'all' ? 'Barchasi' : STATUS_LABEL[f as AdminProduct['status']].label}
          </Link>
        ))}
      </div>

      <div className="table-wrap">
        <table className="w-full text-sm">
          <thead className="bg-surface2 text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="text-left px-4 py-3">Mahsulot</th>
              <th className="text-left px-4 py-3">Sotuvchi</th>
              <th className="text-left px-4 py-3">Kategoriya</th>
              <th className="text-left px-4 py-3">Narx</th>
              <th className="text-left px-4 py-3">Variant</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const s = STATUS_LABEL[p.status];
              return (
                <tr key={p.id} className="border-t border-rule">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.coverUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={p.coverUrl} alt="" className="w-12 h-12 rounded-lg object-cover border border-rule" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-surface2 border border-rule" />
                      )}
                      <div>
                        <div className="font-semibold text-ink">{p.titleRu}</div>
                        {p.titleUz && <div className="text-xs text-muted">{p.titleUz}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-ink">{p.seller.brandName}</div>
                    {p.seller.verified && (
                      <span className="text-xs text-success inline-flex items-center gap-1">
                        <Check size={10} /> Tasdiqlangan
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink">{p.categoryId}</td>
                  <td className="px-4 py-3 text-ink">${p.basePriceUsd.toFixed(2)}</td>
                  <td className="px-4 py-3 text-ink">{p.variantsCount}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs rounded-pill px-2 py-0.5 ${s.cls}`}>
                      {s.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {p.status !== 'published' && (
                      <form action={setStatus} className="inline">
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="status" value="published" />
                        <button className="btn-success"><Check size={12} /> Nashr</button>
                      </form>
                    )}
                    {p.status !== 'rejected' && (
                      <form action={setStatus} className="inline">
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="status" value="rejected" />
                        <button className="btn-danger"><X size={12} /> Rad</button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="p-10 text-center text-sm text-muted">Bu status bo'yicha mahsulot yo'q</div>
        )}
      </div>
    </div>
  );
}
