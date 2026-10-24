import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Maxfiylik siyosati · Hijob',
  description:
    "Hijob ilovasi va 2431.uz saytining shaxsiy ma'lumotlarni qayta ishlash siyosati. Qanday ma'lumotlarni to'playmiz, nimaga ishlatamiz va kim bilan baham ko'ramiz.",
};

export default function PrivacyPage() {
  const sections = [
    {
      title: '1. Umumiy qoidalar',
      body: (
        <>
          <p>
            Ushbu Maxfiylik siyosati Hijob (24:31) mobil ilovasi va <strong>2431.uz</strong> veb-sayti
            (keyingi o&apos;rinda &quot;Xizmat&quot;) foydalanuvchilarining shaxsiy ma&apos;lumotlarini
            qayta ishlash tartibini belgilaydi.
          </p>
          <p>
            Xizmatdan foydalanish orqali Siz ushbu siyosatning barcha shartlariga rozilik bildirasiz.
            Agar siz shartlar bilan rozi bo&apos;lmasangiz, iltimos, Xizmatdan foydalanmang.
          </p>
        </>
      ),
    },
    {
      title: "2. Qanday ma'lumotlarni to'playmiz",
      body: (
        <>
          <p>Biz quyidagi ma&apos;lumotlarni to&apos;playmiz:</p>
          <ul>
            <li>
              <strong>Ro&apos;yxatdan o&apos;tish ma&apos;lumotlari:</strong> ism, familiya, telefon
              raqami, username, parol (shifrlangan).
            </li>
            <li>
              <strong>Virtual primerka uchun biometrik ma&apos;lumot:</strong> yuzingiz surati
              (selfie). Bu rasm faqat sizning qurilmangizda va bizning xavfsiz serverimizda saqlanadi.
            </li>
            <li>
              <strong>Buyurtma ma&apos;lumotlari:</strong> yetkazib berish manzili, savat
              tarkibi, to&apos;lov holati.
            </li>
            <li>
              <strong>Qurilma ma&apos;lumotlari:</strong> qurilma turi, operatsion tizim versiyasi,
              IP-manzil, ilova versiyasi.
            </li>
            <li>
              <strong>Kameradan foydalanish:</strong> AI primerka va mahsulot skaneri uchun
              faqat sizning ruxsatingiz bilan.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "3. Ma'lumotlardan qanday foydalanamiz",
      body: (
        <>
          <p>To&apos;plangan ma&apos;lumotlarni biz quyidagi maqsadlarda ishlatamiz:</p>
          <ul>
            <li>AI virtual primerka xizmatini taqdim etish (yuz tasvirini mannequinga qo&apos;yish).</li>
            <li>Buyurtmalarni qabul qilish, yetkazib berish va to&apos;lovlarni amalga oshirish.</li>
            <li>Hisobingiz xavfsizligini ta&apos;minlash va firibgarlikdan himoya qilish.</li>
            <li>Sizga mahsulot tavsiyalari va shaxsiylashtirilgan tajriba ko&apos;rsatish.</li>
            <li>Xizmat sifatini yaxshilash va yangi funksiyalar yaratish.</li>
            <li>Qonun talablariga javob berish.</li>
          </ul>
        </>
      ),
    },
    {
      title: "4. Ma'lumotlarni kim bilan baham ko'ramiz",
      body: (
        <>
          <p>Biz Sizning shaxsiy ma&apos;lumotlaringizni sotmaymiz. Faqat quyidagi hollarda uchinchi tomonlar bilan baham ko&apos;rishimiz mumkin:</p>
          <ul>
            <li>
              <strong>Sotuvchilar</strong> — buyurtma yetkazib berish uchun yetkazib berish manzili.
            </li>
            <li>
              <strong>To&apos;lov tizimlari (Click, Payme, Humo, Uzcard):</strong> to&apos;lovni
              amalga oshirish uchun kerakli ma&apos;lumotlar.
            </li>
            <li>
              <strong>Qonun organlari</strong> — faqat qonuniy so&apos;rov bo&apos;lgan taqdirda.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "5. Ma'lumotlarni saqlash va xavfsizlik",
      body: (
        <>
          <p>
            Shaxsiy ma&apos;lumotlaringiz TLS/HTTPS orqali shifrlangan holda uzatiladi va xavfsiz
            serverlarda saqlanadi. Yuzingiz surati va boshqa biometrik ma&apos;lumotlar qo&apos;shimcha
            shifrlash qatlami bilan himoyalangan.
          </p>
          <p>
            Siz hisobingizdan chiqib ketganingizda yoki uni o&apos;chirganingizda, shaxsiy
            ma&apos;lumotlaringiz 30 kun ichida tizimdan o&apos;chiriladi (qonun talab qilgan
            holatlarda bundan mustasno).
          </p>
        </>
      ),
    },
    {
      title: '6. Sizning huquqlaringiz',
      body: (
        <>
          <p>Siz har qanday vaqtda quyidagi huquqlardan foydalanishingiz mumkin:</p>
          <ul>
            <li>O&apos;zingiz haqingizdagi ma&apos;lumotlarni ko&apos;rish va ularni o&apos;zgartirish.</li>
            <li>Yuz surati (selfie) ni o&apos;chirish — profil sahifasidan.</li>
            <li>Hisobingizni butunlay o&apos;chirish — bu bilan barcha ma&apos;lumotlaringiz tizimdan olib tashlanadi.</li>
            <li>Marketing xabarlariga obunani bekor qilish.</li>
            <li>Ma&apos;lumotlaringiz qanday ishlatilayotgani haqida so&apos;rov yuborish.</li>
          </ul>
        </>
      ),
    },
    {
      title: '7. Bolalar maxfiyligi',
      body: (
        <p>
          Xizmatimiz 13 yoshdan katta foydalanuvchilar uchun mo&apos;ljallangan. Biz bilib turib 13
          yoshdan kichik bolalardan shaxsiy ma&apos;lumot to&apos;plamaymiz. Agar bola
          ma&apos;lumotini noto&apos;g&apos;ri yig&apos;ganimizni bilsangiz, iltimos, biz bilan
          bog&apos;laning.
        </p>
      ),
    },
    {
      title: '8. Siyosat o&apos;zgarishlari',
      body: (
        <p>
          Biz ushbu Maxfiylik siyosatini vaqti-vaqti bilan yangilashimiz mumkin. Har qanday
          o&apos;zgarish ushbu sahifada e&apos;lon qilinadi. Muhim o&apos;zgarishlar haqida
          foydalanuvchilarga ilova yoki email orqali xabar beramiz.
        </p>
      ),
    },
    {
      title: '9. Biz bilan bog\'lanish',
      body: (
        <>
          <p>Agar Sizda savollar bo&apos;lsa, biz bilan bog&apos;laning:</p>
          <ul>
            <li>Email: <a href="mailto:info@hijob.uz" className="text-ink underline">info@hijob.uz</a></li>
            <li>Telefon: <a href="tel:+998901234567" className="text-ink underline">+998 90 123 45 67</a></li>
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
            Maxfiylik siyosati
          </h1>
          <p className="mt-4 text-sm text-muted">
            Oxirgi yangilanish: {new Date().toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </header>

        <div className="prose prose-sm md:prose-base max-w-none text-ink/80 space-y-10">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="font-serif text-xl md:text-2xl font-semibold text-ink mb-3">
                {s.title}
              </h2>
              <div className="space-y-3 leading-relaxed">
                {s.body}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
