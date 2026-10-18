import Link from 'next/link';
import { adminListStyleJobs, adminListMannequins } from '@/lib/api';
import { JobCard } from './JobCard';
import { BaseMannequinsPanel } from './BaseMannequinsPanel';
import { AutoRefresh } from './AutoRefresh';

const FILTERS = ['pending', 'running', 'done', 'failed'] as const;

export const dynamic = 'force-dynamic';

export default async function DevAiPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const current = (sp.status as typeof FILTERS[number] | undefined) ?? 'pending';
  const [jobs, mannequins] = await Promise.all([
    adminListStyleJobs(current),
    adminListMannequins(),
  ]);

  return (
    <div>
      <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink mb-1">Developer AI panel</h1>
          <p className="text-sm text-muted max-w-2xl">
            1) Base manekinlarni bir martaga tayyorlang. 2) Pastdagi style-job'lar sotuvchi hijobini
            o'sha bazaga qarab mos razmerli manekinga kiydiradi. Keyin xaridor o'z bo'yiga qarab mos
            renderni ko'radi.
          </p>
        </div>
        <AutoRefresh />
      </div>

      <BaseMannequinsPanel items={mannequins} />

      <div className="flex items-center justify-between mb-3 mt-8">
        <h2 className="font-display text-xl font-bold text-ink">Style-job'lar</h2>
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <Link
              key={f}
              href={`/dev-ai?status=${f}`}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize ${
                current === f ? 'bg-oliveDeep text-goldSoft border-oliveDeep' : 'bg-surface border-rule text-ink'
              }`}
            >
              {f}
            </Link>
          ))}
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="card p-10 text-center text-sm text-muted">
          Bu status bo'yicha job yo'q.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {jobs.map((j) => (
            <JobCard key={j.id} job={j} />
          ))}
        </div>
      )}
    </div>
  );
}
