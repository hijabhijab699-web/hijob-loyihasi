import type { Metadata } from 'next';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { ScrollReveal } from '@/components/ScrollReveal';
import { Providers } from '@/components/providers/Providers';

// Serif = Playfair Display to match the mobile app's display font
// (packages/design-tokens/src/typography.ts). All headline / display
// copy on the site renders through this variable.
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-serif',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "24:31 Hijab — Modest kiyimlar marketpleysi",
  description:
    "Ro'mollar, abayalar, ko'ylaklar va aksessuarlar. AI virtual primerka bilan onlayn tanlang.",
  icons: {
    icon: [
      { url: '/logo.png', type: 'image/png' },
    ],
    apple: [
      { url: '/logo.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="font-sans text-ink antialiased">
        <Providers>
          <ScrollReveal />
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <MobileBottomNav />
        </Providers>
      </body>
    </html>
  );
}
