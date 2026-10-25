import { revalidatePath } from 'next/cache';
import { Users, Store, UserPlus } from 'lucide-react';
import { adminListAgents, adminListUsers, adminSetUserRole } from '@/lib/api';

export default async function AdminAgentsPage() {
  const [agents, allUsers] = await Promise.all([
    adminListAgents(),
    adminListUsers(),
  ]);

  async function promote(formData: FormData) {
    'use server';
    const id = String(formData.get('id'));
    await adminSetUserRole(id, 'agent');
    revalidatePath('/agents');
  }

  async function demote(formData: FormData) {
    'use server';
    const id = String(formData.get('id'));
    await adminSetUserRole(id, 'buyer');
    revalidatePath('/agents');
  }

  // Users who could be made into agents (not currently agent, not a seller
  // with a shop). Admins are intentionally kept — they can act as agents.
  const candidates = allUsers
    .filter((u) => u.role === 'buyer' || u.role === 'moderator')
    .slice(0, 25);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-ink mb-1">Agentlar</h1>
        <p className="text-sm text-muted">
          Do'konlarni ro'yxatdan o'tkazadigan agentlar · {agents.length} ta faol
        </p>
      </div>

      <div className="mb-10">
        <h2 className="font-semibold text-ink text-lg mb-3 flex items-center gap-2">
          <Users size={18} /> Faol agentlar
        </h2>
        <div className="table-wrap">
          <table className="w-full text-sm">
            <thead className="bg-surface2 text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="text-left px-4 py-3">Ism</th>
                <th className="text-left px-4 py-3">Telefon</th>
                <th className="text-left px-4 py-3">Qo'shilgan</th>
                <th className="text-left px-4 py-3">Oxirgi faollik</th>
                <th className="text-left px-4 py-3">Do'konlar</th>
                <th className="text-right px-4 py-3">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a.id} className="border-t border-rule">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-ink">{a.fullName ?? '—'}</div>
                    <div className="text-xs text-muted">@{a.username}</div>
                  </td>
                  <td className="px-4 py-3 text-ink">{a.phone}</td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {new Date(a.createdAt).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {a.lastSeenAt ? new Date(a.lastSeenAt).toLocaleDateString('ru-RU') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 bg-oliveDeep/10 text-ink text-xs rounded-pill px-2 py-0.5">
                      <Store size={12} /> {a.shopsOnboarded}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={demote} className="inline">
                      <input type="hidden" name="id" value={a.id} />
                      <button className="btn-secondary text-xs">Agent rolidan olish</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {agents.length === 0 && (
            <div className="p-10 text-center text-sm text-muted">Hali agent yo'q</div>
          )}
        </div>
      </div>

      <div>
        <h2 className="font-semibold text-ink text-lg mb-3 flex items-center gap-2">
          <UserPlus size={18} /> Agent qilish uchun nomzodlar
        </h2>
        <div className="table-wrap">
          <table className="w-full text-sm">
            <thead className="bg-surface2 text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="text-left px-4 py-3">Ism</th>
                <th className="text-left px-4 py-3">Telefon</th>
                <th className="text-left px-4 py-3">Joriy rol</th>
                <th className="text-right px-4 py-3">Amal</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((u) => (
                <tr key={u.id} className="border-t border-rule">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-ink">{u.fullName ?? '—'}</div>
                    <div className="text-xs text-muted">@{u.username}</div>
                  </td>
                  <td className="px-4 py-3 text-ink">{u.phone}</td>
                  <td className="px-4 py-3 text-xs text-muted">{u.role}</td>
                  <td className="px-4 py-3 text-right">
                    <form action={promote} className="inline">
                      <input type="hidden" name="id" value={u.id} />
                      <button className="btn-success text-xs">Agent qilish</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
