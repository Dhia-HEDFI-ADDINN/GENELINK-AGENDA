import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import '@pti-calendar/design-system/styles/globals.css';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PTI Calendar - Réservation de contrôle technique',
  description: 'Réservez votre contrôle technique en ligne. Plus de 2000 centres SGS en France.',
  keywords: ['contrôle technique', 'SGS', 'réservation', 'véhicule', 'automobile'],
  authors: [{ name: 'SGS France' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'PTI Calendar - Réservation de contrôle technique',
    description: 'Réservez votre contrôle technique en ligne',
    type: 'website',
    locale: 'fr_FR',
  },
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
