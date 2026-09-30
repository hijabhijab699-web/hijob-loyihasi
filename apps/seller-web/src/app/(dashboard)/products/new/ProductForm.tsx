'use client';

import { useFieldArray, useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { CreateProductInput } from '@/lib/api';
import { ImageUploader } from '@/components/ImageUploader';

export type ProductFormValues = CreateProductInput;

const CATEGORIES: Array<{ id: ProductFormValues['categoryId']; label: string }> = [
  { id: 'scarves', label: "Ro'mol" },
  { id: 'dresses', label: "Ko'ylak" },
  { id: 'bags', label: 'Sumka' },
  { id: 'accessories', label: 'Aksessuar' },
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '70x70', '90x90', '110x110'];

const COLOR_PRESETS: Array<{ name: string; hex: string }> = [
  { name: 'Bejeviy', hex: '#D4C3A0' },
  { name: 'Oq', hex: '#F8F5EE' },
  { name: 'Sariq', hex: '#F4D06F' },
  { name: 'Pushti', hex: '#E8B0B0' },
  { name: 'Kulrang', hex: '#B0AEA7' },
  { name: 'Yashil', hex: '#7A8A5B' },
  { name: 'Zaytun', hex: '#8A8D5B' },
  { name: "Ko'k", hex: '#5F7A94' },
  { name: 'Qora', hex: '#1A1A1A' },
  { name: 'Jigarrang', hex: '#8B5A3C' },
];

export function ProductForm({
  onSubmit,
  initialValues,
}: {
  onSubmit: (values: ProductFormValues, publish: boolean) => Promise<void>;
  initialValues?: Partial<ProductFormValues>;
}) {
  const [publish, setPublish] = useState(false);

  const form = useForm<ProductFormValues>({
    defaultValues: {
      titleRu: '',
      titleUz: '',
      descriptionRu: '',
      categoryId: 'scarves',
      basePriceUsd: 25,
      coverUrl: '',
      attributes: { fabric: 'chiffon' },
      variants: [
        {
          color: 'Bejeviy',
          colorHex: '#D4C3A0',
          size: '110x110',
          priceUsd: 25,
          stock: 10,
          sku: '',
          images: [],
        },
      ],
      ...initialValues,
    },
  });

  const variants = useFieldArray({ control: form.control, name: 'variants' });

  const submit: SubmitHandler<ProductFormValues> = async (values) => {
    // Sync SKU if empty.
    values.variants = values.variants.map((v, i) => ({
      ...v,
      sku: v.sku || `${values.titleRu.slice(0, 6).replace(/\s+/g, '').toUpperCase()}-${i + 1}`,
    }));
    await onSubmit(values, publish);
  };

  const category = form.watch('categoryId');

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-6">
      {/* Basics card */}
      <div className="card space-y-5">
        <h2 className="text-xl font-display font-bold text-oliveDeep">Asosiy ma'lumot</h2>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Nomi (Русский)" required>
            <input {...form.register('titleRu', { required: true, minLength: 3 })} className="input" />
          </Field>
          <Field label="Nomi (O'zbek)">
            <input {...form.register('titleUz')} className="input" />
          </Field>
        </div>

        <Field label="Tavsif (Русский)">
          <textarea
            {...form.register('descriptionRu')}
            rows={3}
            className="w-full px-4 py-3 rounded-2xl bg-surface border border-rule focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 resize-none"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Kategoriya" required>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((c) => {
                const active = category === c.id;
                return (
                  <label
                    key={c.id}
                    className={`px-4 py-2 rounded-pill border cursor-pointer text-sm transition-colors ${
                      active
                        ? 'bg-oliveDeep text-white border-oliveDeep'
                        : 'bg-surface text-ink border-rule hover:border-oliveDeep'
                    }`}
                  >
                    <input
                      type="radio"
                      value={c.id}
                      {...form.register('categoryId')}
                      className="sr-only"
                    />
                    {c.label}
                  </label>
                );
              })}
            </div>
          </Field>

          <Field label="Bazaviy narx (USD)" required>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-display text-lg">
                $
              </span>
              <input
                type="number"
                step="1"
                min="1"
                {...form.register('basePriceUsd', { required: true, valueAsNumber: true, min: 1 })}
                className="input pl-9"
              />
            </div>
          </Field>
        </div>

        <Controller
          control={form.control}
          name="coverUrl"
          rules={{ required: true }}
          render={({ field }) => (
            <ImageUploader
              label="Muqova rasm"
              hint="Mahsulotning bosh rasmi. 3:4 nisbatda tavsiya etiladi."
              value={field.value ? [field.value] : []}
              onChange={(urls) => field.onChange(urls[0] ?? '')}
              max={1}
              aspect="portrait"
            />
          )}
        />
      </div>

      {/* Variants card */}
      <div className="card space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold text-oliveDeep">Variantlar</h2>
          <button
            type="button"
            onClick={() =>
              variants.append({
                color: 'Bejeviy',
                colorHex: '#D4C3A0',
                size: SIZES[0],
                priceUsd: form.getValues('basePriceUsd'),
                stock: 5,
                sku: '',
                images: [],
              })
            }
            className="btn-secondary h-10 px-4"
          >
            <Plus size={16} /> Variant qo'shish
          </button>
        </div>

        <div className="space-y-4">
          {variants.fields.map((field, idx) => (
            <div key={field.id} className="border border-rule rounded-2xl p-4 space-y-4">
              <div className="grid grid-cols-[auto_1fr_1fr_120px_100px_auto] gap-3 items-end">
                <label className="cursor-pointer">
                  <input
                    type="color"
                    {...form.register(`variants.${idx}.colorHex`)}
                    className="w-10 h-10 rounded-full border border-rule cursor-pointer"
                  />
                </label>
                <Field label="Rang nomi">
                  <input {...form.register(`variants.${idx}.color`)} className="input h-11" />
                </Field>
                <Field label="O'lcham">
                  <select {...form.register(`variants.${idx}.size`)} className="input h-11 pr-10">
                    {SIZES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Narx (USD)">
                  <input
                    type="number"
                    step="1"
                    {...form.register(`variants.${idx}.priceUsd`, { valueAsNumber: true })}
                    className="input h-11"
                    placeholder="Bazaviy"
                  />
                </Field>
                <Field label="Zaxira">
                  <input
                    type="number"
                    min="0"
                    {...form.register(`variants.${idx}.stock`, { valueAsNumber: true })}
                    className="input h-11"
                  />
                </Field>
                <button
                  type="button"
                  onClick={() => variants.remove(idx)}
                  disabled={variants.fields.length === 1}
                  className="h-11 w-11 grid place-items-center rounded-full text-muted hover:text-danger hover:bg-danger/5 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <Controller
                control={form.control}
                name={`variants.${idx}.images`}
                render={({ field }) => (
                  <ImageUploader
                    label="Variant rasmlari"
                    hint="Turli burchakdan ko'rinish (0-3 dona)"
                    value={field.value ?? []}
                    onChange={field.onChange}
                    max={3}
                    multiple
                    aspect="square"
                  />
                )}
              />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-ruleSoft">
          <div className="text-xs text-muted mr-2 uppercase tracking-wider self-center">Rang taxminlari:</div>
          {COLOR_PRESETS.map((c) => (
            <button
              key={c.hex}
              type="button"
              onClick={() => {
                const idx = variants.fields.length - 1;
                form.setValue(`variants.${idx}.color`, c.name);
                form.setValue(`variants.${idx}.colorHex`, c.hex);
              }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-rule text-xs hover:border-oliveDeep"
              title={c.name}
            >
              <span className="w-3 h-3 rounded-full" style={{ background: c.hex }} />
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end">
        <div className="flex gap-3">
          <button
            type="submit"
            onClick={() => setPublish(false)}
            className="btn-secondary"
            disabled={form.formState.isSubmitting}
          >
            Draft sifatida saqlash
          </button>
          <button
            type="submit"
            onClick={() => setPublish(true)}
            className="btn-gold"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Yuborilmoqda…' : "Moderatsiyaga jo'natish"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-medium text-ink2 uppercase tracking-wider">
        {label}
        {required && <span className="text-danger ml-1">*</span>}
      </div>
      {children}
      {hint && <div className="text-xs text-muted">{hint}</div>}
    </div>
  );
}
