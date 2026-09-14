'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const nav = [
  ['NEW IN', '/shop?sort=newest'], ['WOMEN', '/shop?category=women'], ['ETHNIC', '/shop?category=ethnic-wear'],
  ['DRESSES', '/shop?category=dresses'], ['NIGHTWEAR', '/shop?category=nightwear'], ['ACTIVEWEAR', '/shop?category=activewear'],
  ['LINGERIE', '/shop?category=lingerie'], ['SALE', '/shop?sort=discount'],
] as const;
const protectedPrefixes = ['/account', '/orders', '/cart', '/wishlist', '/addresses', '/checkout', '/support', '/returns', '/notifications'];

function BrandLogo({ footer = false }: { footer?: boolean }) {
  return <Link className={`logo${footer ? ' footerLogo' : ''}`} href="/" aria-label="PRIYASA home"><img src="/brand/priyasa-logo.svg" alt="PRIYASA — Every You, Beautiful" /></Link>;
}

export default function StoreShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [menu, setMenu] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const protectedRoute = protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  useEffect(() => setMenu(false), [pathname]);
  useEffect(() => {
    let active = true;
    if (!protectedRoute) { setSessionChecked(true); return () => { active = false; }; }
    setSessionChecked(false);
    fetch('/api/session', { credentials: 'include', cache: 'no-store' })
      .then(async (response) => ({ ok: response.ok, body: await response.json().catch(() => null) }))
      .then(({ ok, body }) => {
        if (!active) return;
        if (ok && body?.authenticated === true) { setSessionChecked(true); return; }
        const next = `${window.location.pathname}${window.location.search}`;
        window.location.replace(`/auth/login?next=${encodeURIComponent(next)}`);
      })
      .catch(() => {
        if (!active) return;
        const next = `${window.location.pathname}${window.location.search}`;
        window.location.replace(`/auth/login?next=${encodeURIComponent(next)}`);
      });
    return () => { active = false; };
  }, [protectedRoute, pathname]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault(); const value = query.trim(); window.location.href = value ? `/search?q=${encodeURIComponent(value)}` : '/search';
  }
  if (protectedRoute && !sessionChecked) return <main className="accountPage"><section className="authCard"><p className="muted">Checking your PRIYASA session…</p></section></main>;

  return <>
    <div className="announcement">FREE SHIPPING ABOVE ₹999 <i /> COD AVAILABLE <i /> EASY RETURNS <i /> SECURE PAYMENTS</div>
    <header className="header"><div className="headerInner">
      <button className="iconButton menuButton" aria-label="Open menu" onClick={() => setMenu(true)}>☰</button><BrandLogo />
      <nav className="desktopNav" aria-label="Primary navigation">{nav.map(([label, href]) => <Link className={pathname === href ? 'active' : ''} key={label} href={href}>{label}</Link>)}</nav>
      <form className="headerSearch" onSubmit={submitSearch} role="search"><span>⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products, styles & categories" aria-label="Search products" /></form>
      <div className="headerActions"><Link href="/account"><b>♙</b><small>Profile</small></Link><Link href="/wishlist"><b>♡</b><small>Wishlist</small></Link><Link href="/cart"><b>♧</b><small>Bag</small></Link></div>
    </div></header>
    {menu && <div className="mobileMenuBackdrop" onClick={() => setMenu(false)}><aside className="mobileMenu" onClick={e => e.stopPropagation()}><div className="mobileMenuHead"><BrandLogo /><button onClick={() => setMenu(false)} aria-label="Close menu">×</button></div><form onSubmit={submitSearch}><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search styles" /><button>Search</button></form>{nav.map(([label, href]) => <Link key={label} href={href}>{label}<span>›</span></Link>)}<Link href="/account">My Account<span>›</span></Link><Link href="/orders">My Orders<span>›</span></Link><Link href="/returns">Returns & refunds<span>›</span></Link></aside></div>}
    <main>{children}</main>
    <footer className="footer"><div><BrandLogo footer /><p>Contemporary Indian fashion, everyday essentials and occasion-ready edits.</p></div><div><strong>SHOP</strong><Link href="/shop">All products</Link><Link href="/shop?sort=newest">New arrivals</Link><Link href="/shop?sort=discount">Sale</Link></div><div><strong>HELP</strong><Link href="/account">Account</Link><Link href="/orders">Orders</Link><Link href="/support">Support</Link><Link href="/notifications">Notifications</Link></div><div><strong>POLICIES</strong><Link href="/shipping">Shipping</Link><Link href="/returns">Returns</Link><Link href="/privacy">Privacy</Link></div><div className="footerBottom">© {new Date().getFullYear()} PRIYASA. All rights reserved.</div></footer>
    <nav className="bottomNav" aria-label="Mobile navigation"><Link href="/" className={pathname === '/' ? 'active' : ''}><b>⌂</b><span>Home</span></Link><Link href="/search"><b>⌕</b><span>Search</span></Link><Link href="/shop"><b>▦</b><span>Shop</span></Link><Link href="/wishlist"><b>♡</b><span>Wishlist</span></Link><Link href="/cart"><b>♧</b><span>Bag</span></Link></nav>
  </>;
}
