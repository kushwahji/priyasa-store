'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import { api } from '@/lib/api';

type Product = { id: string | number; product_id?: string | number; variant_id?: string | number | null; slug?: string; name?: string; price?: number; mrp?: number | null; media?: Array<string | { url?: string }>; badge?: string };

function imageOf(p: Product) { const first = p.media?.[0]; return typeof first === 'string' ? first : first?.url; }

function WishlistContent() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | number | null>(null);

  async function load() {
    setLoading(true); setError('');
    try { const r = await api<any>('/storefront/wishlist'); setItems(r.data?.items || r.items || []); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load wishlist'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function remove(p: Product) {
    setBusy(p.id); setError('');
    try { await api(`/storefront/wishlist/items/${encodeURIComponent(String(p.id))}`, { method: 'DELETE' }); setItems(a => a.filter(x => String(x.id) !== String(p.id))); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to update wishlist'); }
    finally { setBusy(null); }
  }

  return <main className="catalogPage"><div className="sectionHead"><div><span className="eyebrow">PRIYASA / SAVED</span><h1>Wishlist</h1><p className="muted">Your saved styles, price changes and favourites.</p></div><Link className="textLink" href="/shop">Continue shopping →</Link></div>{loading ? <p className="muted">Loading your wishlist…</p> : error && !items.length ? <div className="emptyState"><h2>We couldn't load your wishlist</h2><p>{error}</p><button className="button" onClick={load}>Retry</button></div> : !items.length ? <div className="emptyState"><h2>Your wishlist is empty</h2><p>Save pieces you love and come back to them anytime.</p><Link className="button" href="/shop">Discover styles</Link></div> : <><div className="productGrid">{items.map(p => <article className="productCard" key={String(p.id)}><Link href={`/product/${p.slug || p.product_id || p.id}`}><div className="productImage">{imageOf(p) && <img src={imageOf(p)} alt={p.name || 'Saved product'} />}</div><div className="productMeta"><strong>{p.name || 'Product'}</strong><b>₹{Number(p.price || 0).toLocaleString('en-IN')}</b>{p.mrp && p.mrp > Number(p.price || 0) && <del>₹{Number(p.mrp).toLocaleString('en-IN')}</del>}{p.badge && <small>{p.badge}</small>}</div></Link><button className="textButton" disabled={busy === p.id} onClick={() => remove(p)}>{busy === p.id ? 'Removing…' : 'Remove'}</button></article>)}</div>{error && <div className="formError" role="alert">{error}</div>}</>}</main>;
}

export default function Wishlist() { return <AuthGuard><WishlistContent /></AuthGuard>; }
