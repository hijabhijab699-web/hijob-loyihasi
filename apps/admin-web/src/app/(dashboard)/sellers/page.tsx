import { revalidatePath } from 'next/cache';
import { Check, X, Ban, UserCheck } from 'lucide-react';
import {
  adminListSellers,
  adminVerifySeller,
  adminBanSeller,
  adminDeleteSeller,
} from '@/lib/api';
import { ConfirmDelete } from '@/components/ConfirmDelete';

export default async function AdminSellersPage() {
  const sellers = await adminListSellers();

  async function verify(formData: FormData) {
    'use server';
    const id = String(formData.get('id'));
    const verified = String(formData.get('verified')) === 'true';
    await adminVerifySeller(id, verified);
    revalidatePath('/sellers');
  }

  async function toggleBan(formData: FormData) {
    'use server';
    const id = String(formData.get('id'));
    const banned = String(formData.get('banned')) === 'true';
    await adminBanSeller(id, banned);
    revalidatePath('/sellers');
  }

  async function remove(formData: FormData) {
    'use server';
    const id = String(formData.get('id'));
    await adminDeleteSeller(id);
    revalidatePath('/sellers');
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink mb-1">Sotuvchilar</h1>
          <p className="text-sm text-muted">{sellers.length} ta sotuvchi</p>
        </div>
      </div>

      <div className="table-wrap">
        <table className="w-full text-sm">
          <thead className="bg-surface2 text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="text-left px-4 py-3">Brand</th>
              <th className="text-left px-4 py-3">Egasi</th>
              <th className="text-left px-4 py-3">Mahsulot</th>
              <th className="text-left px-4 py-3">Reyting</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {sellers.map((s) => (
              <tr key={s.id} className="border-t border-rule align-top">
                <td className="px-4 py-3">
                  <div className="font-semibold text-ink">{s.brandName}</div>
                  {s.city && <div className="text-xs text-muted">{s.city}</div>}
                </td>
                <td className="px-4 py-3">
                  <div className="text-ink">{s.user.fullName || `@${s.user.username}`}</div>
                  <div className="text-xs text-muted">{s.user.phone}</div>
                </td>
                <td className="px-4 py-3 text-ink">{s.productsCount}</td>
                <td className="px-4 py-3 text-ink">
                  {s.rating.toFixed(1)} <span className="text-xs text-muted">({s.reviewsCount})</span>
                </td>
                <td className="px-4 py-3 space-y-1">
                  {s.verified ? (
                    <span className="inline-flex items-center gap-1 text-xs text-success bg-success/10 rounded-pill px-2 py-0.5">
                      <Check size={12} /> Tasdiqlangan
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-warning bg-warning/10 rounded-pill px-2 py-0.5">
                      Kutmoqda
                    </span>
                  )}
                  {!s.user.active && (
                    <span className="inline-flex items-center gap-1 text-xs text-danger bg-danger/10 rounded-pill px-2 py-0.5">
                      <Ban size={12} /> Bloklangan
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  {!s.verified && (
                    <form action={verify} className="inline">
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="verified" value="true" />
                      <button className="btn-success"><UserCheck size={12} /> Tasdiqlash</button>
                    </form>
                  )}
                  {s.verified && (
                    <form action={verify} className="inline">
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="verified" value="false" />
                      <button className="btn-secondary text-xs"><X size={12} /> Bekor qilish</button>
                    </form>
                  )}
                  <form action={toggleBan} className="inline">
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="banned" value={s.user.active ? 'true' : 'false'} />
                    <button className="btn-danger">
                      {s.user.active ? (<><Ban size={12} /> Bloklash</>) : (<><Check size={12} /> Ochish</>)}
                    </button>
                  </form>
                  <ConfirmDelete
                    action={remove}
                    id={s.id}
                    confirmText={`"${s.brandName}" sotuvchini mahsulotlari bilan birga butunlay o'chirmoqchimisiz?`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sellers.length === 0 && (
          <div className="p-10 text-center text-sm text-muted">Hali sotuvchilar yo'q</div>
        )}
      </div>
    </div>
  );
}
