import { revalidatePath } from 'next/cache';
import {
  adminListAds,
  adminCreateAd,
  adminUpdateAd,
  adminDeleteAd,
} from '@/lib/api';
import { ConfirmDelete } from '@/components/ConfirmDelete';

export default async function AdminAdsPage() {
  const ads = await adminListAds();

  async function upload(formData: FormData) {
    'use server';
    // Rebuild the FormData so Next's server-action transport (which
    // sometimes wraps File entries) hands the API a clean multipart body.
    const outbound = new FormData();
    const image = formData.get('image');
    if (image instanceof File && image.size > 0) outbound.append('image', image);
    const title = String(formData.get('title') ?? '').trim();
    const linkUrl = String(formData.get('linkUrl') ?? '').trim();
    const sortOrder = String(formData.get('sortOrder') ?? '0').trim();
    if (title) outbound.append('title', title);
    if (linkUrl) outbound.append('linkUrl', linkUrl);
    if (sortOrder) outbound.append('sortOrder', sortOrder);
    await adminCreateAd(outbound);
    revalidatePath('/ads');
  }

  async function toggleActive(formData: FormData) {
    'use server';
    const id = String(formData.get('id'));
    const active = String(formData.get('active')) === 'true';
    await adminUpdateAd(id, { active });
    revalidatePath('/ads');
  }

  async function remove(formData: FormData) {
    'use server';
    const id = String(formData.get('id'));
    await adminDeleteAd(id);
    revalidatePath('/ads');
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Reklama bannerlari</h1>
        <p className="text-sm text-neutral-500">
          Asosiy sahifada ko&apos;rinadigan karusel bannerlar.
        </p>
      </div>

      <form action={upload} className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="font-medium">Yangi banner qo&apos;shish</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-neutral-600">Rasm (jpg/png, ≤8MB)</span>
            <input name="image" type="file" accept="image/*" required className="w-full" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-neutral-600">Sarlavha (ixtiyoriy)</span>
            <input name="title" type="text" className="w-full rounded border border-neutral-300 p-2" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-neutral-600">Havola (ichki path, masalan /catalog)</span>
            <input name="linkUrl" type="text" className="w-full rounded border border-neutral-300 p-2" placeholder="/catalog" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-neutral-600">Tartib (kichik birinchi)</span>
            <input name="sortOrder" type="number" defaultValue={0} className="w-full rounded border border-neutral-300 p-2" />
          </label>
        </div>
        <button type="submit" className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
          Yuklash
        </button>
      </form>

      <div className="space-y-2">
        <h2 className="text-lg font-medium">Mavjud bannerlar</h2>
        {ads.length === 0 && (
          <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-sm text-neutral-500">
            Hali banner yo&apos;q.
          </p>
        )}
        <div className="grid gap-3">
          {ads.map((ad) => (
            <div key={ad.id} className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-3">
              <div className="relative h-24 w-40 overflow-hidden rounded bg-neutral-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ad.imageUrl} alt={ad.title ?? 'ad'} className="h-full w-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="font-medium">{ad.title ?? '—'}</div>
                <div className="text-xs text-neutral-500">
                  Tartib: {ad.sortOrder} · {ad.active ? 'Faol' : 'Nofaol'}
                  {ad.linkUrl ? ` · Havola: ${ad.linkUrl}` : ''}
                </div>
              </div>
              <form action={toggleActive}>
                <input type="hidden" name="id" value={ad.id} />
                <input type="hidden" name="active" value={String(!ad.active)} />
                <button type="submit" className="rounded border border-neutral-300 px-3 py-1 text-xs">
                  {ad.active ? 'Nofaol qilish' : 'Faollashtirish'}
                </button>
              </form>
              <ConfirmDelete
                action={remove}
                id={ad.id}
                label="O'chirish"
                confirmText="Reklamani butunlay o'chirmoqchimisiz?"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
