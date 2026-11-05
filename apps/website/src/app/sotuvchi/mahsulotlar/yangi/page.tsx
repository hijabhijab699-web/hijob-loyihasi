import Link from 'next/link';
import { Smartphone, Download } from 'lucide-react';

export const metadata = { title: "Yangi mahsulot — 24:31 Sotuvchi" };

// First seller-panel pass gives read-only parity with the mobile app.
// Product creation needs the same photo + attribute flow the mobile
// seller-tabs ships (gallery picker, mannequin preview, ML garment
// classifier, submit-for-review). Until that's ported, send the
// seller to the mobile app rather than half-building a form here.
export default function NewProductPage() {
  return (
    <div className="bg-white border border-rule-light rounded-2xl p-8 md:p-10 text-center max-w-xl mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-4">
        <Smartphone className="w-7 h-7 text-brand-dark" />
      </div>
      <h2 className="font-serif text-2xl font-bold text-ink">
        Yangi mahsulot qo&apos;shish — 24:31 ilovasida
      </h2>
      <p className="text-sm text-ink-muted mt-3 leading-relaxed">
        Mahsulot qo&apos;shish uchun telefoningizdagi 24:31 ilovasini oching.
        Rasm, o&apos;lchov va narxlarni kiriting, tekshiruvga yuboring — bu yerda
        bir necha daqiqadan keyin paydo bo&apos;ladi. Veb orqali qo&apos;shish
        yaqin orada qo&apos;shiladi.
      </p>
      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href="https://apps.apple.com/app/id6475283049"
          target="_blank"
          rel="noreferrer"
          className="btn-primary inline-flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          App Store&apos;dan yuklash
        </a>
        <Link
          href="/sotuvchi/mahsulotlar"
          className="btn-outline inline-flex items-center justify-center"
        >
          Orqaga
        </Link>
      </div>
    </div>
  );
}
