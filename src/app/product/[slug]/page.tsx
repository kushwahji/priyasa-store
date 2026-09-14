import type { Metadata } from 'next';
import Link from 'next/link';
import { api } from '@/lib/api';
import ProductActions from '@/components/ProductActions';

type Product = {
  id?: string | number;
  slug?: string;
  name: string;
  description?: string;
  category?: string;
  price?: number;
  mrp?: number;
  image?: string;
  images?: string[];
  sizes?: string[];
  colors?: string[];
  rating?: number;
  reviewCount?: number;
  variant_id?: string | number;
  variants?: Array<{ id: string | number }>;
};

async function getProduct(slug: string) {
  try {
    const r = await api<{ data?: Product }>(`/storefront/products/${encodeURIComponent(slug)}`);
    return r.data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return { title: 'Product unavailable' };
  const description = p.description || `Shop ${p.name} at PRIYASA.`;
  const image = p.image || p.images?.[0];
  return {
    title: p.name,
    description,
    alternates: { canonical: `/product/${encodeURIComponent(p.slug || slug)}` },
    openGraph: { title: p.name, description, type: 'website', ...(image ? { images: [{ url: image, alt: p.name }] } : {}) },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return <main className="catalogPage"><div className="emptyState"><h1>Product unavailable</h1><p>This product could not be loaded from PriyasaCore.</p><Link className="button" href="/shop">Continue shopping</Link></div></main>;

  const variantId = p.variant_id ?? p.variants?.[0]?.id ?? '';
  const price = Number(p.price || 0), mrp = Number(p.mrp || 0), discount = mrp > price ? Math.round((1 - price / mrp) * 100) : 0;
  const productUrl = `${process.env.NEXT_PUBLIC_STORE_URL || 'http://localhost:3000'}/product/${encodeURIComponent(p.slug || slug)}`;
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Product', name: p.name, url: productUrl,
    description: p.description || undefined, image: p.images?.length ? p.images : (p.image ? [p.image] : undefined),
    category: p.category || undefined,
    offers: { '@type': 'Offer', priceCurrency: 'INR', price, availability: 'https://schema.org/InStock', url: productUrl },
    ...(p.rating ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: p.rating, reviewCount: p.reviewCount || 1 } } : {}),
  };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <main className="pdp">
      <div className="pdpGallery">
        <div className="pdpMainImage">{p.image && <img src={p.image} alt={p.name} />}</div>
        <div className="pdpThumbs">{(p.images || [p.image]).filter(Boolean).slice(0, 5).map((src, i) => <div key={String(src) + i} className="pdpThumb"><img src={src} alt="" /></div>)}</div>
      </div>
      <section className="pdpInfo">
        <span className="eyebrow">PRIYASA / {p.category || 'COLLECTION'}</span>
        <h1>{p.name}</h1>
        <div className="pdpRating">★ {p.rating?.toFixed?.(1) || '4.5'} <span>{p.reviewCount || 0} reviews</span></div>
        <div className="pdpPrice">₹{price.toLocaleString('en-IN')} {mrp > price && <><del>₹{mrp.toLocaleString('en-IN')}</del><b>{discount}% OFF</b></>}</div>
        <div className="pdpLine" />
        <p className="pdpDescription">{p.description || 'Designed for comfortable everyday styling with the PRIYASA finish.'}</p>
        <div className="deliveryBox"><strong>Delivery & returns</strong><p>Enter your pincode at checkout to confirm delivery. Eligible products support easy returns.</p></div>
        <ProductActions variantId={variantId} sizes={p.sizes || []} colors={p.colors || []} />
      </section>
    </main>
  </>;
}
