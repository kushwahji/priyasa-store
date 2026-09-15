'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import ProductCard from '@/components/ProductCard';
import { api } from '@/lib/api';

type AnyRecord = Record<string, any>;
type Section = AnyRecord & { id?: string | number; key?: string; type?: string; title?: string; subtitle?: string; is_active?: boolean; sort_order?: number; content?: AnyRecord };
type HomeData = AnyRecord & { sections?: Section[] };
type Product = AnyRecord;
type LayoutMode = 'grid' | 'carousel' | 'stack';
const PRODUCT_SECTIONS = new Set(['product_carousel', 'product_grid', 'flash_sale', 'personalized_products']);

function productsOf(result: AnyRecord): Product[] {
  const value = result?.data?.data ?? result?.data?.products ?? result?.data ?? result?.products ?? [];
  return Array.isArray(value) ? value : [];
}

function normalizeHome(result: AnyRecord): HomeData {
  const candidates = [result?.data, result?.data?.home, result?.home, result];
  const home = candidates.find((value) => value && typeof value === 'object' && Array.isArray(value.sections));
  return (home || result || {}) as HomeData;
}

function cardProduct(product: Product): Product & { name: string } {
  const pricing = product.pricing || {};
  const media = Array.isArray(product.media) ? product.media : [];
  return { ...product, name: String(product.name ?? product.title ?? product.product_name ?? 'PRIYASA Product'), price: product.price ?? pricing.selling_price, mrp: product.mrp ?? pricing.mrp, image: product.image ?? media[0]?.url ?? media[0]?.image_url, category: product.category?.name ?? product.category };
}

function normalizeLayout(value: unknown, fallback: LayoutMode): LayoutMode {
  const normalized = String(value || '').trim().toLowerCase().replace(/[-\s]/g, '_');
  if (normalized === 'carousel' || normalized === 'slider' || normalized === 'rail') return 'carousel';
  if (normalized === 'grid' || normalized === 'tiles' || normalized === 'columns') return 'grid';
  if (normalized === 'stack' || normalized === 'list') return 'stack';
  return fallback;
}
function sectionLayout(section: Section, mobile = false): LayoutMode {
  const content = section.content || {};
  const display = content.display || {};
  const configured = mobile ? (display.mobile_layout ?? content.mobile_layout ?? section.mobile_layout) : (display.layout ?? content.layout ?? section.layout);
  if (configured) return normalizeLayout(configured, mobile ? 'carousel' : 'grid');
  if (section.type === 'product_carousel' || section.type === 'flash_sale' || section.type === 'personalized_products') return 'carousel';
  return 'grid';
}
function sectionColumns(section: Section, mobile = false): number {
  const content = section.content || {};
  const display = content.display || {};
  const layout = content.layout || {};
  const raw = mobile ? (display.mobile_columns ?? layout.mobile_columns ?? content.mobile_columns ?? section.mobile_columns ?? 2) : (display.desktop_columns ?? layout.desktop_columns ?? content.columns ?? section.columns ?? 4);
  const value = Number(raw);
  return Number.isFinite(value) ? Math.max(1, Math.min(mobile ? 4 : 6, value)) : mobile ? 2 : 4;
}
function layoutClass(section: Section, kind: 'products' | 'editorial') { return `${kind}Layout desktop-${sectionLayout(section)} mobile-${sectionLayout(section, true)} cols-${sectionColumns(section)} mobileCols-${sectionColumns(section, true)}`; }
function queryParams(section: Section): URLSearchParams {
  const query = section.content?.query || {};
  const params = new URLSearchParams();
  if (query.sort) params.set('sort', String(query.sort));
  if (query.limit) params.set('per_page', String(query.limit));
  if (query.per_page) params.set('per_page', String(query.per_page));
  if (query.page) params.set('page', String(query.page));
  const filters = query.filters && typeof query.filters === 'object' ? query.filters : {};
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, Array.isArray(value) ? value.join(',') : String(value));
  }
  if (!params.has('per_page')) params.set('per_page', '12');
  return params;
}
function ServiceIcon({ name }: { name?: string }) { const icon = String(name || '').toLowerCase(); return <span className="serviceIcon" aria-hidden="true">{icon === 'shield' || icon === 'secure' ? '✓' : icon === 'truck' || icon === 'delivery' ? '⌖' : icon === 'support' || icon === 'headset' ? '?' : '↩'}</span>; }

