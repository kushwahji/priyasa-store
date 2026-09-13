'use client';

import { useEffect, useState } from 'react';
import ProductCard from '@/components/ProductCard';
import { api } from '@/lib/api';

type Product = { id?: string | number; slug?: string; name: string; category?: string; price?: number; mrp?: number; image?: string; badge?: string };

function normalizeItems(json: any): Product[] {
  const items = json?.data?.items || json?.items || json?.data?.products || json?.products || [];
  return items.map((p: any) => ({ ...p, price: Number(p.price ?? p.pricing?.selling_price ?? 0), mrp: Number(p.mrp ?? p.pricing?.mrp ?? 0), image: p.image || p.media?.[0]?.url || p.images?.[0] }));
}

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => { setQ(new URLSearchParams(window.location.search).get('q') || ''); }, []);
  useEffect(() => {
    const value = q.trim();
    const timer = setTimeout(async () => {
      if (!value) { setItems([]); setSuggestions([]); return; }
      setLoading(true); setError(false);
      try {
        const json = await api<any>(`/storefront/search?q=${encodeURIComponent(value)}&per_page=48`);
        setItems(normalizeItems(json));
        const s = await api<any>(`/storefront/search/suggestions?q=${encodeURIComponent(value)}&limit=6`).catch(() => null);
        setSuggestions((s?.data?.items || s?.items || []).map((x: any) => String(x.text || x.query || x)).filter(Boolean));
      } catch { setItems([]); setError(true); }
      finally { setLoading(false); }
    }, 180);
    return () => clearTimeout(timer);
  }, [q]);

  return <main className="searchPage"><div className="searchBox"><span className="eyebrow">PRIYASA / SEARCH</span><h1>{q ? `Results for “${q}”` : 'Find your next PRIYASA edit'}</h1><input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search kurtis, dresses, ethnic wear..." aria-label="Search products" />{suggestions.length > 0 && <div className="filterChips" aria-label="Search suggestions">{suggestions.map(s => <button type="button" className="filterChip" key={s} onClick={() => setQ(s)}>{s}</button>)}</div>}</div>{loading ? <div className="productGrid">{Array.from({ length: 8 }, (_, i) => <div className="productCard" key={i}><div className="productImage" /><div className="productInfo"><strong>Finding styles…</strong></div></div>)}</div> : error ? <div className="emptyState"><h2>Search temporarily unavailable</h2><p>PriyasaCore did not return a successful response.</p></div> : items.length ? <div className="productGrid">{items.map((p, i) => <ProductCard key={String(p.id || p.slug || i)} product={p} />)}</div> : q ? <div className="emptyState"><h2>No exact match</h2><p>Try a category, product name or simpler keyword.</p></div> : <div className="emptyState"><h2>Search the PRIYASA catalogue</h2><p>Try “kurti”, “dress”, “ethnic”, or “nightwear”.</p></div>}</main>;
}
