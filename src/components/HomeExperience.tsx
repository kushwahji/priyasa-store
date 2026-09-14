'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import ProductCard from '@/components/ProductCard';
import { api } from '@/lib/api';

type Section = { id?: string | number; key?: string; type?: string; title?: string; subtitle?: string; is_active?: boolean; sort_order?: number; content?: any };
type HomeData = { version?: number; currency?: string; locale?: string; header?: any; sections?: Section[] };

type Product = Record<string, any>;

const productSectionTypes = new Set(['product_carousel', 'product_grid', 'flash_sale', 'personalized_products']);

function productsOf(result: any): Product[] {
  const value = result?.data?.data ?? result?.data?.products ?? result?.data ?? result?.products ?? [];
  return Array.isArray(value) ? value : [];
}

function cardProduct(p: Product): Product {
  const pricing = p.pricing || {};
  const media = Array.isArray(p.media) ? p.media : [];
  return { ...p, price: p.price ?? pricing.selling_price, mrp: p.mrp ?? pricing.mrp, image: p.image ?? media[0]?.url ?? media[0]?.image_url, category: p.category?.name ?? p.category };
}

export default function HomeExperience() {
  const [home, setHome] = useState<HomeData | null>(null);
  const [products, setProducts] = useState<Record<string, Product[]>>({});
  const [slide, setSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [offerOpen, setOfferOpen] = useState(false);

  const sections = useMemo(() => [...(home?.sections || [])].filter(s => s.is_active !== false).sort((a, b) => Number(a.sort_order ?? a.content?.sort_order ?? a.id ?? 0) - Number(b.sort_order ?? b.content?.sort_order ?? b.id ?? 0)), [home]);
  const hero = sections.find(s => s.type === 'hero_slider');
  const offer = sections.find(s => s.type === 'offer_banner');

  async function load() {
    setLoading(true); setError('');
    try {
      const result = await api<any>('/storefront/home');
      const data = result?.data || result || {};
      setHome(data);
      const dynamic = (data.sections || []).filter((s: Section) => productSectionTypes.has(s.type ?? ''));
      const entries = await Promise.all(dynamic.map(async (section: Section) => {
        const query = section.content?.query || {};
        const params = new URLSearchParams();
        Object.entries(query).forEach(([key, value]) => { if (value !== undefined && value !== null && value !== '') params.set(key, String(value)); });
        params.set('per_page', String(query.limit || 12));
        try { return [String(section.key || section.id), productsOf(await api<any>(`/storefront/products?${params}`))] as const; }
        catch { return [String(section.key || section.id), []] as const; }
      }));
      setProducts(Object.fromEntries(entries));
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load PRIYASA home'); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);
  useEffect(() => {
    const items = hero?.content?.items || [];
    if (!hero?.content?.autoplay || items.length < 2) return;
    const timer = window.setInterval(() => setSlide(v => (v + 1) % items.length), Number(hero.content.interval_ms || 4500));
    return () => window.clearInterval(timer);
  }, [hero]);
  useEffect(() => {
    if (!offer || sessionStorage.getItem('priyasa_offer_seen') === '1') return;
    const timer = window.setTimeout(() => setOfferOpen(true), 1800);
    return () => window.clearTimeout(timer);
  }, [offer]);

  if (loading) return <main className="homeLoading" aria-label="Loading PRIYASA home"><div className="homeSkeleton homeHeroSkeleton" /><div className="homeSkeletonRow">{[1,2,3,4].map(i => <div className="homeSkeleton" key={i} />)}</div></main>;
  if (error || !home) return <main className="homeFallback"><span className="eyebrow">PRIYASA</span><h1>We’re refreshing the edit.</h1><p>{error || 'Please try again in a moment.'}</p><button className="button" onClick={() => void load()}>Retry</button></main>;

  return <>
    {sections.map(section => {
      const c = section.content || {};
      const key = String(section.key || section.id);
      if (section.type === 'hero_slider') {
        const items = c.items || []; const item = items[slide] || items[0]; if (!item) return null;
        return <section className="dynamicHero" key={key} style={{ '--hero-desktop': `url("${item.image_url || ''}")`, '--hero-mobile': `url("${item.mobile_image_url || item.image_url || ''}")` } as React.CSSProperties}><div className="dynamicHeroShade" /><div className="dynamicHeroCopy"><span className="eyebrow">{item.eyebrow || 'PRIYASA EDIT'}</span><h1>{item.title}</h1><p>{item.subtitle}</p>{item.cta?.href && <Link className="button" href={item.cta.href}>{item.cta.label || 'Shop now'}</Link>}</div>{items.length > 1 && <div className="heroDots" aria-label="Hero slides">{items.map((_: any, i: number) => <button type="button" key={i} aria-label={`Slide ${i + 1}`} className={i === slide ? 'active' : ''} onClick={() => setSlide(i)} />)}</div>}</section>;
      }
      if (section.type === 'service_strip') return <section className="dynamicServices" key={key}>{(c.items || []).map((item: any, i: number) => <div key={item.title || i}><span aria-hidden="true">{item.icon === 'truck' ? '⌁' : item.icon === 'shield' ? '◇' : item.icon === 'location' ? '⌖' : '↩'}</span><strong>{item.title}</strong><small>{item.subtitle}</small></div>)}</section>;
      if (section.type === 'editorial_grid') return <section className="section dynamicEditorial" key={key}><div className="sectionHead"><div><span className="eyebrow">PRIYASA EDIT</span><h2>{section.title || 'Shop the edit'}</h2></div></div><div className="dynamicEditorialGrid">{(c.items || []).map((item: any, i: number) => <Link key={item.id || i} href={item.href || '/shop'} className="dynamicEditorialCard" style={{ backgroundImage: `linear-gradient(180deg,transparent 30%,rgba(0,0,0,.72)),url("${item.image_url || ''}")` }}><span>0{i + 1}</span><div><strong>{item.title}</strong><small>{item.subtitle}</small></div></Link>)}</div></section>;
      if (productSectionTypes.has(section.type ?? '')) {
        const items = (products[key] || []).map(cardProduct); if (!items.length) return null;
        return <section className={`section dynamicProducts ${section.type === 'product_grid' ? 'isGrid' : ''}`} key={key}><div className="sectionHead"><div><span className="eyebrow">{section.type === 'flash_sale' ? 'LIMITED TIME' : 'PRIYASA PICKS'}</span><h2>{section.title || 'Discover more'}</h2>{section.subtitle && <p className="muted">{section.subtitle}</p>}</div>{c.cta?.href && <Link className="textLink" href={c.cta.href}>{c.cta.label || 'View all'} →</Link>}</div><div className="homeProductRail">{items.map(p => <ProductCard key={String(p.id || p.slug)} product={p as any} />)}</div></section>;
      }
      if (section.type === 'offer_banner' || section.type === 'image_banner') return <section className="section dynamicBanner" key={key} style={{ '--banner-desktop': `url("${c.image_url || ''}")`, '--banner-mobile': `url("${c.mobile_image_url || c.image_url || ''}")` } as React.CSSProperties}><div><span className="eyebrow">{c.eyebrow || 'PRIYASA'}</span><h2>{c.title}</h2><p>{c.subtitle}</p>{c.cta?.href && <Link className="button" href={c.cta.href}>{c.cta.label || 'Explore'}</Link>}</div></section>;
      if (section.type === 'review_carousel') return <section className="section dynamicReviews" key={key}><div className="sectionHead"><div><span className="eyebrow">PRIYASA COMMUNITY</span><h2>{section.title || 'Loved by you'}</h2><p className="muted">{section.subtitle}</p></div></div><div className="reviewPlaceholder">Real product reviews are available on each product page.</div></section>;
      return null;
    })}
    {offerOpen && offer && <div className="offerOverlay" role="dialog" aria-modal="true" aria-label="PRIYASA offer"><div className="offerModal"><button className="offerClose" type="button" aria-label="Close offer" onClick={() => { sessionStorage.setItem('priyasa_offer_seen', '1'); setOfferOpen(false); }}>×</button><span className="eyebrow">SPECIAL FOR YOU</span><h2>{offer.content?.title || 'Exclusive offer'}</h2><p>{offer.content?.subtitle || 'Discover the latest PRIYASA edit.'}</p><Link className="button" href={offer.content?.cta?.href || '/shop'} onClick={() => { sessionStorage.setItem('priyasa_offer_seen', '1'); setOfferOpen(false); }}>{offer.content?.cta?.label || 'Shop now'}</Link></div></div>}
  </>;
}
