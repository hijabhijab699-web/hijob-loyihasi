import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Akkauntni o'chirish · Hijob",
  description:
    "24:31 (Hijob) ilovasida akkauntingizni va unga bog'liq ma'lumotlarni o'chirish bo'yicha ko'rsatmalar.",
};

export default function DeleteAccountPage() {
  return (
    <main className="bg-white min-h-screen">
      <div className="container-main py-12 md:py-20 max-w-3xl">
        <header className="mb-10">
          <p className="text-xs uppercase tracking-widest text-muted mb-3">
            Yordam
          </p>
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-ink leading-tight">
            Akkauntni va ma&apos;lumotlarni o&apos;chirish
          </h1>
          <p className="mt-4 text-sm text-muted leading-relaxed">
            24:31 (Hijob) ilovasida akkauntingizni o&apos;chirish uchun quyidagi
            yo&apos;riqnomani kuzating. Developer: <strong>Umidjon Looksave Developer</strong>,
            email: <a href="mailto:info@hijob.uz" className="text-ink underline">info@hijob.uz</a>.
          </p>
        </header>

        <section className="space-y-6 mb-12">
          <h2 className="font-serif text-xl md:text-2xl font-semibold text-ink">
            1-usul: Ilova orqali o&apos;chirish (eng tez)
          </h2>
          <ol className="list-decimal pl-6 space-y-3 text-ink/80 leading-relaxed">
            <li>24:31 ilovasini oching va akkauntingizga kiring.</li>
            <li>Pastki navigatsiyadagi <strong>Profil</strong> tabiga o&apos;ting.</li>
            <li>
              <strong>Sozlamalar &rarr; Profil ma&apos;lumotlari</strong> ni oching.
            </li>
            <li>
              Pastga tushib <strong>&quot;Akkauntni o&apos;chirish&quot;</strong>{' '}
              tugmasini bosing.
            </li>
            <li>
              Chiqadigan tasdiqlash oynasida <strong>&quot;Ha, o&apos;chirish&quot;</strong>{' '}
              ni bosing.
            </li>
            <li>
              Akkauntingiz va unga bog&apos;liq barcha ma&apos;lumotlar <strong>30 kun</strong> ichida
              serverdan butunlay olib tashlanadi.
            </li>
          </ol>
        </section>

        <section className="space-y-6 mb-12">
          <h2 className="font-serif text-xl md:text-2xl font-semibold text-ink">
            2-usul: Email orqali so&apos;rov yuborish
          </h2>
          <p className="text-ink/80 leading-relaxed">
            Agar ilovaga kira olmayotgan bo&apos;lsangiz, bizga email yuboring:
          </p>
          <div className="rounded-lg border border-rule bg-surface2/50 p-5 space-y-2">
            <p className="text-ink">
              <strong>Email:</strong>{' '}
              <a href="mailto:info@hijob.uz" className="text-ink underline">
                info@hijob.uz
              </a>
            </p>
            <p className="text-ink">
              <strong>Mavzu:</strong> Akkauntni o&apos;chirish so&apos;rovi
            </p>
            <p className="text-ink">
              <strong>Xabar matnida:</strong> ro&apos;yxatdan o&apos;tgan telefon
              raqamingiz yoki username&apos;ingizni ko&apos;rsating.
            </p>
          </div>
          <p className="text-ink/80 leading-relaxed">
            Email bo&apos;yicha so&apos;rovlar <strong>3-5 ish kuni</strong> ichida
            qayta ishlanadi. Shaxsingizni tasdiqlash uchun qo&apos;shimcha
            savollar berishimiz mumkin.
          </p>
        </section>

        <section className="space-y-6 mb-12">
          <h2 className="font-serif text-xl md:text-2xl font-semibold text-ink">
            Qanday ma&apos;lumotlar o&apos;chiriladi
          </h2>
          <p className="text-ink/80 leading-relaxed">
            Akkaunt o&apos;chirilgandan keyin quyidagi ma&apos;lumotlar{' '}
            <strong>butunlay va qaytarib bo&apos;lmaydigan tarzda</strong> olib
            tashlanadi:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-ink/80 leading-relaxed">
            <li>Ism, familiya, telefon raqami, username, parol (hash);</li>
            <li>Yuz surati (selfie) va virtual primerka renderlari;</li>
            <li>Savat, sevimli mahsulotlar ro&apos;yxati;</li>
            <li>Yetkazib berish manzillari;</li>
            <li>Qurilma identifikatori va sessiya tokenlari.</li>
          </ul>
        </section>

        <section className="space-y-6 mb-12">
          <h2 className="font-serif text-xl md:text-2xl font-semibold text-ink">
            Qanday ma&apos;lumotlar saqlanadi
          </h2>
          <p className="text-ink/80 leading-relaxed">
            Soliq va buxgalteriya qoidalariga ko&apos;ra, quyidagi ma&apos;lumotlar{' '}
            <strong>qonun talab qilgan muddat davomida</strong> (odatda 3-5 yil)
            saqlanadi:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-ink/80 leading-relaxed">
            <li>Yakunlangan buyurtmalarning moliyaviy yozuvlari (anonimlashtirilgan);</li>
            <li>
              Jarima, da&apos;vo yoki huquqiy jarayon bo&apos;lsa — tegishli yozuvlar.
            </li>
          </ul>
          <p className="text-ink/80 leading-relaxed">
            Bu ma&apos;lumotlar faqat qonuniy maqsadlarda saqlanadi va boshqa
            foydalanish uchun ishlatilmaydi.
          </p>
        </section>

        <section className="space-y-6 mb-12">
          <h2 className="font-serif text-xl md:text-2xl font-semibold text-ink">
            Muddatlar
          </h2>
          <ul className="list-disc pl-6 space-y-2 text-ink/80 leading-relaxed">
            <li>Shaxsiy ma&apos;lumotlar: <strong>30 kun</strong> ichida o&apos;chiriladi.</li>
            <li>Buyurtma yozuvlari: qonun talabiga ko&apos;ra <strong>3-5 yil</strong>.</li>
            <li>
              Log fayllar va texnik ma&apos;lumotlar: <strong>90 kun</strong>{' '}
              ichida avtomatik tozalanadi.
            </li>
          </ul>
        </section>

        <section className="space-y-4 bg-surface2/50 border border-rule rounded-xl p-6">
          <h2 className="font-serif text-xl font-semibold text-ink">
            Yordam kerakmi?
          </h2>
          <p className="text-ink/80 leading-relaxed">
            Agar savolingiz bo&apos;lsa, biz bilan bog&apos;laning:
          </p>
          <ul className="space-y-2 text-ink/80">
            <li>
              📧 Email:{' '}
              <a href="mailto:info@hijob.uz" className="text-ink underline">
                info@hijob.uz
              </a>
            </li>
            <li>
              📞 Telefon:{' '}
              <a href="tel:+998901234567" className="text-ink underline">
                +998 90 123 45 67
              </a>
            </li>
          </ul>
        </section>

        <p className="mt-10 text-xs text-muted">
          Oxirgi yangilanish:{' '}
          {new Date().toLocaleDateString('uz-UZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>
    </main>
  );
}
