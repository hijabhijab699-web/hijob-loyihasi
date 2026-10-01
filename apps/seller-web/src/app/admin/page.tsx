import { adminDashboard } from '@/lib/api';
import { Users, UserCheck, Package, ShoppingBag } from 'lucide-react';

export default async function AdminHome() {
  const d = await adminDashboard();

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-ink mb-2">Admin paneli</h1>
      <p className="text-sm text-ink-muted mb-10">Platforma umumiy holati</p>

      <div className="grid grid-cols-4 gap-4">
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

      <div className="mt-10 bg-surface rounded-2xl border border-rule p-6">
        <h2 className="font-display text-xl font-bold text-ink mb-4">Keyingi qadamlar</h2>
        <ul className="text-sm text-ink space-y-2">
          {d.sellers.pending > 0 && (
            <Pill emoji="⚠️">
              <b>{d.sellers.pending}</b> sotuvchi tasdiqlanishini kutmoqda —{' '}
              <a className="text-oliveDeep underline" href="/admin/sellers">
                Sotuvchilar
              </a>
            </Pill>
          )}
          {d.products.pendingReview > 0 && (
            <Pill emoji="📋">
              <b>{d.products.pendingReview}</b> mahsulot moderatsiyada —{' '}
              <a className="text-oliveDeep underline" href="/admin/products?status=pending">
                Mahsulotlar
              </a>
            </Pill>
          )}
          {d.sellers.pending === 0 && d.products.pendingReview === 0 && (
            <Pill emoji="✓">Hamma narsa tartibda. Kutayotgan hech narsa yo'q.</Pill>
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
  emphasis?: 'warn' | 'ok';
}) {
  const ring =
    emphasis === 'warn'
      ? 'border-gold/60'
      : emphasis === 'ok'
        ? 'border-rule'
        : 'border-rule';
  return (
    <div className={`bg-surface rounded-2xl border ${ring} p-5`}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-ink-muted mb-2">
        {icon}
        <span>{label}</span>
      </div>
      <div className="font-display text-3xl font-bold text-ink tabular-nums">{value}</div>
      <div className="text-xs text-ink-muted mt-1">{sub}</div>
    </div>
  );
}

function Pill({ emoji, children }: { emoji: string; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 py-2 border-b border-rule last:border-b-0">
      <span className="text-base">{emoji}</span>
      <span>{children}</span>
    </li>
  );
}
