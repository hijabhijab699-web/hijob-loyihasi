import { getSellerAnalytics } from '@/lib/api';
import { Package, Shirt, ShoppingBag, Zap } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const data = await getSellerAnalytics().catch(() => null);

  if (!data) {
    return (
      <div className="card text-center py-16">
        <p className="text-muted">Statistika hozircha mavjud emas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-oliveDeep">Statistika</h1>
        <p className="text-muted mt-2">Do'koningizning umumiy ko'rsatgichlari</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Metric label="Mahsulot" value={data.totals.products} icon={Package} tone="olive" />
        <Metric label="Variantlar" value={data.totals.variants} icon={Shirt} tone="olive" />
        <Metric label="Zaxira" value={data.totals.stock} icon={Package} tone="olive" />
        <Metric label="Buyurtma" value={data.totals.orderUnits} icon={ShoppingBag} tone="gold" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Metric
          label="Primerka (jami)"
          value={data.totals.tryOnSessions}
          icon={Zap}
          tone="olive"
        />
        <Metric
          label="Buyurtma daromadi"
          value={`$${data.totals.grossUsd.toFixed(0)}`}
          icon={ShoppingBag}
          tone="gold"
        />
        <Metric
          label="Buyurtma soni"
          value={data.totals.orderItems}
          icon={ShoppingBag}
          tone="olive"
        />
      </div>

      <TryOnChart trend={data.tryOnTrend7d} />

      <TopVariants variants={data.topVariants} />
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number | string;
  icon: any;
  tone: 'olive' | 'gold';
}) {
  const badge =
    tone === 'gold' ? 'bg-goldSoft/50 text-goldDark' : 'bg-oliveDeep/10 text-oliveDeep';
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-muted uppercase tracking-wider">{label}</div>
          <div className="text-3xl font-display font-bold text-oliveDeep mt-2">{value}</div>
        </div>
        <div className={`w-11 h-11 rounded-full grid place-items-center ${badge}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function TryOnChart({ trend }: { trend: Array<{ day: string; count: number }> }) {
  const max = Math.max(1, ...trend.map((d) => d.count));
  return (
    <div className="card">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-display font-bold text-oliveDeep">Primerka (7 kun)</h2>
        <div className="text-xs text-muted uppercase tracking-wider">
          Jami {trend.reduce((s, d) => s + d.count, 0)}
        </div>
      </div>
      <div className="mt-6 grid grid-cols-7 gap-2 h-40 items-end">
        {trend.map((d) => (
          <div key={d.day} className="flex flex-col items-center gap-2">
            <div
              className="w-full bg-gradient-to-t from-oliveDeep to-olive rounded-t-md min-h-[4px]"
              style={{ height: `${(d.count / max) * 100}%` }}
              title={`${d.day}: ${d.count}`}
            />
            <div className="text-xs text-muted">{d.day.slice(5)}</div>
            <div className="text-sm font-medium text-ink">{d.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopVariants({
  variants,
}: {
  variants: Array<{ variantId: string; title: string; color: string; count: number }>;
}) {
  if (variants.length === 0) {
    return (
      <div className="card text-center py-8 text-muted">
        Hali primerka bo'lmagan — foydalanuvchilar mahsulotlaringizni sinab ko'rmaguncha bu bo'sh qoladi.
      </div>
    );
  }
  return (
    <div className="card">
      <h2 className="text-xl font-display font-bold text-oliveDeep">Top 5 sinab ko'rilgan</h2>
      <table className="w-full mt-4">
        <thead>
          <tr className="border-b border-rule">
            <th className="text-left py-2 text-xs text-muted uppercase tracking-wider">Mahsulot</th>
            <th className="text-left py-2 text-xs text-muted uppercase tracking-wider">Rang</th>
            <th className="text-right py-2 text-xs text-muted uppercase tracking-wider">Primerka</th>
          </tr>
        </thead>
        <tbody>
          {variants.map((v) => (
            <tr key={v.variantId} className="border-b border-ruleSoft last:border-0">
              <td className="py-3 text-ink">{v.title}</td>
              <td className="py-3 text-muted">{v.color}</td>
              <td className="py-3 text-right font-display font-semibold text-oliveDeep">
                {v.count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
