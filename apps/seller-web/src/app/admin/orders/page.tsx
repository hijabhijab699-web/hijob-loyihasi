import { adminListOrders } from '@/lib/api';

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-gold/15 text-oliveDeep',
  confirmed: 'bg-ok/10 text-ok',
  processing: 'bg-ok/10 text-ok',
  shipped: 'bg-ok/15 text-ok',
  delivered: 'bg-ok/20 text-ok',
  cancelled: 'bg-danger/15 text-danger',
  returned: 'bg-danger/10 text-danger',
};

export default async function AdminOrdersPage() {
  const orders = await adminListOrders();

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-ink mb-2">Buyurtmalar</h1>
      <p className="text-sm text-ink-muted mb-6">{orders.length} ta oxirgi</p>

      <div className="bg-surface rounded-2xl border border-rule overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface2 text-xs uppercase tracking-wider text-ink-muted">
            <tr>
              <th className="text-left px-5 py-3 font-medium">ID</th>
              <th className="text-left px-5 py-3 font-medium">Xaridor</th>
              <th className="text-right px-5 py-3 font-medium">Mahsulot</th>
              <th className="text-right px-5 py-3 font-medium">Jami</th>
              <th className="text-center px-5 py-3 font-medium">Buyurtma</th>
              <th className="text-center px-5 py-3 font-medium">To'lov</th>
              <th className="text-right px-5 py-3 font-medium">Sana</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-ink-muted text-sm">
                  Hali buyurtmalar yo'q
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-rule">
                <td className="px-5 py-3 font-mono text-xs text-ink-muted">
                  {o.id.slice(0, 8)}
                </td>
                <td className="px-5 py-3">
                  <div className="text-ink">@{o.userUsername}</div>
                  {o.userFullName && <div className="text-xs text-ink-muted">{o.userFullName}</div>}
                </td>
                <td className="px-5 py-3 text-right tabular-nums">{o.itemCount}</td>
                <td className="px-5 py-3 text-right font-display font-bold text-gold tabular-nums">
                  ${o.totalUsd.toFixed(2)}
                </td>
                <td className="px-5 py-3 text-center">
                  <span
                    className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${
                      STATUS_COLOR[o.orderStatus] ?? 'bg-surface2 text-ink-muted'
                    }`}
                  >
                    {o.orderStatus}
                  </span>
                </td>
                <td className="px-5 py-3 text-center">
                  <div className="text-xs text-ink">{o.paymentMethod}</div>
                  <div className="text-[10px] uppercase tracking-wider text-ink-muted">
                    {o.paymentStatus}
                  </div>
                </td>
                <td className="px-5 py-3 text-right text-xs text-ink-muted tabular-nums">
                  {new Date(o.createdAt).toLocaleDateString('ru-RU')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
