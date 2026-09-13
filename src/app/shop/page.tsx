import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { api } from '@/lib/api';

type Product = { id?: string | number; slug?: string; name: string; brand?: any; category?: any; pricing?: { selling_price?: number; mrp?: number }; price?: number; mrp?: number; media?: Array<{ url?: string }>; image?: string };
type Result = { data?: { data?: Product[]; meta?: { total?: number } } };
type CategoriesResult = { data?: Array<{ id?: string | number; slug: string; name: string }> };

function normalizeProduct(product: Product) {
  return {
    ...product,
    category: typeof product.category === 'object' ? product.category?.name : product.category,
    price: Number(product.price ?? product.pricing?.selling_price ?? 0),
    mrp: Number(product.mrp ?? product.pricing?.mrp ?? 0),
    image: product.image || product.media?.find(item => item.url)?.url,
  };
}

async function getProducts(searchParams: Record<string, string | undefined>) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) if (value) qs.set(key, value);
  qs.set('per_page', '48');
  try {
    const result = await api<Result>(`/storefront/products?${qs.toString()}`);
    return { products: (result.data?.data || []).map(normalizeProduct), total: Number(result.data?.meta?.total || 0) };
  } catch {
    return { products: [], total: 0 };
  }
}

async function getCategories() {
  try {
    const result = await api<CategoriesResult>('/storefront/categories');
    return result.data || [];
  } catch {
    return [];
  }
}

export default async function Shop({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const [{ products, total }, categories] = await Promise.all([getProducts(params), getCategories()]);
  const queryWithoutSort = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value && key !== 'sort') queryWithoutSort.set(key, value);
  const hrefForSort = (sort: string) => {
    const q = new URLSearchParams(queryWithoutSort);
    if (sort !== 'relevance') q.set('sort', sort);
    const value = q.toString();
    return value ? `/shop?${value}` : '/shop';
  };

  return <main className="catalogPage">
    <div className="sectionHead">
      <div><span className="eyebrow">PRIYASA / SHOP</span><h1>All styles</h1><p className="muted">Discover the latest PRIYASA collections.</p></div>
      <span className="muted">{total || products.length} styles</span>
    </div>
    <div className="shopToolbar">
      <div className="filterChips">
        {categories.slice(0, 8).map(c => <Link key={c.slug} className="filterChip" href={`/shop?category=${encodeURIComponent(c.slug)}`}>{c.name}</Link>)}
      </div>
      <div className="filterChips" aria-label="Sort products">
        <Link className={`filterChip ${!params.sort || params.sort === 'relevance' ? 'active' : ''}`} href={hrefForSort('relevance')}>Recommended</Link>
        <Link className={`filterChip ${params.sort === 'newest' ? 'active' : ''}`} href={hrefForSort('newest')}>Newest</Link>
        <Link className={`filterChip ${params.sort === 'price_asc' ? 'active' : ''}`} href={hrefForSort('price_asc')}>Price ↑</Link>
        <Link className={`filterChip ${params.sort === 'price_desc' ? 'active' : ''}`} href={hrefForSort('price_desc')}>Price ↓</Link>
        <Link className={`filterChip ${params.sort === 'discount' ? 'active' : ''}`} href={hrefForSort('discount')}>Discount</Link>
      </div>
    </div>
    {products.length ? <div className="productGrid">{products.map((p, i) => <ProductCard key={String(p.id || p.slug || i)} product={p} />)}</div> : <div className="emptyState"><h2>No styles found</h2><p>Try another category, search term or price filter.</p><Link className="button" href="/search">Search the store</Link></div>}
  </main>;
}
