'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import { api } from '@/lib/api';

function OrdersContent() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  async function load() {
    setLoading(true); setError('');
    try { const r = await api<any>('/storefront/orders?per_page=50'); setOrders(r.data?.data || r.data?.orders || r.orders || (Array.isArray(r.data) ? r.data : [])); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load orders'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  return <main className="accountPage"><span className="eyebrow">MY PRIYASA</span><h1>Orders</h1>{loading ? <p className="muted">Loading your orders…</p> : error && !orders.length ? <div className="emptyState"><h2>We couldn't load your orders</h2><p>{error}</p><button className="button" onClick={load}>Retry</button></div> : orders.length ? <div className="orderList">{orders.map((o, i) => <article className="orderCard" key={o.id || i}><div><strong>Order #{o.order_number || o.id}</strong><small>{o.status || 'Processing'}</small><small>{o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN') : ''}</small></div><div><b>₹{Number(o.total || o.grand_total || 0).toLocaleString('en-IN')}</b><Link href={`/orders/${o.id}`}>View order →</Link></div></article>)}</div> : <div className="emptyState"><h2>No orders yet</h2><p>Your completed purchases will appear here.</p><Link className="button" href="/shop">Start shopping</Link></div>}</main>;
}

export default function Orders() { return <AuthGuard><OrdersContent /></AuthGuard>; }
