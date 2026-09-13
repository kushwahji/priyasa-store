import type { Metadata } from 'next';
import './globals.css';
import StoreShell from '@/components/StoreShell';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_STORE_URL || 'http://localhost:3000'),
  title: { default: 'PRIYASA — Every You, Beautiful', template: '%s | PRIYASA' },
  description: 'Discover contemporary Indian fashion, everyday essentials and occasion-ready edits from PRIYASA.',
  themeColor: '#ff3f6c',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><StoreShell>{children}</StoreShell></body></html>;
}
