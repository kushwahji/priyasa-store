import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={title:{default:'PRIYASA — Every You, Beautiful',template:'%s | PRIYASA'},description:'PRIYASA fashion storefront',themeColor:'#ff3f6c'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
