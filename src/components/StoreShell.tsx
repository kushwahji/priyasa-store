'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

const nav = [
  ['NEW IN', '/shop?sort=newest'], ['WOMEN', '/shop?category=women'], ['ETHNIC', '/shop?category=ethnic-wear'], ['DRESSES', '/shop?category=dresses'], ['NIGHTWEAR', '/shop?category=nightwear'], ['ACTIVEWEAR', '/shop?category=activewear'], ['LINGERIE', '/shop?category=lingerie'], ['SALE', '/shop?sort=discount'],
] as const;

type Suggestion = { text: string; query?: string; category?: string };
function parseSuggestions(json: any): Suggestion[] {
  const items = json?.data?.items || json?.items || [];
  if (!Array.isArray(items)) return [];
  return items.map((item: any) => typeof item === 'string' ? { text: item } : { text: String(item.text || item.query || item.name || '').trim(), query: item.query ? String(item.query) : undefined, category: item.category ? String(item.category) : undefined }).filter((x: Suggestion) => x.text).slice(0, 6);
}

export default function StoreShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [menu, setMenu] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => setMenu(false), [pathname]);
  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) { abortRef.current?.abort(); setSuggestions([]); return; }
    const timer = window.setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController(); abortRef.current = controller;
      try {
        const result = await api<any>(`/storefront/search/suggestions?q=${encodeURIComponent(value)}&limit=6`, { signal: controller.signal });
        if (!controller.signal.aborted) setSuggestions(parseSuggestions(result));
      } catch { if (!controller.signal.aborted) setSuggestions([]); }
    }, 180);
    return () => window.clearTimeout(timer);
  }, [query]);
  useEffect(() => () => abortRef.current?.abort(), []);
  function submitSearch(e: React.FormEvent) { e.preventDefault(); const value = query.trim(); setSuggestOpen(false); window.location.href = value ? `/search?q=${encodeURIComponent(value)}` : '/search'; }
  function chooseSuggestion(s: Suggestion) { const value = (s.query || s.text).trim(); setQuery(value); setSuggestOpen(false); window.location.href = `/search?q=${encodeURIComponent(value)}`; }
  return <>
    <div className="announcement">FREE SHIPPING ABOVE ₹999 <i /> COD AVAILABLE <i /> EASY RETURNS <i /> SECURE PAYMENTS</div>
    <header className="header"><div className="headerInner">
      <button className="iconButton menuButton" aria-label="Open menu" onClick={() => setMenu(true)}>☰</button>
      <Link className="logo" href="/" aria-label="PRIYASA home">PRIYASA<span>EVERY YOU, BEAUTIFUL</span></Link>
      <nav className="desktopNav" aria-label="Primary navigation">{nav.map(([label, href]) => <Link className={pathname === href ? 'active' : ''} key={label} href={href}>{label}</Link>)}</nav>
      <form className="headerSearch" onSubmit={submitSearch} role="search" autoComplete="off"><span aria-hidden="true">⌕</span><input value={query} onChange={e => setQuery(e.target.value)} onFocus={() => setSuggestOpen(true)} placeholder="Search products, styles & categories" aria-label="Search products" aria-expanded={suggestOpen && suggestions.length > 0} aria-controls="header-search-suggestions" />{suggestOpen && suggestions.length > 0 && <div id="header-search-suggestions" role="listbox" className="searchSuggestions">{suggestions.map((s, i) => <button type="button" role="option" key={`${s.text}-${i}`} onMouseDown={e => e.preventDefault()} onClick={() => chooseSuggestion(s)}><span aria-hidden="true">⌕</span>{s.text}{s.category && <small>{s.category}</small>}</button>)}</div>}</form>
      <div className="headerActions"><Link href="/account"><b>♙</b><small>Profile</small></Link><Link href="/wishlist"><b>♡</b><small>Wishlist</small></Link><Link href="/cart"><b>♧</b><small>Bag</small></Link></div>
    </div></header>
    {menu && <div className="mobileMenuBackdrop" onClick={() => setMenu(false)}><aside className="mobileMenu" onClick={e => e.stopPropagation()}><div className="mobileMenuHead"><strong>PRIYASA</strong><button onClick={() => setMenu(false)} aria-label="Close menu">×</button></div><form onSubmit={submitSearch}><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search styles" /><button>Search</button></form>{nav.map(([label, href]) => <Link key={label} href={href}>{label}<span>›</span></Link>)}<Link href="/account">My Account<span>›</span></Link><Link href="/orders">My Orders<span>›</span></Link></aside></div>}
    <main>{children}</main>
    <footer className="footer"><div><Link className="logo footerLogo" href="/">PRIYASA</Link><p>Contemporary Indian fashion, everyday essentials and occasion-ready edits.</p></div><div><strong>SHOP</strong><Link href="/shop">All products</Link><Link href="/shop?sort=newest">New arrivals</Link><Link href="/shop?sort=discount">Sale</Link></div><div><strong>HELP</strong><Link href="/account">Account</Link><Link href="/orders">Orders</Link><Link href="/support">Support</Link></div><div><strong>POLICIES</strong><Link href="/shipping">Shipping</Link><Link href="/returns">Returns</Link><Link href="/privacy">Privacy</Link></div><div className="footerBottom">© {new Date().getFullYear()} PRIYASA. All rights reserved.</div></footer>
    <nav className="bottomNav" aria-label="Mobile navigation"><Link href="/" className={pathname === '/' ? 'active' : ''}><b>⌂</b><span>Home</span></Link><Link href="/search"><b>⌕</b><span>Search</span></Link><Link href="/shop"><b>▦</b><span>Shop</span></Link><Link href="/wishlist"><b>♡</b><span>Wishlist</span></Link><Link href="/cart"><b>♧</b><span>Bag</span></Link></nav>
  </>;
}
