'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import { api } from '@/lib/api';

function OrdersContent() {
  const [orders, setOrders] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (nextPage = page) => {
    setLoading(true); setError('');
    try {
      const r = await api<any>(`/storefront/orders?page=${Math.max(1, nextPage)}&per_page=20`);
      const paginator = r.data || {};
      const rows = Array.isArray(paginator.data) ? paginator.data : (paginator.orders || r.orders || (Array.isArray(paginator) ? paginator : []));
      setOrders(Array.isArray(rows) ? rows : []);
      setPage(Number(paginator.current_page || nextPage) || 1);
      setLastPage(Math.max(1, Number(paginator.last_page || 1) || 1));
      setTotal(Number.isFinite(Number(paginator.total)) ? Number(paginator.total) : null);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load orders'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { void load(1); }, [load]);

  return <main className="accountPage"><div className="sectionHead"><div><span className="eyebrow">MY PRIYASA</span><h1>Orders</h1></div>{total !== null && <span className="muted">{total.toLocaleString('en-IN')} orders</span>}</div>{loading ? <div className="emptyState"><p className="muted">Loading your orders…</p></div> : error && !orders.length ? <div className="emptyState"><h2>We couldn't load your orders</h2><p>{error}</p><button className="button" onClick={() => void load(page)}>Retry</button></div> : orders.length ? <><div className="orderList">{orders.map((o, i) => <article className="orderCard" key={o.id || i}><div><strong>Order #{o.order_number || o.id}</strong><small>{o.status || 'Processing'}</small><small>{o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN') : ''}</small></div><div><b>₹{Number(o.total ?? o.grand_total ?? 0).toLocaleString('en-IN')}</b><Link href={`/orders/${o.id}`}>View order →</Link></div></article>)}</div>{lastPage > 1 && <nav className="pagination" aria-label="Order pages"><button className="filterChip" disabled={loading || page <= 1} onClick={() => void load(page - 1)}>← Previous</button><span>Page {page} of {lastPage}</span><button className="filterChip" disabled={loading || page >= lastPage} onClick={() => void load(page + 1)}>Next →</button></nav>}</> : <div className="emptyState"><h2>No orders yet</h2><p>Your completed purchases will appear here.</p><Link className="button" href="/shop">Start shopping</Link></div>}</main>;
}

export default function Orders() { return <AuthGuard><OrdersContent /></AuthGuard>; }
