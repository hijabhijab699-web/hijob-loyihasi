import { adminListSellers, adminVerifySeller, adminBanSeller } from '@/lib/api';
import { revalidatePath } from 'next/cache';
import { Check, X, Ban, UserCheck } from 'lucide-react';

export default async function AdminSellersPage() {
  const sellers = await adminListSellers();

  async function toggleVerify(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const verified = formData.get('verified') === 'true';
    await adminVerifySeller(id, !verified);
    revalidatePath('/admin/sellers');
    revalidatePath('/admin');
  }

  async function toggleBan(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const banned = formData.get('banned') === 'true';
    await adminBanSeller(id, !banned);
    revalidatePath('/admin/sellers');
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-ink mb-2">Sotuvchilar</h1>
      <p className="text-sm text-ink-muted mb-8">{sellers.length} ro'yxatga olingan</p>

      <div className="bg-surface rounded-2xl border border-rule overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface2 text-xs uppercase tracking-wider text-ink-muted">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Brend</th>
              <th className="text-left px-5 py-3 font-medium">Egasi</th>
              <th className="text-right px-5 py-3 font-medium">Mahsulot</th>
              <th className="text-right px-5 py-3 font-medium">Reyting</th>
              <th className="text-center px-5 py-3 font-medium">Holat</th>
              <th className="text-right px-5 py-3 font-medium">Harakat</th>
            </tr>
          </thead>
          <tbody>
            {sellers.map((s) => (
              <tr key={s.id} className="border-t border-rule">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    {s.logoUrl ? (
                      <img
                        src={s.logoUrl}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover border border-rule"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-surface2 border border-rule" />
                    )}
                    <div>
                      <div className="font-medium text-ink">{s.brandName}</div>
                      <div className="text-xs text-ink-muted">
                        {s.city ?? '—'} · {new Date(s.createdAt).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="text-ink">@{s.user.username}</div>
                  <div className="text-xs text-ink-muted">{s.user.phone}</div>
                </td>
                <td className="px-5 py-4 text-right tabular-nums">{s.productsCount}</td>
                <td className="px-5 py-4 text-right tabular-nums">
                  {s.rating.toFixed(1)}{' '}
                  <span className="text-xs text-ink-muted">({s.reviewsCount})</span>
                </td>
                <td className="px-5 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {s.verified ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-ok/10 text-ok">
                        <Check size={12} /> Tasdiqlangan
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gold/10 text-oliveDeep">
                        Kutilmoqda
                      </span>
                    )}
                    {!s.user.active && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-danger/10 text-danger">
                        <Ban size={12} /> Bloklangan
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <form action={toggleVerify}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="verified" value={String(s.verified)} />
                      <button
                        type="submit"
                        className="text-xs px-3 py-1.5 rounded-lg border border-rule hover:bg-surface2"
                        title={s.verified ? 'Tasdiqni olib tashlash' : 'Tasdiqlash'}
                      >
                        {s.verified ? (
                          <X size={14} />
                        ) : (
                          <UserCheck size={14} />
                        )}
                      </button>
                    </form>
                    <form action={toggleBan}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="banned" value={String(!s.user.active)} />
                      <button
                        type="submit"
                        className={`text-xs px-3 py-1.5 rounded-lg border ${
                          s.user.active
                            ? 'border-rule hover:bg-danger/10 hover:text-danger hover:border-danger'
                            : 'border-ok/50 text-ok hover:bg-ok/10'
                        }`}
                        title={s.user.active ? 'Bloklash' : 'Blokdan chiqarish'}
                      >
                        {s.user.active ? <Ban size={14} /> : <Check size={14} />}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
