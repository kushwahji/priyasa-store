'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { StorefrontHome, StoreNavItem } from '@/lib/storefront';
import ServiceDownModal from '@/components/ServiceDownModal';

const fallbackNav: StoreNavItem[] = [
  {label:'NEW IN',href:'/shop?sort=newest'}, {label:'WOMEN',href:'/shop?category=women'}, {label:'ETHNIC',href:'/shop?category=ethnic-wear'},
  {label:'DRESSES',href:'/shop?category=dresses'}, {label:'NIGHTWEAR',href:'/shop?category=nightwear'}, {label:'ACTIVEWEAR',href:'/shop?category=activewear'},
  {label:'LINGERIE',href:'/shop?category=lingerie'}, {label:'SALE',href:'/shop?sort=discount'},
];

export default function StoreShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [query,setQuery]=useState(''); const [menu,setMenu]=useState(false); const [config,setConfig]=useState<StorefrontHome|null>(null);
  useEffect(()=>{let dead=false;fetch('/api/storefront/home').then(async r=>{if(!r.ok){if([404,502,503,504].includes(r.status))window.dispatchEvent(new CustomEvent('priyasa:service-down',{detail:{code:r.status===404?'PRIYASA_API_404':'PRIYASA_API_DOWN',status:r.status}}));return null}return r.json()}).then(r=>{if(!dead&&r?.success)setConfig(r.data)}).catch(()=>{if(!dead)window.dispatchEvent(new CustomEvent('priyasa:service-down',{detail:{code:'PRIYASA_API_DOWN'}}))});return()=>{dead=true}},[]);
  useEffect(()=>setMenu(false),[pathname]);
  const nav=config?.navigation?.items?.length?config.navigation.items:fallbackNav;
  const mobileNav=config?.navigation?.mobile_items?.length?config.navigation.mobile_items:nav.slice(0,5);
  const header=config?.header||{};
  const announcement=config?.announcement;
  function submitSearch(e:React.FormEvent){e.preventDefault();const v=query.trim();window.location.href=v?`/search?q=${encodeURIComponent(v)}`:'/search';}
  return <>
    <ServiceDownModal />
    {announcement?.enabled!==false&&<div className="announcement">{(announcement?.items?.length?announcement.items:[{text:'FREE SHIPPING ABOVE ₹999'},{text:'COD AVAILABLE'},{text:'EASY RETURNS'},{text:'SECURE PAYMENTS'}]).map((x,i)=><span key={String(x.id||i)}>{x.href?<Link href={x.href}>{x.text}</Link>:x.text}{i<(announcement?.items?.length?announcement.items.length:4)-1&&<i/>}</span>)}</div>}
    <header className="header"><div className="headerInner">
      <button className="iconButton menuButton" aria-label="Open menu" onClick={()=>setMenu(true)}>☰</button>
      <Link className="logo" href="/" aria-label="PRIYASA home">{header.logo_url?<img src={header.logo_url} alt={header.logo_alt||'PRIYASA'}/>:<>PRIYASA<span>EVERY YOU, BEAUTIFUL</span></>}</Link>
      <nav className="desktopNav" aria-label="Primary navigation">{nav.map((item,i)=><Link key={String(item.id||i)} href={item.href}>{item.label}</Link>)}</nav>
      <form className="headerSearch" onSubmit={submitSearch} role="search"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={header.search_placeholder||'Search products, styles & categories'} aria-label="Search products"/></form>
      <div className="headerActions"><Link href="/account"><b>♙</b><small>Profile</small></Link><Link href="/wishlist"><b>♡</b><small>Wishlist</small></Link><Link href="/cart"><b>♧</b><small>Bag</small></Link></div>
    </div></header>
    {menu&&<div className="mobileMenuBackdrop" onClick={()=>setMenu(false)}><aside className="mobileMenu" onClick={e=>e.stopPropagation()}><div className="mobileMenuHead"><strong>PRIYASA</strong><button onClick={()=>setMenu(false)} aria-label="Close menu">×</button></div><form onSubmit={submitSearch}><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={header.search_placeholder||'Search styles'}/><button>Search</button></form>{nav.map((item,i)=><Link key={String(item.id||i)} href={item.href}>{item.label}<span>›</span></Link>)}<Link href="/account">My Account<span>›</span></Link><Link href="/orders">My Orders<span>›</span></Link></aside></div>}
    <main>{children}</main>
    <footer className="footer"><div><Link className="logo footerLogo" href="/">PRIYASA</Link><p>Contemporary Indian fashion, everyday essentials and occasion-ready edits.</p></div><div><strong>SHOP</strong><Link href="/shop">All products</Link><Link href="/shop?sort=newest">New arrivals</Link><Link href="/shop?sort=discount">Sale</Link></div><div><strong>HELP</strong><Link href="/account">Account</Link><Link href="/orders">Orders</Link><Link href="/support">Support</Link></div><div><strong>POLICIES</strong><Link href="/shipping">Shipping</Link><Link href="/returns">Returns</Link><Link href="/privacy">Privacy</Link></div><div className="footerBottom">© {new Date().getFullYear()} PRIYASA. All rights reserved.</div></footer>
    <nav className="bottomNav" aria-label="Mobile navigation">{mobileNav.map((item,i)=><Link key={String(item.id||i)} href={item.href} className={pathname===item.href?'active':''}><b>{['⌂','⌕','▦','♡','♧'][i%5]}</b><span>{item.label}</span></Link>)}</nav>
  </>;
}
