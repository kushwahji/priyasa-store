'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import ProductCard from '@/components/ProductCard';
import { api } from '@/lib/api';

type Product = Record<string, any>;
function itemsOf(value: any): Product[] { const data = value?.data ?? value ?? []; if (Array.isArray(data)) return data; return data.items ?? data.products ?? data.wishlist ?? []; }
function cardItem(item: Product): Product { const product = item.product && typeof item.product === 'object' ? item.product : item; return { ...product, variant_id: item.variant_id ?? product.variant_id, is_wishlisted: true }; }

export default function WishlistPage() {
  const [items, setItems] = useState<Product[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState('');
  async function load() { setLoading(true); setError(''); try { const response = await api<any>('/storefront/wishlist'); setItems(itemsOf(response)); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load wishlist.'); } finally { setLoading(false); } }
  useEffect(() => { void load(); }, []);
  return <AuthGuard><main className="catalogPage"><div className="sectionHead"><div><span className="eyebrow">MY PRIYASA</span><h1>Wishlist</h1><p className="muted">Your saved styles, ready whenever you are.</p></div></div>{loading ? <div className="productGrid">{[1,2,3,4].map((id)=><div className="productSkeleton" key={id}/>)}</div> : error ? <div className="emptyState"><h2>Wishlist unavailable</h2><p>{error}</p><button className="button" onClick={()=>void load()}>Retry</button></div> : items.length===0 ? <div className="emptyState"><h2>Your wishlist is empty</h2><p>Save products you love and they will appear here.</p><Link className="button" href="/shop">Explore products</Link></div> : <div className="productGrid">{items.map((item,index)=><ProductCard key={String(item.id??item.variant_id??index)} product={cardItem(item)}/>)}</div>}</main></AuthGuard>;
}
