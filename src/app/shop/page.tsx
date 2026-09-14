import ProductCard from '@/components/ProductCard';
import { api } from '@/lib/api';

type Product = { id?: string|number; slug?: string; name: string; category?: string; price?: number; mrp?: number; image?: string };
type Result = { data?: { products?: Product[]; categories?: {id?:string;slug:string;name:string}[] } };

async function getProducts(searchParams: Record<string,string|undefined>) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) if (value) qs.set(key, value);
  qs.set('limit', '48');
  try { return await api<Result>(`/storefront/products?${qs.toString()}`); } catch { return { data: { products: [], categories: [] } }; }
}

export default async function Shop({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }) {
  const params = await searchParams;
  const result = await getProducts(params);
  const products = result.data?.products || [];
  const categories = result.data?.categories || [];
  return <main className="catalogPage"><div className="sectionHead"><div><span className="eyebrow">PRIYASA / SHOP</span><h1>All styles</h1><p className="muted">Discover the latest PRIYASA collections.</p></div><span className="muted">{products.length} styles</span></div>
    <div className="shopToolbar"><div className="filterChips">{categories.slice(0,6).map(c => <a key={c.slug} className="filterChip" href={`/shop?category=${encodeURIComponent(c.slug)}`}>{c.name}</a>)}</div><select defaultValue={params.sort || 'relevance'} aria-label="Sort products" onChange={() => {}}><option value="relevance">Recommended</option><option value="newest">Newest</option><option value="price_asc">Price: Low to High</option><option value="price_desc">Price: High to Low</option><option value="discount">Discount</option></select></div>
    {products.length ? <div className="productGrid">{products.map((p, i) => <ProductCard key={String(p.id || p.slug || i)} product={p} />)}</div> : <div className="emptyState"><h2>Collection loading</h2><p>Products will appear here when the PriyasaCore catalog API is connected.</p><a className="button" href="/search">Search the store</a></div>}
  </main>;
}
