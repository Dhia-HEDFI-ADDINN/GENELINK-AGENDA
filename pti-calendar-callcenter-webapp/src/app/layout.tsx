import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import '@pti-calendar/design-system/styles/globals.css';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PTI Calendar - Centre d\'appels',
  description: 'Interface call center pour la prise de RDV',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}><Providers>{children}</Providers></body>
    </html>
  );
}
