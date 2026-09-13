import type { Metadata } from 'next';
import Link from 'next/link';
import { api } from '@/lib/api';
import ProductActions from '@/components/ProductActions';
import ProductReviews from '@/components/ProductReviews';

type Variant = { id: string | number; sku?: string; size?: string | null; color?: string | null; attributes?: Record<string, unknown>; price?: number; mrp?: number; discount_percent?: number; stock?: { available?: number; quantity?: number } };
type Product = { id?: string | number; slug?: string; name: string; description?: string; brand?: string | { name?: string }; category?: string | { name?: string }; price?: number; mrp?: number; image?: string; images?: string[]; media?: Array<{ url?: string; type?: string; position?: number }>; rating?: number | { average?: number; count?: number }; reviewCount?: number; variants?: Variant[]; badges?: string[]; delivery?: any };

function normalizeProduct(raw: Product): Product {
  const media = raw.media?.map(item => item.url).filter(Boolean) as string[] | undefined;
  const rating = typeof raw.rating === 'object' ? Number(raw.rating?.average || 0) : Number(raw.rating || 0);
  const reviewCount = typeof raw.rating === 'object' ? Number(raw.rating?.count || 0) : Number(raw.reviewCount || 0);
  const first = raw.variants?.find(v => Number(v.price || 0) > 0) || raw.variants?.[0];
  return {
    ...raw,
    image: raw.image || media?.[0],
    images: raw.images?.length ? raw.images : media,
    price: Number(raw.price ?? first?.price ?? 0),
    mrp: Number(raw.mrp ?? first?.mrp ?? 0),
    rating,
    reviewCount,
    category: typeof raw.category === 'object' ? raw.category?.name : raw.category,
    brand: typeof raw.brand === 'object' ? raw.brand?.name : raw.brand,
  };
}

async function getProduct(slug: string) {
  try {
    const r = await api<{ data?: Product & { product?: Product } }>(`/storefront/products/${encodeURIComponent(slug)}`);
    const raw = r.data?.product || r.data;
    return raw ? normalizeProduct(raw) : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return { title: 'Product unavailable | PRIYASA' };
  const description = (p.description || `Shop ${p.name} from PRIYASA.`).slice(0, 160);
  return { title: p.name, description, alternates: { canonical: `/product/${encodeURIComponent(p.slug || slug)}` }, openGraph: { title: `${p.name} | PRIYASA`, description, type: 'website', images: p.image ? [{ url: p.image, alt: p.name }] : [] } };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return <main className="catalogPage"><div className="emptyState"><h1>Product unavailable</h1><p>This product could not be loaded from PriyasaCore.</p><Link className="button" href="/shop">Continue shopping</Link></div></main>;

  const variants = p.variants || [];
  const images = (p.images || [p.image]).filter(Boolean) as string[];
  const price = Number(p.price || 0);
  const mrp = Number(p.mrp || 0);
  const discount = mrp > price ? Math.round((1 - price / mrp) * 100) : 0;
  const sizes = [...new Set(variants.map(v => v.size).filter(Boolean))] as string[];
  const colors = [...new Set(variants.map(v => v.color).filter(Boolean))] as string[];
  const rating = Number(p.rating || 0);
  const productSchema = { '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.description || undefined, image: images, category: typeof p.category === 'string' ? p.category : undefined, offers: { '@type': 'Offer', price: price.toFixed(2), priceCurrency: 'INR', availability: variants.some(v => Number(v.stock?.available || 0) > 0) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', url: `/product/${encodeURIComponent(p.slug || slug)}` }, ...(rating > 0 && Number(p.reviewCount || 0) > 0 ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: rating.toFixed(1), reviewCount: Number(p.reviewCount) } } : {}) };
  const jsonLd = JSON.stringify(productSchema).replace(/</g, '\\u003c');

  return <>
    <main className="pdp">
      <div className="pdpGallery"><div className="pdpMainImage">{p.image && <img src={p.image} alt={p.name} />}</div><div className="pdpThumbs">{images.slice(0, 8).map((src, i) => <div key={`${src}-${i}`} className="pdpThumb"><img src={src} alt="" /></div>)}</div></div>
      <section className="pdpInfo"><span className="eyebrow">PRIYASA / {typeof p.category === 'string' ? p.category : 'COLLECTION'}</span><h1>{p.name}</h1>{typeof p.brand === 'string' && p.brand && <p className="muted">{p.brand}</p>}<div className="pdpRating">★ {rating > 0 ? rating.toFixed(1) : 'New'} <span>{Number(p.reviewCount || 0)} reviews</span></div><div className="pdpPrice">₹{price.toLocaleString('en-IN')} {mrp > price && <><del>₹{mrp.toLocaleString('en-IN')}</del><b>{discount}% OFF</b></>}</div><div className="pdpLine" /><p className="pdpDescription">{p.description || 'Designed for comfortable everyday styling with the PRIYASA finish.'}</p><div className="deliveryBox"><strong>Delivery & returns</strong><p>Enter your pincode during checkout to confirm serviceability and delivery options.</p></div><ProductActions productId={p.id || slug} variantId={variants[0]?.id || ''} variants={variants} sizes={sizes} colors={colors} /></section>
    </main>
    <main className="catalogPage"><ProductReviews productId={p.id || slug} /></main>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
  </>;
}
