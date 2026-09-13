'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import { api } from '@/lib/api';

function NotificationsContent() {
  const [items, setItems] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState('');
  async function load() {
    try { const [inbox, count] = await Promise.all([api<any>('/storefront/notifications/inbox?per_page=50'), api<any>('/storefront/notifications/unread')]); setItems(inbox.data?.data || inbox.data?.items || inbox.items || []); setUnread(Number(count.data?.count ?? count.count ?? 0)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load notifications'); }
  }
  useEffect(() => { load(); }, []);
  async function markRead(id: string | number) { try { await api(`/storefront/notifications/${id}/read`, { method: 'POST', body: JSON.stringify({}) }); setItems(a => a.map(x => String(x.id) === String(id) ? { ...x, read_at: new Date().toISOString(), is_read: true } : x)); setUnread(n => Math.max(0, n - 1)); } catch { /* keep inbox usable */ } }
  return <main className="accountPage"><div className="sectionHead"><div><span className="eyebrow">MY PRIYASA / NOTIFICATIONS</span><h1>Notifications</h1><p className="muted">{unread} unread updates</p></div><Link className="textLink" href="/account">← Account</Link></div>{error && <div className="formError" role="alert">{error}</div>}{items.length ? <div className="orderList">{items.map((n, i) => <article className={`orderCard ${n.read_at || n.is_read ? '' : 'selected'}`} key={n.id || i}><div><strong>{n.title || n.subject || 'PRIYASA update'}</strong><small>{n.body || n.message || n.content || ''}</small></div><div>{!(n.read_at || n.is_read) && <button className="textButton" onClick={() => markRead(n.id)}>Mark read</button>}<small>{n.created_at ? new Date(n.created_at).toLocaleString('en-IN') : ''}</small></div></article>)}</div> : <div className="emptyState"><h2>You're all caught up</h2><p>Order updates and relevant PRIYASA messages will appear here.</p></div>}</main>;
}

export default function NotificationsPage() { return <AuthGuard><NotificationsContent /></AuthGuard>; }
