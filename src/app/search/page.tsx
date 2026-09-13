'use client';

import { useEffect, useState } from 'react';
import ProductCard from '@/components/ProductCard';
import { api } from '@/lib/api';

type Product = { id?: string | number; slug?: string; name: string; category?: string; price?: number; mrp?: number; image?: string; badge?: string };

type SearchMeta = { page?: number; per_page?: number; total?: number; last_page?: number; has_more?: boolean };

function normalizeItems(json: any): Product[] {
  const items = json?.data?.items || json?.items || json?.data?.products || json?.products || [];
  return Array.isArray(items) ? items.map((p: any) => ({ ...p, price: Number(p.price ?? p.pricing?.selling_price ?? 0), mrp: Number(p.mrp ?? p.pricing?.mrp ?? 0), image: p.image || p.media?.[0]?.url || p.images?.[0] })) : [];
}

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('relevance');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStock, setInStock] = useState(false);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<SearchMeta>({});
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQ(params.get('q') || '');
    setSort(params.get('sort') || 'relevance');
    setMinPrice(params.get('min_price') || '');
    setMaxPrice(params.get('max_price') || '');
    setInStock(params.get('in_stock') === '1');
    setPage(Math.max(1, Number(params.get('page') || 1)));
  }, []);

  useEffect(() => {
    const value = q.trim();
    const timer = setTimeout(async () => {
      if (!value) { setItems([]); setSuggestions([]); setMeta({}); return; }
      setLoading(true); setError(false);
      try {
        const params = new URLSearchParams({ q: value, per_page: '24', page: String(page), sort });
        if (minPrice) params.set('min_price', minPrice);
        if (maxPrice) params.set('max_price', maxPrice);
        if (inStock) params.set('in_stock', '1');
        const json = await api<any>(`/storefront/search?${params.toString()}`);
        setItems(normalizeItems(json));
        const pagination = json?.data?.pagination || json?.pagination || {};
        setMeta(pagination);
        const s = await api<any>(`/storefront/search/suggestions?q=${encodeURIComponent(value)}&limit=6`).catch(() => null);
        setSuggestions((s?.data?.items || s?.items || []).map((x: any) => String(x.text || x.query || x)).filter(Boolean));
      } catch { setItems([]); setMeta({}); setError(true); }
      finally { setLoading(false); }
    }, 180);
    return () => clearTimeout(timer);
  }, [q, sort, minPrice, maxPrice, inStock, page]);

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (sort !== 'relevance') params.set('sort', sort);
    if (minPrice) params.set('min_price', minPrice);
    if (maxPrice) params.set('max_price', maxPrice);
    if (inStock) params.set('in_stock', '1');
    const value = params.toString();
    window.history.replaceState(null, '', value ? `/search?${value}` : '/search');
  }

  return <main className="searchPage">
    <div className="searchBox"><span className="eyebrow">PRIYASA / SEARCH</span><h1>{q ? `Results for “${q}”` : 'Find your next PRIYASA edit'}</h1><input autoFocus value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder="Search kurtis, dresses, ethnic wear..." aria-label="Search products" />{suggestions.length > 0 && <div className="filterChips" aria-label="Search suggestions">{suggestions.map(s => <button type="button" className="filterChip" key={s} onClick={() => { setQ(s); setPage(1); }}>{s}</button>)}</div>}</div>
    {q && <form className="searchFilters" onSubmit={applyFilters}><select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }} aria-label="Sort"><option value="relevance">Recommended</option><option value="newest">Newest</option><option value="popularity">Popularity</option><option value="price_asc">Price low to high</option><option value="price_desc">Price high to low</option><option value="featured">Featured</option></select><input value={minPrice} onChange={e => setMinPrice(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="Min ₹" aria-label="Minimum price" /><input value={maxPrice} onChange={e => setMaxPrice(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="Max ₹" aria-label="Maximum price" /><label><input type="checkbox" checked={inStock} onChange={e => { setInStock(e.target.checked); setPage(1); }} /> In stock</label><button className="button" type="submit">Apply filters</button></form>}
    {loading ? <div className="productGrid">{Array.from({ length: 8 }, (_, i) => <div className="productCard" key={i}><div className="productImage" /><div className="productInfo"><strong>Finding styles…</strong></div></div>)}</div> : error ? <div className="emptyState"><h2>Search temporarily unavailable</h2><p>PriyasaCore did not return a successful response.</p></div> : items.length ? <><div className="sectionHead"><span className="muted">{Number(meta.total || items.length).toLocaleString('en-IN')} results</span></div><div className="productGrid">{items.map((p, i) => <ProductCard key={String(p.id || p.slug || i)} product={p} />)}</div>{Number(meta.last_page || 1) > 1 && <nav className="pagination" aria-label="Search pages"><button className="filterChip" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>← Previous</button><span>Page {page} of {meta.last_page}</span><button className="filterChip" disabled={page >= Number(meta.last_page)} onClick={() => setPage(p => p + 1)}>Next →</button></nav>}</> : q ? <div className="emptyState"><h2>No exact match</h2><p>Try a simpler keyword or widen the price filter.</p></div> : <div className="emptyState"><h2>Search the PRIYASA catalogue</h2><p>Try “kurti”, “dress”, “ethnic”, or “nightwear”.</p></div>}
  </main>;
}
