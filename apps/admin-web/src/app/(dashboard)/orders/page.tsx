import { adminListOrders } from '@/lib/api';

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  confirmed: 'bg-oliveDeep/10 text-oliveDeep',
  processing: 'bg-oliveDeep/10 text-oliveDeep',
  shipped: 'bg-gold/10 text-goldDark',
  delivered: 'bg-success/10 text-success',
  cancelled: 'bg-danger/10 text-danger',
  returned: 'bg-danger/10 text-danger',
  proba_scheduled: 'bg-gold/10 text-goldDark',
};

const PAYMENT_COLOR: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  paid: 'bg-success/10 text-success',
  failed: 'bg-danger/10 text-danger',
  refunded: 'bg-muted/10 text-muted',
};

export default async function AdminOrdersPage() {
  const orders = await adminListOrders();

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink mb-1">Buyurtmalar</h1>
          <p className="text-sm text-muted">Oxirgi {orders.length} ta buyurtma</p>
        </div>
      </div>

      <div className="table-wrap">
        <table className="w-full text-sm">
          <thead className="bg-surface2 text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="text-left px-4 py-3">#</th>
              <th className="text-left px-4 py-3">Mijoz</th>
              <th className="text-left px-4 py-3">Elementlar</th>
              <th className="text-left px-4 py-3">Jami</th>
              <th className="text-left px-4 py-3">Buyurtma</th>
              <th className="text-left px-4 py-3">To'lov</th>
              <th className="text-left px-4 py-3">Usul</th>
              <th className="text-left px-4 py-3">Vaqt</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-rule">
                <td className="px-4 py-3 font-mono text-xs text-muted">{o.id.slice(0, 8)}</td>
                <td className="px-4 py-3">
                  <div className="text-ink">{o.userFullName || `@${o.userUsername}`}</div>
                </td>
                <td className="px-4 py-3 text-ink">{o.itemCount}</td>
                <td className="px-4 py-3 text-ink font-semibold">${o.totalUsd.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs rounded-pill px-2 py-0.5 ${STATUS_COLOR[o.orderStatus] ?? 'bg-muted/10 text-muted'}`}>
                    {o.orderStatus}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs rounded-pill px-2 py-0.5 ${PAYMENT_COLOR[o.paymentStatus] ?? 'bg-muted/10 text-muted'}`}>
                    {o.paymentStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted uppercase">{o.paymentMethod}</td>
                <td className="px-4 py-3 text-xs text-muted">
                  {new Date(o.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <div className="p-10 text-center text-sm text-muted">Hali buyurtmalar yo'q</div>
        )}
      </div>
    </div>
  );
}
