import Link from 'next/link';
import { api } from '@/lib/api';
import ProductCard from '@/components/ProductCard';

type CTA = { label?: string; href?: string };
type HomeProductQuery = { sort?: string; limit?: number; in_stock?: boolean; sale_only?: boolean; strategy?: string; fallback_sort?: string };
type HomeSection = {
  id: string | number;
  key: string;
  type: string;
  sort_order?: number;
  is_active?: boolean;
  title?: string;
  subtitle?: string;
  content?: any;
};
type HomeData = {
  version?: number;
  page?: string;
  layout?: string;
  currency?: string;
  locale?: string;
  header?: { logo?: { image_url?: string; alt?: string }; search?: { enabled?: boolean; placeholder?: string }; cart?: { enabled?: boolean; show_count?: boolean } };
  sections?: HomeSection[];
};
type Product = { id?: string | number; slug?: string; name: string; category?: string | { name?: string }; price?: number; mrp?: number; image?: string; images?: string[]; pricing?: { selling_price?: number; mrp?: number }; media?: Array<{ url?: string }>; rating?: { average?: number; count?: number } };

async function getHome() {
  try {
    const response = await api<{ data?: HomeData }>('/storefront/home');
    return response.data || null;
  } catch {
    return null;
  }
}

function productQuery(query: HomeProductQuery = {}) {
  const params = new URLSearchParams();
  if (query.sort) params.set('sort', query.sort);
  params.set('per_page', String(query.limit || 12));
  if (query.in_stock !== undefined) params.set('in_stock', String(query.in_stock));
  if (query.sale_only !== undefined) params.set('sale_only', String(query.sale_only));
  return params.toString();
}

function normalizeProduct(product: Product) {
  const pricing = product.pricing || {};
  const media = product.media?.map(item => item.url).filter(Boolean) as string[] | undefined;
  return {
    ...product,
    category: typeof product.category === 'object' ? product.category?.name : product.category,
    price: Number(product.price ?? pricing.selling_price ?? 0),
    mrp: Number(product.mrp ?? pricing.mrp ?? 0),
    image: product.image || media?.[0] || product.images?.[0],
  };
}

async function getProducts(query: HomeProductQuery = {}) {
  try {
    const response = await api<{ data?: { data?: Product[] } }>(`/storefront/products?${productQuery(query)}`);
    return (response.data?.data || []).map(normalizeProduct);
  } catch {
    return [];
  }
}

function Hero({ section }: { section: HomeSection }) {
  const content = section.content || {};
  const items = content.items || [];
  if (!items.length) return null;
  return <section className="hero homeDynamicHero">
    <div className="heroSlider" aria-label={section.title || 'PRIYASA hero'}>
      {items.map((item: any, index: number) => <article className={`heroSlide ${index === 0 ? 'isActive' : ''}`} key={item.id || index}>
        <picture><source media="(max-width: 720px)" srcSet={item.mobile_image_url || item.image_url} />{item.image_url && <img src={item.image_url} alt={item.title || 'PRIYASA'} />}</picture>
        <div className="heroCopy"><span className="eyebrow">{item.eyebrow || 'PRIYASA'}</span><h1>{item.title}</h1>{item.subtitle && <p>{item.subtitle}</p>}<div className="heroActions">{item.cta?.href && <Link className="button" href={item.cta.href}>{item.cta.label || 'Shop Now'}</Link>}</div></div>
      </article>)}
    </div>
  </section>;
}

function ServiceStrip({ section }: { section: HomeSection }) {
  const items = section.content?.items || [];
  return <section className="trustRail dynamicTrustRail">{items.map((item: any, index: number) => <div key={item.id || item.title || index}><b>{String(index + 1).padStart(2, '0')}</b><span><strong>{item.title}</strong>{item.subtitle}</span></div>)}</section>;
}

