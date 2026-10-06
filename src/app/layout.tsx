import type { Metadata, Viewport } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SiteStructuredData } from '@/components/StructuredData';
import { pageMetadata, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/seo';
import { fullName, headline } from '@/data/profile';
import { IBM_Plex_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';

/* Inter Tight (OFL), latin subset, four static weights, self-hosted so dev and build never depend on a network fetch. */
const sans = localFont({ src: [
    { path: '../../public/fonts/InterTight-400.woff2', weight: '400', style: 'normal' },
    { path: '../../public/fonts/InterTight-500.woff2', weight: '500', style: 'normal' },
    { path: '../../public/fonts/InterTight-600.woff2', weight: '600', style: 'normal' },
    { path: '../../public/fonts/InterTight-700.woff2', weight: '700', style: 'normal' },
  ], variable: '--font-sans', display: 'swap', fallback: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'] });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  ...pageMetadata({ title: `${fullName} — ${headline}`, description: SITE_DESCRIPTION, path: '/' }),
  title: {
    default: SITE_NAME,
    template: `%s — ${SITE_NAME}`,
  },
  metadataBase: new URL(SITE_URL),
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  colorScheme: 'light',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <a className="skip" href="#main-content">Skip to content</a>
        <SiteStructuredData />
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
