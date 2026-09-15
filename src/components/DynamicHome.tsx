'use client';

import Link from 'next/link';
import type { HomeSection, StorefrontHome } from '@/lib/storefront';

function href(value: unknown, fallback = '/shop') {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function Section({ section }: { section: HomeSection }) {
  const c = section.content || {};
  const items = Array.isArray(c.items) ? c.items : [];

  if (section.type === 'service_strip') {
    return <div className="dynamicServices">{items.map((item: any, i: number) => <div key={item.id || i}><b>{item.icon || `0${i + 1}`}</b><span><strong>{item.title || item.label || 'PRIYASA service'}</strong>{item.subtitle || item.description || 'Designed for a better shopping experience'}</span></div>)}</div>;
  }

  if (section.type === 'category_tiles') {
    return <section className="section"><div className="sectionHead"><div><span className="eyebrow">SHOP THE EDIT</span><h2>{section.title || 'Shop By Category'}</h2><p className="muted">{section.subtitle}</p></div></div><div className="categoryGrid">{items.map((item: any, i: number) => <Link className="categoryCard" href={href(item.href, `/search?q=${encodeURIComponent(item.name || item.label || '')}`)} key={item.id || i}><div className="categoryArt" style={item.image_url ? { backgroundImage: `url(${item.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}><span>{item.badge || String(i + 1).padStart(2, '0')}</span></div><div><strong>{item.name || item.label}</strong><small>{item.subtitle || item.description || ''}</small></div></Link>)}</div></section>;
  }

  if (section.type === 'editorial_grid') {
    return <section className="section"><div className="sectionHead"><div><span className="eyebrow">PRIYASA STORIES</span><h2>{section.title || 'Shop The Edit'}</h2><p className="muted">{section.subtitle}</p></div></div><div className="editorialGrid">{items.map((item: any, i: number) => <Link href={href(item.href)} className={`editorialCard editorial${(i % 3) + 1}`} style={item.image_url ? { backgroundImage: `linear-gradient(180deg, transparent, rgba(0,0,0,.62)), url(${item.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined} key={item.id || i}><span>0{i + 1}</span><div><small>PRIYASA EDIT</small><h3>{item.title || item.name}</h3><p>{item.subtitle || item.description}</p><b>{item.cta_label || 'Shop edit'} →</b></div></Link>)}</div></section>;
  }

  if (section.type === 'offer_banner') {
    const cta = c.cta || {};
    return <section className="section"><Link className="dynamicOffer" href={href(cta.href)} style={c.image_url ? { backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.65), rgba(0,0,0,.08)), url(${c.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}><span className="eyebrow">{c.eyebrow || 'LIMITED TIME OFFER'}</span><h2>{c.title || section.title || 'Special Offers'}</h2><p>{c.subtitle || section.subtitle}</p><b>{cta.label || 'Shop now'} →</b></Link></section>;
  }

  if (section.type === 'hero_slider') {
    const first = items[0] || c;
    const cta = first.cta || {};
    return <section className="hero" style={first.image_url ? { backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.55), transparent), url(${first.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}><div className="heroCopy"><span className="eyebrow">{first.eyebrow || 'PRIYASA / NEW SEASON'}</span><h1>{first.title || 'Every you,'}<br /><em>{first.highlight || 'beautifully styled.'}</em></h1><p>{first.subtitle || 'Contemporary Indian fashion, everyday essentials and occasion-ready edits designed around real life.'}</p><div className="heroActions"><Link className="button" href={href(cta.href, '/shop')}>{cta.label || 'Shop now'}</Link></div></div></section>;
  }

  if (section.type === 'flash_sale') {
    const cta = c.cta || {};
    return <section className="section"><div className="sectionHead"><div><span className="eyebrow">{c.sale?.show_countdown ? 'LIMITED TIME' : 'SALE'}</span><h2>{section.title || 'Flash Sale'}</h2><p className="muted">{section.subtitle}</p></div><Link className="textLink" href={href(cta.href, '/sale')}>{cta.label || 'View all'} →</Link></div><div className="dynamicQueryCard"><strong>Products are loaded from the live catalog</strong><span>Query: {c.query?.sort || 'recommended'} · {c.query?.limit || 12} items</span></div></section>;
  }

  if (section.type === 'brand_carousel') {
    return <section className="section"><div className="sectionHead"><div><span className="eyebrow">BRANDS</span><h2>{section.title || 'Shop Your Favourite Brands'}</h2><p className="muted">{section.subtitle}</p></div></div><div className="brandRail">{items.map((item: any, i: number) => <Link href={href(item.href, `/search?q=${encodeURIComponent(item.name || '')}`)} key={item.id || i}><div>{item.logo_url ? <img src={item.logo_url} alt="" /> : <strong>{item.name || item.label}</strong>}</div></Link>)}</div></section>;
  }

  if (section.type === 'product_carousel' || section.type === 'product_grid' || section.type === 'review_carousel') {
    const query = c.query;
    return <section className="section"><div className="sectionHead"><div><span className="eyebrow">PRIYASA</span><h2>{section.title || 'Discover more'}</h2><p className="muted">{section.subtitle}</p></div>{c.cta && <Link className="textLink" href={href(c.cta.href)}>{c.cta.label || 'View all'} →</Link>}</div><div className="dynamicQueryCard"><strong>{section.type === 'review_carousel' ? 'Customer reviews' : 'Live product collection'}</strong><span>{query ? `Dynamic query · ${query.sort || 'recommended'} · ${query.limit || 12} items` : 'Configured by Priyasa CMS'}</span></div></section>;
  }

  return null;
}

export default function DynamicHome({ home }: { home: StorefrontHome }) {
  const themeColors = home.theme?.tokens?.colors || {};
  const style = {
    '--pink': themeColors.accent || undefined,
    '--ink': themeColors.text || undefined,
    '--muted': themeColors.text_muted || undefined,
    '--line': themeColors.border || undefined,
    '--soft': themeColors.surface_alt || undefined,
  } as React.CSSProperties;

  return <div style={style}>
    {home.announcement?.enabled && <div className="announcement">{(home.announcement.items || []).map((item: any, i: number) => <span key={item.id || i}>{item.text}</span>)}</div>}
    {home.sections.map((section) => <Section key={`${section.key}-${section.id}`} section={section} />)}
    <section className="newsletter"><div><span className="eyebrow">THE PRIYASA EDIT</span><h2>New drops, styling ideas & offers.</h2><p>Be the first to know when a new collection lands.</p></div><form><input type="email" placeholder="Your email address" aria-label="Email address" /><button className="button" type="submit">Join</button></form></section>
  </div>;
}