function Editorial({ section }: { section: HomeSection }) {
  const items = section.content?.items || [];
  return <section className="section editorialSection"><div className="sectionHead"><div><span className="eyebrow">PRIYASA EDIT</span><h2>{section.title}</h2>{section.subtitle && <p>{section.subtitle}</p>}</div></div><div className="editorialGrid">{items.map((item: any, index: number) => <Link href={item.href || '/shop'} className={`editorialCard editorial${(index % 3) + 1}`} key={item.id || index}>{item.image_url && <img src={item.image_url} alt="" loading="lazy" />}<span>0{index + 1}</span><div><small>PRIYASA EDIT</small><h3>{item.title}</h3><p>{item.subtitle}</p><b>Explore →</b></div></Link>)}</div></section>;
}

function Banner({ section }: { section: HomeSection }) {
  const c = section.content || {};
  return <section className="homeBanner"><picture><source media="(max-width: 720px)" srcSet={c.mobile_image_url || c.image_url} />{c.image_url && <img src={c.image_url} alt="" loading="lazy" />}</picture><div><span className="eyebrow">{c.eyebrow || 'PRIYASA'}</span><h2>{c.title || section.title}</h2>{c.subtitle && <p>{c.subtitle}</p>}{c.cta?.href && <Link className="button" href={c.cta.href}>{c.cta.label || 'Discover'}</Link>}</div></section>;
}

async function ProductSection({ section }: { section: HomeSection }) {
  const query = section.content?.query || {};
  const products = await getProducts(query);
  if (!products.length) return null;
  const cta: CTA | undefined = section.content?.cta;
  return <section className="section homeProductSection"><div className="sectionHead"><div><span className="eyebrow">{section.type === 'flash_sale' ? 'LIMITED TIME' : 'PRIYASA EDIT'}</span><h2>{section.title}</h2>{section.subtitle && <p>{section.subtitle}</p>}</div>{cta?.href && <Link className="textLink" href={cta.href}>{cta.label || 'View All'} →</Link>}</div><div className="productGrid homeProductGrid">{products.map(product => <ProductCard key={String(product.id || product.slug)} product={product} />)}</div></section>;
}

function FlashSale({ section }: { section: HomeSection }) {
  const sale = section.content?.sale;
  return <section className="section flashSaleIntro"><div><span className="eyebrow">{section.content?.display?.show_countdown ? 'FLASH SALE' : 'PRIYASA SALE'}</span><h2>{section.title}</h2><p>{section.subtitle}</p></div>{sale?.ends_at && <span className="saleEnds">Ends {new Date(sale.ends_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}</section>;
}

function ReviewSection({ section }: { section: HomeSection }) {
  return <section className="section reviewHome"><div className="sectionHead"><div><span className="eyebrow">CUSTOMER LOVE</span><h2>{section.title}</h2>{section.subtitle && <p>{section.subtitle}</p>}</div></div><div className="reviewPlaceholder"><strong>Real Priyasa customer reviews</strong><span>Reviews are served by PriyasaCore and will appear here as review data becomes available.</span></div></section>;
}

export default async function Home() {
  const home = await getHome();
  if (!home) return <main className="homeFallback"><section className="hero"><div className="heroCopy"><span className="eyebrow">PRIYASA</span><h1>Style made for <em>every you.</em></h1><p>We could not load the live home configuration. Please try again.</p><Link className="button" href="/shop">Shop products</Link></div></section></main>;

  const sections = [...(home.sections || [])].filter(section => section.is_active !== false).sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
  return <main className="homeDynamic" data-home-version={home.version || ''} data-home-layout={home.layout || ''}>
    {sections.map(section => {
      if (section.type === 'hero_slider') return <Hero section={section} key={section.id} />;
      if (section.type === 'service_strip') return <ServiceStrip section={section} key={section.id} />;
      if (section.type === 'editorial_grid') return <Editorial section={section} key={section.id} />;
      if (section.type === 'offer_banner' || section.type === 'image_banner') return <Banner section={section} key={section.id} />;
      if (section.type === 'flash_sale') return <div key={section.id}><FlashSale section={section} /><ProductSection section={section} /></div>;
      if (section.type === 'product_carousel' || section.type === 'product_grid' || section.type === 'personalized_products') return <ProductSection section={section} key={section.id} />;
      if (section.type === 'review_carousel') return <ReviewSection section={section} key={section.id} />;
      return null;
    })}
  </main>;
}
