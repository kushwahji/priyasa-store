'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const nav = [
  ['NEW IN', '/shop?sort=newest'],
  ['WOMEN', '/shop?category=women'],
  ['ETHNIC', '/shop?category=ethnic-wear'],
  ['DRESSES', '/shop?category=dresses'],
  ['NIGHTWEAR', '/shop?category=nightwear'],
  ['ACTIVEWEAR', '/shop?category=activewear'],
  ['LINGERIE', '/shop?category=lingerie'],
  ['SALE', '/shop?sort=discount'],
] as const;

export default function StoreShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [menu, setMenu] = useState(false);

  useEffect(() => setMenu(false), [pathname]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const value = query.trim();
    window.location.href = value ? `/search?q=${encodeURIComponent(value)}` : '/search';
  }

  return (
    <>
      <div className="announcement">FREE SHIPPING ABOVE ₹999 <i /> COD AVAILABLE <i /> EASY RETURNS <i /> SECURE PAYMENTS</div>
      <header className="header">
        <div className="headerInner">
          <button className="iconButton menuButton" aria-label="Open menu" onClick={() => setMenu(true)}>☰</button>
          <Link className="logo" href="/" aria-label="PRIYASA home">PRIYASA<span>EVERY YOU, BEAUTIFUL</span></Link>
          <nav className="desktopNav" aria-label="Primary navigation">
            {nav.map(([label, href]) => <Link className={pathname === href ? 'active' : ''} key={label} href={href}>{label}</Link>)}
          </nav>
          <form className="headerSearch" onSubmit={submitSearch} role="search">
            <span>⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products, styles & categories" aria-label="Search products" />
          </form>
          <div className="headerActions">
            <Link href="/account"><b>♙</b><small>Profile</small></Link>
            <Link href="/wishlist"><b>♡</b><small>Wishlist</small></Link>
            <Link href="/cart"><b>♧</b><small>Bag</small></Link>
          </div>
        </div>
      </header>
      {menu && <div className="mobileMenuBackdrop" onClick={() => setMenu(false)}><aside className="mobileMenu" onClick={e => e.stopPropagation()}><div className="mobileMenuHead"><strong>PRIYASA</strong><button onClick={() => setMenu(false)} aria-label="Close menu">×</button></div><form onSubmit={submitSearch}><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search styles" /><button>Search</button></form>{nav.map(([label, href]) => <Link key={label} href={href}>{label}<span>›</span></Link>)}<Link href="/account">My Account<span>›</span></Link><Link href="/orders">My Orders<span>›</span></Link></aside></div>}
      <main>{children}</main>
      <footer className="footer"><div><Link className="logo footerLogo" href="/">PRIYASA</Link><p>Contemporary Indian fashion, everyday essentials and occasion-ready edits.</p></div><div><strong>SHOP</strong><Link href="/shop">All products</Link><Link href="/shop?sort=newest">New arrivals</Link><Link href="/shop?sort=discount">Sale</Link></div><div><strong>HELP</strong><Link href="/account">Account</Link><Link href="/orders">Orders</Link><Link href="/support">Support</Link></div><div><strong>POLICIES</strong><Link href="/shipping">Shipping</Link><Link href="/returns">Returns</Link><Link href="/privacy">Privacy</Link></div><div className="footerBottom">© {new Date().getFullYear()} PRIYASA. All rights reserved.</div></footer>
      <nav className="bottomNav" aria-label="Mobile navigation"><Link href="/" className={pathname === '/' ? 'active' : ''}><b>⌂</b><span>Home</span></Link><Link href="/search"><b>⌕</b><span>Search</span></Link><Link href="/shop"><b>▦</b><span>Shop</span></Link><Link href="/wishlist"><b>♡</b><span>Wishlist</span></Link><Link href="/cart"><b>♧</b><span>Bag</span></Link></nav>
    </>
  );
}
