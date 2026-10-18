import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'N24:31 · Admin',
  description: 'Platforma admin paneli',
};

// Root layout keeps the shell minimal so both the login page (no auth) and
// the (dashboard) route group (gated) can live under it. Any auth-sensitive
// chrome belongs in (dashboard)/layout.tsx.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body>{children}</body>
    </html>
  );
}
