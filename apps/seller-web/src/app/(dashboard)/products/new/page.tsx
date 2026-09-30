import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { createProduct, publishProduct } from '@/lib/api';
import { ProductForm, type ProductFormValues } from './ProductForm';

export default function NewProductPage() {
  async function submit(values: ProductFormValues, publish: boolean) {
    'use server';
    const { id } = await createProduct(values);
    if (publish) await publishProduct(id);
    redirect(`/products`);
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/products" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
          <ChevronLeft size={16} /> Mahsulotlar
        </Link>
        <h1 className="text-4xl font-bold text-oliveDeep mt-2">Yangi mahsulot</h1>
        <p className="text-muted mt-2">
          Barcha maydonlarni to'ldiring. Nashr qilishdan oldin modaratorlar tekshiradi.
        </p>
      </div>

      <ProductForm onSubmit={submit} />
    </div>
  );
}
