import { adminListProducts, adminSetProductStatus, type AdminProduct } from '@/lib/api';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

const STATUS_LABEL: Record<AdminProduct['status'], string> = {
  draft: 'Qoralama',
  pending: 'Tekshirishda',
  published: 'Nashr',
  archived: 'Arxiv',
  rejected: 'Rad etilgan',
};

const STATUSES: Array<AdminProduct['status'] | 'all'> = [
  'all',
  'published',
  'pending',
  'draft',
  'rejected',
  'archived',
];

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const filter = (sp.status ?? 'all') as AdminProduct['status'] | 'all';
  const products = await adminListProducts(filter === 'all' ? undefined : filter);

  async function approve(formData: FormData) {
    'use server';
    await adminSetProductStatus(formData.get('id') as string, 'published');
    revalidatePath('/admin/products');
    revalidatePath('/admin');
  }
  async function reject(formData: FormData) {
    'use server';
    await adminSetProductStatus(formData.get('id') as string, 'rejected');
    revalidatePath('/admin/products');
    revalidatePath('/admin');
  }
  async function archive(formData: FormData) {
    'use server';
    await adminSetProductStatus(formData.get('id') as string, 'archived');
    revalidatePath('/admin/products');
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-ink mb-2">Mahsulotlar</h1>
      <p className="text-sm text-ink-muted mb-6">
        {products.length} ta {filter === 'all' ? '' : `(${STATUS_LABEL[filter as AdminProduct['status']].toLowerCase()})`}
      </p>

      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={s === 'all' ? '/admin/products' : (`/admin/products?status=${s}` as any)}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              filter === s
                ? 'bg-oliveDeep text-white border-oliveDeep'
                : 'border-rule text-ink-muted hover:bg-surface'
            }`}
          >
            {s === 'all' ? 'Hammasi' : STATUS_LABEL[s as AdminProduct['status']]}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {products.map((p) => (
          <div key={p.id} className="bg-surface rounded-2xl border border-rule overflow-hidden">
            <div className="aspect-[3/4] bg-surface2 overflow-hidden">
              <img src={p.coverUrl} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-ink text-sm leading-tight">{p.titleRu}</h3>
                <StatusChip status={p.status} />
              </div>
              <div className="text-xs text-ink-muted">
                {p.seller.brandName}
                {p.seller.verified && <span className="text-ok"> ✓</span>}
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="font-display font-bold text-gold text-base">${p.basePriceUsd}</div>
                <div className="flex gap-1">
                  {p.status !== 'published' && (
                    <form action={approve}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="text-xs px-2 py-1 rounded border border-ok/40 text-ok hover:bg-ok/10">
                        Nashr
                      </button>
                    </form>
                  )}
                  {p.status !== 'rejected' && (
                    <form action={reject}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="text-xs px-2 py-1 rounded border border-danger/40 text-danger hover:bg-danger/10">
                        Rad
                      </button>
                    </form>
                  )}
                  {p.status === 'published' && (
                    <form action={archive}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="text-xs px-2 py-1 rounded border border-rule text-ink-muted hover:bg-surface2">
                        Arxiv
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: AdminProduct['status'] }) {
  const color = {
    draft: 'bg-surface2 text-ink-muted',
    pending: 'bg-gold/15 text-oliveDeep',
    published: 'bg-ok/15 text-ok',
    archived: 'bg-ink/10 text-ink-muted',
    rejected: 'bg-danger/15 text-danger',
  }[status];
  return (
    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${color}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
