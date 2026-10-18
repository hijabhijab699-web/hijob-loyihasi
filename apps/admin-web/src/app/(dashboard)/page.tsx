import { Users, UserCheck, Package, ShoppingBag } from 'lucide-react';
import { adminDashboard } from '@/lib/api';

export default async function AdminHome() {
  const d = await adminDashboard();

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-ink mb-2">Admin paneli</h1>
      <p className="text-sm text-muted mb-10">Platforma umumiy holati</p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat
          label="Foydalanuvchilar"
          value={d.users.total}
          sub={`${d.users.buyers} xaridor · ${d.users.sellers} sotuvchi`}
          icon={<Users size={18} />}
        />
        <Stat
          label="Sotuvchilar"
          value={d.sellers.total}
          sub={`${d.sellers.verified} tasdiqlangan · ${d.sellers.pending} kutmoqda`}
          icon={<UserCheck size={18} />}
          emphasis={d.sellers.pending > 0 ? 'warn' : 'ok'}
        />
        <Stat
          label="Mahsulotlar"
          value={d.products.total}
          sub={`${d.products.published} nashr qilingan · ${d.products.pendingReview} tekshirish`}
          icon={<Package size={18} />}
          emphasis={d.products.pendingReview > 0 ? 'warn' : 'ok'}
        />
        <Stat
          label="Buyurtmalar"
          value={d.orders.total}
          sub="Jami"
          icon={<ShoppingBag size={18} />}
        />
      </div>

      <div className="mt-10 card p-6">
        <h2 className="font-display text-xl font-semibold text-ink mb-2">Keyingi qadamlar</h2>
        <ul className="text-sm text-muted space-y-2 list-disc pl-5">
          {d.sellers.pending > 0 && (
            <li>
              {d.sellers.pending} ta sotuvchi tasdiqlashni kutmoqda — Sotuvchilar bo'limiga o'ting.
            </li>
          )}
          {d.products.pendingReview > 0 && (
            <li>
              {d.products.pendingReview} ta mahsulot moderatsiyada — Mahsulotlar bo'limida ko'rib chiqing.
            </li>
          )}
          {d.sellers.pending === 0 && d.products.pendingReview === 0 && (
            <li>Hozircha ko'rib chiqishni kutayotgan narsa yo'q — tozalik!</li>
          )}
        </ul>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  icon,
  emphasis,
}: {
  label: string;
  value: number;
  sub: string;
  icon: React.ReactNode;
  emphasis?: 'ok' | 'warn';
}) {
  const borderClass =
    emphasis === 'warn' ? 'border-warning/40' : emphasis === 'ok' ? 'border-success/30' : 'border-rule';
  return (
    <div className={`bg-surface border rounded-xl p-5 ${borderClass}`}>
      <div className="flex items-center justify-between text-muted mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
        <span className="text-oliveDeep">{icon}</span>
      </div>
      <div className="font-display text-4xl font-bold text-ink">{value.toLocaleString()}</div>
      <div className="text-xs text-muted mt-1">{sub}</div>
    </div>
  );
}
