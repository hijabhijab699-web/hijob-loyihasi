import { adminListUsers, adminBanUser, type AdminUser } from '@/lib/api';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { Ban, Check } from 'lucide-react';

const ROLE_LABEL: Record<AdminUser['role'], string> = {
  buyer: 'Xaridor',
  seller: 'Sotuvchi',
  admin: 'Admin',
  moderator: 'Moderator',
};

const ROLES: Array<AdminUser['role'] | 'all'> = ['all', 'buyer', 'seller', 'admin', 'moderator'];

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const sp = await searchParams;
  const filter = (sp.role ?? 'all') as AdminUser['role'] | 'all';
  const users = await adminListUsers(filter === 'all' ? undefined : filter);

  async function toggleBan(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const banned = formData.get('banned') === 'true';
    await adminBanUser(id, !banned);
    revalidatePath('/admin/users');
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-ink mb-2">Foydalanuvchilar</h1>
      <p className="text-sm text-ink-muted mb-6">{users.length} ta</p>

      <div className="flex gap-2 mb-6">
        {ROLES.map((r) => (
          <Link
            key={r}
            href={r === 'all' ? '/admin/users' : (`/admin/users?role=${r}` as any)}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              filter === r
                ? 'bg-oliveDeep text-white border-oliveDeep'
                : 'border-rule text-ink-muted hover:bg-surface'
            }`}
          >
            {r === 'all' ? 'Hammasi' : ROLE_LABEL[r as AdminUser['role']]}
          </Link>
        ))}
      </div>

      <div className="bg-surface rounded-2xl border border-rule overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface2 text-xs uppercase tracking-wider text-ink-muted">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Foydalanuvchi</th>
              <th className="text-left px-5 py-3 font-medium">Tel</th>
              <th className="text-left px-5 py-3 font-medium">Rol</th>
              <th className="text-left px-5 py-3 font-medium">Til</th>
              <th className="text-left px-5 py-3 font-medium">Qo'shilgan</th>
              <th className="text-center px-5 py-3 font-medium">Holat</th>
              <th className="text-right px-5 py-3 font-medium">Harakat</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-rule">
                <td className="px-5 py-3">
                  <div className="text-ink">@{u.username}</div>
                  {u.fullName && <div className="text-xs text-ink-muted">{u.fullName}</div>}
                </td>
                <td className="px-5 py-3 text-ink">{u.phone}</td>
                <td className="px-5 py-3">
                  <span className="text-xs uppercase tracking-wider text-ink-muted">
                    {ROLE_LABEL[u.role]}
                  </span>
                </td>
                <td className="px-5 py-3 uppercase text-xs text-ink-muted">{u.language}</td>
                <td className="px-5 py-3 text-xs text-ink-muted">
                  {new Date(u.createdAt).toLocaleDateString('ru-RU')}
                </td>
                <td className="px-5 py-3 text-center">
                  {u.isActive ? (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-ok/10 text-ok">
                      <Check size={12} /> Faol
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-danger/10 text-danger">
                      <Ban size={12} /> Bloklangan
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  {u.role !== 'admin' && (
                    <form action={toggleBan}>
                      <input type="hidden" name="id" value={u.id} />
                      <input type="hidden" name="banned" value={String(!u.isActive)} />
                      <button
                        type="submit"
                        className={`text-xs px-3 py-1.5 rounded-lg border ${
                          u.isActive
                            ? 'border-rule hover:bg-danger/10 hover:text-danger hover:border-danger'
                            : 'border-ok/50 text-ok hover:bg-ok/10'
                        }`}
                      >
                        {u.isActive ? 'Bloklash' : 'Chiqarish'}
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
