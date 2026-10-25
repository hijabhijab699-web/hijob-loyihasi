import { revalidatePath } from 'next/cache';
import { Check, X } from 'lucide-react';
import {
  adminListSubscriptions,
  adminActivateSubscription,
  adminCancelSubscription,
} from '@/lib/api';

const PLAN_LABEL: Record<string, string> = {
  monthly: '1 oy',
  halfyear: '6 oy',
  yearly: '12 oy',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Kutmoqda',
  active: 'Faol',
  expired: 'Muddati tugagan',
  cancelled: 'Bekor qilingan',
};

export default async function AdminSubscriptionsPage() {
  const rows = await adminListSubscriptions();

  async function activate(formData: FormData) {
    'use server';
    const id = String(formData.get('id'));
    const priceUzs = String(formData.get('priceUzs') ?? '').trim();
    await adminActivateSubscription(id, priceUzs ? priceUzs : undefined);
    revalidatePath('/subscriptions');
  }

  async function cancel(formData: FormData) {
    'use server';
    const id = String(formData.get('id'));
    await adminCancelSubscription(id);
    revalidatePath('/subscriptions');
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-ink mb-1">Obunalar</h1>
        <p className="text-sm text-muted">{rows.length} ta obuna so'rovi</p>
      </div>

      <div className="table-wrap">
        <table className="w-full text-sm">
          <thead className="bg-surface2 text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="text-left px-4 py-3">Do'kon</th>
              <th className="text-left px-4 py-3">Tarif</th>
              <th className="text-left px-4 py-3">Narx</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Davomiylik</th>
              <th className="text-right px-4 py-3">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-t border-rule align-top">
                <td className="px-4 py-3">
                  <div className="font-semibold text-ink">{s.brandName}</div>
                  <div className="text-xs text-muted">{s.phone}</div>
                </td>
                <td className="px-4 py-3 text-ink">{PLAN_LABEL[s.plan] ?? s.plan}</td>
                <td className="px-4 py-3">
                  <div className="text-ink">${s.priceUsd}</div>
                  {s.priceUzs && <div className="text-xs text-muted">{Number(s.priceUzs).toLocaleString('ru-RU')} so'm</div>}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 text-xs rounded-pill px-2 py-0.5 ${
                    s.status === 'active' ? 'bg-success/10 text-success' :
                    s.status === 'pending' ? 'bg-warning/10 text-warning' :
                    'bg-muted/10 text-muted'
                  }`}>
                    {STATUS_LABEL[s.status] ?? s.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted">
                  {s.startAt && <div>Boshlanishi: {new Date(s.startAt).toLocaleDateString('ru-RU')}</div>}
                  {s.endAt && <div>Tugashi: {new Date(s.endAt).toLocaleDateString('ru-RU')}</div>}
                  <div>Yaratilgan: {new Date(s.createdAt).toLocaleDateString('ru-RU')}</div>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  {s.status === 'pending' && (
                    <form action={activate} className="inline-flex items-center gap-1">
                      <input type="hidden" name="id" value={s.id} />
                      <input
                        type="text"
                        name="priceUzs"
                        placeholder="so'm (ixtiyoriy)"
                        className="text-xs border border-rule rounded px-2 py-1 w-28"
                      />
                      <button className="btn-success"><Check size={12} /> Faollashtirish</button>
                    </form>
                  )}
                  {(s.status === 'pending' || s.status === 'active') && (
                    <form action={cancel} className="inline">
                      <input type="hidden" name="id" value={s.id} />
                      <button className="btn-secondary text-xs"><X size={12} /> Bekor qilish</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="p-10 text-center text-sm text-muted">Hali obuna so'rovlari yo'q</div>
        )}
      </div>
    </div>
  );
}
