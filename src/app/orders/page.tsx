'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

function ordersOf(r: any): any[] { const v = r?.data ?? r ?? {}; return Array.isArray(v) ? v : v.orders ?? v.data ?? v.items ?? []; }
function money(v: any) { return `₹${Number(v || 0).toLocaleString('en-IN')}`; }
function statusLabel(status: any) { return String(status || 'processing').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async () => { setLoading(true); setError(''); try { setOrders(ordersOf(await api<any>('/storefront/orders?per_page=50'))); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load orders.'); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  return <main className="accountPage"><div className="sectionHead"><div><span className="eyebrow">MY PRIYASA</span><h1>Orders</h1><p className="muted">Track purchases, delivery and returns in one place.</p></div><Link className="textLink" href="/account">Account →</Link></div>{error && <div className="formError" role="alert">{error}<button className="textButton" type="button" onClick={() => void load()}>Retry</button></div>}{loading ? <div className="emptyState"><h2>Loading orders…</h2></div> : orders.length ? <div className="orderList">{orders.map((o,i) => { const id=o.id||o.order_id; const total=o.grand_total ?? o.total ?? o.amount; const items=o.items||o.line_items||[]; const first=items[0]; return <article className="orderCard" key={String(id||i)}><div><strong>Order #{o.order_number||id}</strong><small>{statusLabel(o.status)}</small>{o.created_at && <small>{new Date(o.created_at).toLocaleDateString('en-IN')}</small>}{first && <small>{first.product_name||first.name||first.product?.name}{items.length>1 ? ` + ${items.length-1} more` : ''}</small>}</div><div><b>{money(total)}</b>{id && <Link href={`/orders/${encodeURIComponent(String(id))}`}>View order →</Link>}</div></article>; })}</div> : <div className="emptyState"><h2>No orders yet</h2><p>Your completed purchases will appear here.</p><Link className="button" href="/shop">Start shopping</Link></div>}</main>;
}
