import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { Ban, Check } from 'lucide-react';
import { adminListUsers, adminBanUser } from '@/lib/api';

const ROLE_FILTERS = ['all', 'buyer', 'seller', 'admin', 'moderator'] as const;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const sp = await searchParams;
  const current = (sp.role as typeof ROLE_FILTERS[number] | undefined) ?? 'all';
  const users = await adminListUsers(current === 'all' ? undefined : current);

  async function toggleBan(formData: FormData) {
    'use server';
    const id = String(formData.get('id'));
    const banned = String(formData.get('banned')) === 'true';
    await adminBanUser(id, banned);
    revalidatePath('/users');
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink mb-1">Foydalanuvchilar</h1>
          <p className="text-sm text-muted">{users.length} ta hisob</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {ROLE_FILTERS.map((r) => (
          <Link
            key={r}
            href={`/users${r === 'all' ? '' : `?role=${r}`}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize ${
              current === r ? 'bg-oliveDeep text-goldSoft border-oliveDeep' : 'bg-surface border-rule text-ink'
            }`}
          >
            {r === 'all' ? 'Barchasi' : r}
          </Link>
        ))}
      </div>

      <div className="table-wrap">
        <table className="w-full text-sm">
          <thead className="bg-surface2 text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="text-left px-4 py-3">Foydalanuvchi</th>
              <th className="text-left px-4 py-3">Telefon</th>
              <th className="text-left px-4 py-3">Rol</th>
              <th className="text-left px-4 py-3">Til</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Oxirgi faollik</th>
              <th className="text-right px-4 py-3">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-rule">
                <td className="px-4 py-3">
                  <div className="font-semibold text-ink">{u.fullName || `@${u.username}`}</div>
                  <div className="text-xs text-muted">@{u.username}</div>
                </td>
                <td className="px-4 py-3 text-ink font-mono text-xs">{u.phone}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs rounded-pill px-2 py-0.5 ${
                    u.role === 'admin' ? 'bg-gold/10 text-goldDark' :
                    u.role === 'moderator' ? 'bg-oliveDeep/10 text-oliveDeep' :
                    u.role === 'seller' ? 'bg-success/10 text-success' :
                    'bg-muted/10 text-muted'
                  }`}>{u.role}</span>
                </td>
                <td className="px-4 py-3 text-ink uppercase text-xs">{u.language}</td>
                <td className="px-4 py-3">
                  {u.isActive ? (
                    <span className="text-xs text-success inline-flex items-center gap-1">
                      <Check size={10} /> Faol
                    </span>
                  ) : (
                    <span className="text-xs text-danger inline-flex items-center gap-1">
                      <Ban size={10} /> Bloklangan
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted">
                  {u.lastSeenAt ? new Date(u.lastSeenAt).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={toggleBan} className="inline">
                    <input type="hidden" name="id" value={u.id} />
                    <input type="hidden" name="banned" value={u.isActive ? 'true' : 'false'} />
                    <button className={u.isActive ? 'btn-danger' : 'btn-success'}>
                      {u.isActive ? (<><Ban size={12} /> Bloklash</>) : (<><Check size={12} /> Ochish</>)}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="p-10 text-center text-sm text-muted">Hali foydalanuvchi yo'q</div>
        )}
      </div>
    </div>
  );
}
