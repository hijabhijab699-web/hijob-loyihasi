import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Foydalanish shartlari · 24:31 Hijob',
  description:
    "24:31 Hijob ilovasi va 2431.uz saytidan foydalanish shartlari. Marketpleys qoidalari, buyurtma, to'lov, yetkazib berish va qaytarish shartlari.",
};

export default function TermsPage() {
  const sections = [
    {
      title: '1. Umumiy qoidalar',
      body: (
        <>
          <p>
            Ushbu Foydalanish shartlari (keyingi o&apos;rinda &quot;Shartlar&quot;) 24:31 Hijob
            mobil ilovasi va <strong>2431.uz</strong> veb-sayti (keyingi o&apos;rinda
            &quot;Xizmat&quot;) orqali amalga oshiriladigan barcha huquqiy munosabatlarni
            tartibga soladi.
          </p>
          <p>
            Xizmatdan foydalanish, ro&apos;yxatdan o&apos;tish yoki buyurtma berish orqali Siz
            ushbu Shartlarning barcha qoidalariga rozilik bildirasiz. Agar Shartlar bilan
            rozi bo&apos;lmasangiz — Xizmatdan foydalanmang.
          </p>
          <p>
            Xizmat Operatori O&apos;zbekiston Respublikasida ro&apos;yxatdan o&apos;tgan va
            uning qonunchiligiga muvofiq ish yuritadi.
          </p>
        </>
      ),
    },
    {
      title: '2. Xizmat tavsifi',
      body: (
        <>
          <p>
            24:31 Hijob — modest (hijob) kiyimlari va aksessuarlariga ixtisoslashgan
            marketpleys. Xizmat quyidagi imkoniyatlarni taqdim etadi:
          </p>
          <ul>
            <li>Ro&apos;mollar, ko&apos;ylaklar, abayalar, sumkalar va aksessuarlarni ko&apos;rish va sotib olish</li>
            <li>Virtual AI-primerka (sun&apos;iy intellekt yordamida kiyimni sinab ko&apos;rish)</li>
            <li>Sotuvchilar bilan savat va chat orqali muloqot</li>
            <li>Buyurtma va yetkazib berishni kuzatish</li>
            <li>Sotuvchilar uchun — o&apos;z mahsulotlarini joylashtirish va buyurtmalarni boshqarish</li>
          </ul>
        </>
      ),
    },
    {
      title: '3. Ro\'yxatdan o\'tish va akkaunt',
      body: (
        <>
          <p>
            Buyurtma berish va AI-primerka funksiyalaridan foydalanish uchun ro&apos;yxatdan
            o&apos;tish talab qilinadi. Ro&apos;yxatdan o&apos;tganda to&apos;g&apos;ri va
            dolzarb ma&apos;lumotlar berishingiz shart.
          </p>
          <p>
            Siz o&apos;z akkauntingiz xavfsizligi — parol, SMS-kod va qurilmaga kirish —
            uchun to&apos;liq javobgarsiz. Akkauntga ruxsatsiz kirish holatini sezsangiz,
            darhol bizga xabar bering.
          </p>
          <p>
            Akkauntni o&apos;chirish — <a href="/akkauntni-ochirish" className="text-ink underline">akkauntni o&apos;chirish sahifasi</a> orqali amalga oshiriladi.
          </p>
        </>
      ),
    },
    {
      title: '4. Buyurtma va to\'lov',
      body: (
        <>
          <p>
            Mahsulot narxlari ilovada va saytda O&apos;zbekiston so&apos;mida ko&apos;rsatiladi
            va soliqlarni o&apos;z ichiga oladi. Narx buyurtma rasmiylashtirilgan paytdagi
            qiymatda qotirib qo&apos;yiladi.
          </p>
          <p>
            To&apos;lov usullari: Payme, Click, Uzcard/Humo plastik kartalar, naqd
            (kuryerga yetkazib berishda).
          </p>
          <p>
            Buyurtma sotuvchi tomonidan tasdiqlangandan so&apos;ng kuchga kiradi. Sotuvchi
            tovar yo&apos;qligi yoki boshqa sabablarga ko&apos;ra buyurtmani rad etishi
            mumkin — bu holda to&apos;lov to&apos;liq qaytariladi.
          </p>
        </>
      ),
    },
    {
      title: '5. Yetkazib berish',
      body: (
        <>
          <p>
            Yetkazib berish O&apos;zbekiston Respublikasi hududi bo&apos;ylab amalga
            oshiriladi. Yetkazib berish narxi va muddati manzilga qarab buyurtma berish
            paytida ko&apos;rsatiladi.
          </p>
          <p>
            Toshkent shahri — odatda 1–2 ish kuni, viloyatlar — 2–5 ish kuni. Muddatlar
            logistika sheriklariga bog&apos;liq va kafolatlanmagan taxminiy ko&apos;rsatkichdir.
          </p>
        </>
      ),
    },
    {
      title: '6. Qaytarish va almashtirish',
      body: (
        <>
          <p>
            Tovarni qabul qilgandan so&apos;ng <strong>14 kalendar kun</strong> ichida
            qaytarish mumkin. Shartlar:
          </p>
          <ul>
            <li>Tovar kiyilmagan, yuvilmagan, zararlanmagan holatda bo&apos;lishi</li>
            <li>Barcha teg va yorliqlar saqlanishi</li>
            <li>Original qadoqda bo&apos;lishi</li>
            <li>Chek yoki buyurtma raqami ko&apos;rsatilishi</li>
          </ul>
          <p>
            Ichki kiyim, parfyumeriya va shaxsiy gigiyena mahsulotlari gigiyenik sabablarga
            ko&apos;ra qaytarilmaydi. Qaytarish xarajati — sotuvchi aybi bo&apos;lsa bizning
            hisobimizda, aks holda xaridor hisobidan.
          </p>
        </>
      ),
    },
    {
      title: "7. AI-primerka xizmati",
      body: (
        <>
          <p>
            Virtual AI-primerka — tovarni oldindan baholash uchun yordamchi vosita. AI
            tomonidan yaratilgan tasvir faqat taxminiy va mahsulotning haqiqiy
            ko&apos;rinishi, o&apos;lchami va rangidan farq qilishi mumkin.
          </p>
          <p>
            Yuklangan selfi faqat sizning mannequin-ko&apos;rinishingizni yaratish uchun
            ishlatiladi. Rasmlar <a href="/maxfiylik" className="text-ink underline">Maxfiylik siyosati</a> ga muvofiq saqlanadi va uchinchi shaxslarga berilmaydi.
          </p>
        </>
      ),
    },
    {
      title: "8. Foydalanuvchining majburiyatlari",
      body: (
        <>
          <p>Xizmatdan foydalanganda siz quyidagilarga rozilik bildirasiz:</p>
          <ul>
            <li>Yolg&apos;on yoki boshqa shaxsga tegishli ma&apos;lumot kiritmaslik</li>
            <li>Platformada noqonuniy, haqoratomuz yoki axloqsiz kontent joylashtirmaslik</li>
            <li>Xizmatning texnik ishlashiga xalaqit beruvchi avtomatlashgan vositalardan foydalanmaslik</li>
            <li>Boshqa foydalanuvchilarning huquqlarini hurmat qilish</li>
          </ul>
          <p>
            Qoidabuzarlik sodir etilsa, biz akkauntingizni ogohlantirishsiz bloklash va
            tegishli holatlarda huquqni muhofaza qiluvchi organlarga xabar berish
            huquqini saqlab qolamiz.
          </p>
        </>
      ),
    },
    {
      title: "9. Sotuvchilar uchun shartlar",
      body: (
        <>
          <p>
            Sotuvchi sifatida ro&apos;yxatdan o&apos;tgan foydalanuvchilar quyidagilarga
            javobgardir:
          </p>
          <ul>
            <li>Mahsulot tavsifi va rasmlarining haqiqiyligi</li>
            <li>Tovarning sifati va xavfsizligi</li>
            <li>Buyurtmalarni o&apos;z vaqtida bajarish</li>
            <li>Xaridor bilan muloyim muomala va shikoyatlarni hal qilish</li>
            <li>O&apos;zbekiston Respublikasi qonunchiligiga muvofiq soliq to&apos;lovlari</li>
          </ul>
          <p>
            Platforma sotuvdan belgilangan komissiyani oladi. Komissiya miqdori sotuvchi
            paneli orqali e&apos;lon qilinadi.
          </p>
        </>
      ),
    },
    {
      title: "10. Intellektual mulk",
      body: (
        <>
          <p>
            24:31, 24:31 Hijob, 2431.uz brendlari, logo, dizayn, dasturiy kod va boshqa
            kontent Xizmat Operatoriga tegishli bo&apos;lib, mualliflik huquqi va tovar
            belgisi qonunlari bilan himoyalangan.
          </p>
          <p>
            Sotuvchilar joylashtirgan mahsulot rasmlari va matnlari sotuvchiga tegishli;
            ammo ularni platformada ko&apos;rsatish va reklama qilish uchun bizga noeksklyuziv
            litsenziya beriladi.
          </p>
        </>
      ),
    },
    {
      title: "11. Javobgarlikning cheklanishi",
      body: (
        <>
          <p>
            Xizmat &quot;borligi sharoitida&quot; (as-is) taqdim etiladi. Biz Xizmatning
            uzluksiz, xatosiz ishlashini kafolatlamaymiz, ammo uning sifatini oshirish
            uchun doimiy harakat qilamiz.
          </p>
          <p>
            Fors-majorlar (tabiiy ofatlar, interneting uzilishi, davlat organlari
            qarorlari), texnik nosozliklar yoki uchinchi tomon xizmatlarining ishlamay
            qolishi natijasida yetkazilgan zararlar uchun biz javob bermaymiz.
          </p>
        </>
      ),
    },
    {
      title: "12. Shartlarga o'zgartirishlar",
      body: (
        <>
          <p>
            Biz ushbu Shartlarga istalgan vaqtda o&apos;zgartirish kiritish huquqimizni
            saqlab qolamiz. Muhim o&apos;zgarishlar bo&apos;lsa, foydalanuvchilarni ilova va
            email orqali xabardor qilamiz.
          </p>
          <p>
            Shartlarga o&apos;zgartirish kiritilganidan keyin Xizmatdan foydalanishda davom
            etish — yangi Shartlarga roziligingizni bildiradi.
          </p>
        </>
      ),
    },
    {
      title: "13. Tatbiq etiladigan qonun va nizolar",
      body: (
        <>
          <p>
            Ushbu Shartlar O&apos;zbekiston Respublikasi qonunchiligiga muvofiq talqin
            qilinadi. Tomonlar o&apos;rtasidagi nizolar avval muzokaralar yo&apos;li bilan
            hal qilinadi; kelishuvga erishilmasa — Toshkent shahri sudlariga murojaat
            qilinadi.
          </p>
        </>
      ),
    },
    {
      title: "14. Bog'lanish",
      body: (
        <>
          <p>Shartlar yoki Xizmat haqida savollar bo&apos;lsa, biz bilan bog&apos;laning:</p>
          <ul>
            <li>
              Email:{' '}
              <a href="mailto:hijabhijab699@gmail.com" className="text-ink underline">
                hijabhijab699@gmail.com
              </a>
            </li>
            <li>
              Instagram:{' '}
              <a
                href="https://www.instagram.com/2431.uz/"
                target="_blank"
                rel="noreferrer"
                className="text-ink underline"
              >
                @2431.uz
              </a>
            </li>
            <li>Manzil: Toshkent, O&apos;zbekiston</li>
          </ul>
        </>
      ),
    },
  ];

  return (
    <main className="bg-white min-h-screen">
      <div className="container-main py-12 md:py-20 max-w-4xl">
        <header className="mb-10">
          <p className="text-xs uppercase tracking-widest text-muted mb-3">
            Hujjat
          </p>
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-ink leading-tight">
            Foydalanish shartlari
          </h1>
          <p className="mt-4 text-sm text-muted">
            Oxirgi yangilanish:{' '}
            {new Date().toLocaleDateString('uz-UZ', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </header>

        <div className="prose prose-sm md:prose-base max-w-none text-ink/80 space-y-10">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="font-serif text-xl md:text-2xl font-semibold text-ink mb-3">
                {s.title}
              </h2>
              <div className="space-y-3 leading-relaxed">{s.body}</div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
