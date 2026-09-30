import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/components/QueryProvider';

export const metadata: Metadata = {
  title: 'N24:31 · Sotuvchi paneli',
  description: "Do'kon boshqaruv paneli — mahsulotlar, buyurtmalar, statistika",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
