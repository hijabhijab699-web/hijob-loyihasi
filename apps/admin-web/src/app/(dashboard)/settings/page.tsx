import { revalidatePath } from 'next/cache';
import { Save, DollarSign } from 'lucide-react';
import { adminGetRate, adminSetRate } from '@/lib/api';

export default async function AdminSettingsPage() {
  const current = await adminGetRate();

  async function save(formData: FormData) {
    'use server';
    const rate = Number(formData.get('rate'));
    if (!Number.isFinite(rate) || rate <= 0) return;
    await adminSetRate(rate);
    revalidatePath('/settings');
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-ink mb-1">Sozlamalar</h1>
        <p className="text-sm text-muted">Valyuta kursi va umumiy parametrlar</p>
      </div>

      <div className="max-w-xl bg-surface rounded-xl border border-rule p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-oliveDeep/10 flex items-center justify-center">
            <DollarSign size={18} className="text-oliveDeep" />
          </div>
          <div>
            <div className="font-semibold text-ink">USD → UZS kursi</div>
            <div className="text-xs text-muted">Barcha narxlar shu kurs orqali so'mga aylantiriladi</div>
          </div>
        </div>

        <form action={save} className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted whitespace-nowrap">1 USD =</span>
            <input
              name="rate"
              type="number"
              step="1"
              min="1"
              defaultValue={current.usdToUzsRate}
              className="flex-1 border border-rule rounded-lg px-3 py-2 text-ink"
            />
            <span className="text-sm text-muted">so'm</span>
          </div>
          <button type="submit" className="btn-success w-full">
            <Save size={14} /> Saqlash
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-rule text-xs text-muted">
          <div>Hozirgi kurs: <span className="font-semibold text-ink">{current.usdToUzsRate.toLocaleString('ru-RU')} so'm</span></div>
          <div>Mijozlarga ko'rsatiladigan narxlar shu kurs bo'yicha hisoblanadi va 100 so'mgacha yaxlitlanadi.</div>
        </div>
      </div>
    </div>
  );
}
