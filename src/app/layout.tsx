import type { Metadata } from 'next';
import './globals.css';
import './responsive-overrides.css';
import './home-dynamic.css';
import StoreShell from '@/components/StoreShell';

const siteUrl = (process.env.NEXT_PUBLIC_STORE_URL || 'http://localhost:3000').replace(/\/$/, '');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'PRIYASA — Every You, Beautiful', template: '%s | PRIYASA' },
  description: 'Discover contemporary Indian fashion, everyday essentials and occasion-ready edits from PRIYASA.',
  applicationName: 'PRIYASA',
  themeColor: '#282c3f',
  icons: { icon: '/icon.svg', shortcut: '/icon.svg', apple: '/icon.svg' },
  alternates: { canonical: '/' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
  openGraph: {
    type: 'website',
    siteName: 'PRIYASA',
    title: 'PRIYASA — Every You, Beautiful',
    description: 'Contemporary Indian fashion and everyday essentials.',
    url: siteUrl,
  },
  twitter: {
    card: 'summary',
    title: 'PRIYASA — Every You, Beautiful',
    description: 'Contemporary Indian fashion and everyday essentials.',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><StoreShell>{children}</StoreShell></body></html>;
}