export default function HomeExperience() {
  const [home, setHome] = useState<HomeData | null>(null);
  const [products, setProducts] = useState<Record<string, Product[]>>({});
  const [slide, setSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [offerOpen, setOfferOpen] = useState(false);
  const sections = useMemo(() => [...(home?.sections || [])].filter((section) => section.is_active !== false).sort((a, b) => Number(a.sort_order ?? a.id ?? 0) - Number(b.sort_order ?? b.id ?? 0)), [home]);
  const hero = sections.find((section) => section.type === 'hero_slider');
  const offer = sections.find((section) => section.type === 'offer_banner');
  const theme = home?.theme || {};
  const tokens = theme.tokens || {};

  async function load() {
    setLoading(true); setError('');
    try {
      const result = await api<AnyRecord>('/storefront/home');
      const data = normalizeHome(result);
      setHome(data);
      const dynamic = (data.sections || []).filter((section) => PRODUCT_SECTIONS.has(section.type ?? '') && section.content?.query?.mode !== 'personalized');
      const entries = await Promise.all(dynamic.map(async (section) => {
        const key = String(section.key || section.id);
        try { return [key, productsOf(await api<AnyRecord>(`/storefront/products?${queryParams(section).toString()}`))] as const; }
        catch { return [key, []] as const; }
      }));
      setProducts(Object.fromEntries(entries));
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load PRIYASA home'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  useEffect(() => { const items = hero?.content?.items || []; if (!hero?.content?.autoplay || items.length < 2) return; const timer = window.setInterval(() => setSlide((value) => (value + 1) % items.length), Number(hero.content.interval_ms || 4500)); return () => window.clearInterval(timer); }, [hero]);
  useEffect(() => { if (!offer || sessionStorage.getItem('priyasa_offer_seen') === '1') return; const timer = window.setTimeout(() => setOfferOpen(true), 1800); return () => window.clearTimeout(timer); }, [offer]);

  if (loading) return <main className="homeLoading" aria-label="Loading PRIYASA home"><div className="homeSkeleton homeHeroSkeleton" /><div className="homeSkeletonRow">{[1, 2, 3, 4].map((item) => <div className="homeSkeleton" key={item} />)}</div></main>;
  if (error || !home) return <main className="homeFallback"><span className="eyebrow">PRIYASA</span><h1>We’re refreshing the edit.</h1><p>{error || 'Please try again in a moment.'}</p><button className="button" onClick={() => void load()}>Retry</button></main>;

  const themeStyle = { '--home-primary': tokens.colors?.primary || '#171717', '--home-accent': tokens.colors?.accent || '#D4AF37', '--home-bg': tokens.colors?.background || '#fff', '--home-surface': tokens.colors?.surface_alt || '#f7f7f7', '--home-text': tokens.colors?.text || '#171717', '--home-muted': tokens.colors?.text_muted || '#737373', '--home-border': tokens.colors?.border || '#e5e5e5', '--home-radius': `${tokens.radius?.lg || 16}px`, '--home-max': `${tokens.layout?.max_width || 1440}px`, '--home-gap': `${tokens.layout?.section_gap || 48}px` } as CSSProperties;

  return <main className="dynamicHome" style={themeStyle} data-theme-key={theme.key || 'default'} data-theme-name={theme.name || ''}>
    {sections.map((section) => {
      const content = section.content || {}; const key = String(section.key || section.id);
      if (section.type === 'hero_slider') {
        const items = Array.isArray(content.items) ? content.items : []; const item = items[slide] || items[0]; if (!item) return null;
        const style = { '--hero-desktop': `url("${item.image_url || ''}")`, '--hero-mobile': `url("${item.mobile_image_url || item.image_url || ''}")` } as CSSProperties;
        return <section className="dynamicHero" key={key} style={style}><div className="dynamicHeroShade" /><div className="dynamicHeroCopy"><span className="eyebrow">{item.eyebrow || 'PRIYASA EDIT'}</span><h1>{item.title}</h1><p>{item.subtitle}</p>{item.cta?.href && <Link className="button" href={item.cta.href}>{item.cta.label || 'Shop now'}</Link>}</div>{items.length > 1 && <div className="heroDots">{items.map((_: AnyRecord, index: number) => <button type="button" key={index} aria-label={`Slide ${index + 1}`} className={index === slide ? 'active' : ''} onClick={() => setSlide(index)} />)}</div>}</section>;
      }
      if (section.type === 'service_strip') { const items = Array.isArray(content.items) ? content.items : []; if (!items.length) return null; return <section className="dynamicServices" key={key}><div className="serviceStripInner">{items.map((item: AnyRecord, index: number) => <div className="serviceItem" key={item.id || item.title || index}><ServiceIcon name={item.icon} /><div className="serviceCopy"><strong>{item.title || 'PRIYASA service'}</strong>{item.subtitle && <small>{item.subtitle}</small>}</div></div>)}</div></section>; }
      if (section.type === 'category_tiles') { const items = Array.isArray(content.items) ? content.items : []; if (!items.length) return null; return <section className="section dynamicCategories" key={key}><div className="sectionHead"><div><span className="eyebrow">EXPLORE</span><h2>{section.title || 'Shop By Category'}</h2>{section.subtitle && <p className="muted">{section.subtitle}</p>}</div></div><div className={`categoryTiles ${layoutClass(section, 'editorial')}`}>{items.map((item: AnyRecord, index: number) => <Link key={item.id || index} href={item.href || `/shop?category=${encodeURIComponent(item.slug || item.id || '')}`} className="categoryTile">{item.image_url && <img src={item.image_url} alt={item.title || item.name || 'PRIYASA category'} loading="lazy" />}<span>{item.title || item.name || 'Explore'}</span>{item.subtitle && <small>{item.subtitle}</small>}</Link>)}</div></section>; }
      if (section.type === 'editorial_grid') { const items = Array.isArray(content.items) ? content.items : []; if (!items.length) return null; return <section className="section dynamicEditorial" key={key}><div className="sectionHead"><div><span className="eyebrow">PRIYASA EDIT</span><h2>{section.title || 'Shop the edit'}</h2>{section.subtitle && <p className="muted">{section.subtitle}</p>}</div></div><div className={`dynamicEditorialGrid ${layoutClass(section, 'editorial')}`}>{items.map((item: AnyRecord, index: number) => <Link key={item.id || index} href={item.href || '/shop'} className="dynamicEditorialCard" style={{ backgroundImage: `linear-gradient(180deg,transparent 30%,rgba(0,0,0,.72)),url("${item.image_url || ''}")` }}><span>0{index + 1}</span><div><strong>{item.title}</strong><small>{item.subtitle}</small></div></Link>)}</div></section>; }
      if (PRODUCT_SECTIONS.has(section.type ?? '')) {
        if (section.content?.query?.mode === 'personalized') return <section className="section dynamicProducts" key={key}><div className="sectionHead"><div><span className="eyebrow">FOR YOU</span><h2>{section.title || 'Recommended For You'}</h2>{section.subtitle && <p className="muted">{section.subtitle}</p>}</div></div><div className="personalizedEmpty">Personalized recommendations will appear here as your shopping activity builds.</div></section>;
        const items = (products[key] || []).map(cardProduct); if (!items.length) return null;
        return <section className={`section dynamicProducts ${section.type === 'product_grid' ? 'isGrid' : ''}`} key={key}><div className="sectionHead"><div><span className="eyebrow">{section.type === 'flash_sale' ? 'LIMITED TIME' : 'PRIYASA PICKS'}</span><h2>{section.title || 'Discover more'}</h2>{section.subtitle && <p className="muted">{section.subtitle}</p>}</div>{content.cta?.href && <Link className="textLink" href={content.cta.href}>{content.cta.label || 'View all'} →</Link>}</div><div className={`homeProductRail ${layoutClass(section, 'products')} ${section.type === 'flash_sale' ? 'flashSaleRail' : ''}`}>{items.map((product) => <ProductCard key={String(product.id || product.slug)} product={product} />)}</div></section>;
      }
      if (section.type === 'offer_banner' || section.type === 'image_banner') { const style = { '--banner-desktop': `url("${content.image_url || ''}")`, '--banner-mobile': `url("${content.mobile_image_url || content.image_url || ''}")` } as CSSProperties; return <section className="section dynamicBanner" key={key} style={style}><div><span className="eyebrow">{content.eyebrow || 'PRIYASA'}</span><h2>{content.title}</h2><p>{content.subtitle}</p>{content.cta?.href && <Link className="button" href={content.cta.href}>{content.cta.label || 'Explore'}</Link>}</div></section>; }
      if (section.type === 'brand_carousel') { const items = Array.isArray(content.items) ? content.items : []; if (!items.length) return null; return <section className="section dynamicBrands" key={key}><div className="sectionHead"><div><span className="eyebrow">BRANDS</span><h2>{section.title || 'Shop Your Favourite Brands'}</h2>{section.subtitle && <p className="muted">{section.subtitle}</p>}</div></div><div className="brandRail">{items.map((item: AnyRecord, index: number) => <Link key={item.id || index} href={item.href || `/shop?brand=${encodeURIComponent(item.slug || item.id || '')}`} className="brandTile">{item.image_url && <img src={item.image_url} alt={item.name || item.title || 'Brand'} loading="lazy" />}<span>{item.name || item.title}</span></Link>)}</div></section>; }
      if (section.type === 'review_carousel') { const items = Array.isArray(content.items) ? content.items : []; if (!items.length) return null; return <section className="section dynamicReviews" key={key}><div className="sectionHead"><div><span className="eyebrow">PRIYASA COMMUNITY</span><h2>{section.title || 'Loved by you'}</h2><p className="muted">{section.subtitle}</p></div></div><div className="reviewRail">{items.map((item: AnyRecord, index: number) => <article className="reviewCard" key={item.id || index}><strong>{'★'.repeat(Math.max(1, Math.min(5, Number(item.rating || 5))))}</strong><p>{item.body || item.comment || item.text || 'A lovely PRIYASA shopping experience.'}</p><small>{item.customer_name || item.customer || 'PRIYASA customer'}{item.product_name ? ` · ${item.product_name}` : ''}</small></article>)}</div></section>; }
      return null;
    })}
    {offerOpen && offer && <div className="offerOverlay" role="dialog" aria-modal="true" aria-label="PRIYASA offer"><div className="offerModal"><button className="offerClose" type="button" aria-label="Close offer" onClick={() => { sessionStorage.setItem('priyasa_offer_seen', '1'); setOfferOpen(false); }}>×</button><span className="eyebrow">SPECIAL FOR YOU</span><h2>{offer.content?.title || 'Exclusive offer'}</h2><p>{offer.content?.subtitle || 'Discover the latest PRIYASA edit.'}</p><Link className="button" href={offer.content?.cta?.href || '/shop'} onClick={() => { sessionStorage.setItem('priyasa_offer_seen', '1'); setOfferOpen(false); }}>{offer.content?.cta?.label || 'Shop now'}</Link></div></div>}
  </main>;
}
