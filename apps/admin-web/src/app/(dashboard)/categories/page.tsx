import { revalidatePath } from 'next/cache';
import { Save } from 'lucide-react';
import { adminListCategories, adminUpdateCategory } from '@/lib/api';

export default async function AdminCategoriesPage() {
  const cats = await adminListCategories();

  async function save(formData: FormData) {
    'use server';
    const id = String(formData.get('id'));
    const nameUz = String(formData.get('nameUz') ?? '').trim();
    const nameRu = String(formData.get('nameRu') ?? '').trim();
    const nameEn = String(formData.get('nameEn') ?? '').trim();
    const order = Number(formData.get('order') ?? 0);
    const iconUrl = String(formData.get('iconUrl') ?? '').trim() || null;
    const coverUrl = String(formData.get('coverUrl') ?? '').trim() || null;
    await adminUpdateCategory(id, { nameUz, nameRu, nameEn, order, iconUrl, coverUrl });
    revalidatePath('/categories');
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-ink mb-1">Kategoriyalar</h1>
        <p className="text-sm text-muted">
          {cats.length} ta kategoriya · Tartib, nomi (UZ/RU/EN) va rasmlarni tahrir qilish
        </p>
      </div>

      <div className="space-y-4">
        {cats.map((c) => (
          <form
            key={c.id}
            action={save}
            className="bg-surface border border-rule rounded-xl p-5"
          >
            <input type="hidden" name="id" value={c.id} />
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-oliveDeep/10 flex items-center justify-center overflow-hidden">
                {c.iconUrl ? (
                  <img src={c.iconUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-semibold text-muted uppercase">{c.id.slice(0, 2)}</span>
                )}
              </div>
              <div>
                <div className="font-semibold text-ink">{c.id}</div>
                <div className="text-xs text-muted">{c.productsCount} ta mahsulot</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <Field label="Nom (uz)" name="nameUz" defaultValue={c.nameUz} />
              <Field label="Название (ru)" name="nameRu" defaultValue={c.nameRu} />
              <Field label="Name (en)" name="nameEn" defaultValue={c.nameEn} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <Field label="Tartib" name="order" type="number" defaultValue={String(c.order)} />
              <Field label="Icon URL" name="iconUrl" defaultValue={c.iconUrl ?? ''} />
              <Field label="Cover URL" name="coverUrl" defaultValue={c.coverUrl ?? ''} />
            </div>

            <button type="submit" className="btn-success">
              <Save size={14} /> Saqlash
            </button>
          </form>
        ))}
      </div>

      {cats.length === 0 && (
        <div className="p-10 text-center text-sm text-muted">Hali kategoriyalar yo'q</div>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <div className="text-xs text-muted mb-1">{label}</div>
      <input
        name={name}
        type={type ?? 'text'}
        defaultValue={defaultValue}
        className="w-full border border-rule rounded-lg px-3 py-2 text-ink text-sm"
      />
    </label>
  );
}
