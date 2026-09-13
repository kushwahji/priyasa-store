'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import { api } from '@/lib/api';

type Ticket = { id: string | number; subject?: string; status?: string; priority?: string; category?: string; created_at?: string };

function SupportContent() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    try {
      const [t, c] = await Promise.all([api<any>('/storefront/support/tickets?per_page=30'), api<any>('/storefront/support/categories')]);
      setTickets(t.data?.data || t.data?.items || t.items || t.data || []);
      setCategories(c.data?.items || c.items || c.data || []);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load support centre'); }
  }
  useEffect(() => { load(); }, []);

  async function createTicket(e: React.FormEvent) {
    e.preventDefault(); if (!message.trim()) return;
    setBusy(true); setError(''); setNotice('');
    try { await api('/storefront/support/tickets', { method: 'POST', body: JSON.stringify({ category: category || undefined, subject: subject.trim() || undefined, message: message.trim() }) }); setSubject(''); setMessage(''); setNotice('Support ticket created. Our team can continue the conversation from here.'); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to create support ticket'); }
    finally { setBusy(false); }
  }

  return <main className="accountPage"><div className="sectionHead"><div><span className="eyebrow">PRIYASA / HELP</span><h1>Help & support</h1><p className="muted">Get assistance with orders, payments, delivery and returns.</p></div><Link className="textLink" href="/orders">My orders →</Link></div>{error && <div className="formError" role="alert">{error}</div>}{notice && <div className="formMessage" role="status">{notice}</div>}<div className="checkoutGrid"><section><form className="checkoutCard" onSubmit={createTicket}><h2>Contact support</h2><label>Category<select value={category} onChange={e => setCategory(e.target.value)}><option value="">Select a category</option>{categories.map((c, i) => <option key={c.id || c.slug || i} value={c.slug || c.name || c}>{c.name || c.label || c.slug || c}</option>)}</select></label><label>Subject<input value={subject} onChange={e => setSubject(e.target.value)} maxLength={180} placeholder="What do you need help with?" /></label><label>Message<textarea value={message} onChange={e => setMessage(e.target.value)} rows={6} maxLength={10000} required placeholder="Tell us what happened…" /></label><button className="button" disabled={busy}>{busy ? 'Creating ticket…' : 'Create support ticket'}</button></form></section><aside><div className="checkoutCard"><h2>My tickets</h2>{tickets.length ? <div className="orderList">{tickets.map(t => <Link className="orderCard" href={`/support/${t.id}`} key={t.id}><div><strong>{t.subject || `Ticket #${t.id}`}</strong><small>{t.category || 'Support'}</small></div><div><b>{t.status || 'open'}</b><small>{t.created_at ? new Date(t.created_at).toLocaleDateString('en-IN') : ''}</small></div></Link>)}</div> : <p className="muted">No support tickets yet.</p>}</div></aside></div></main>;
}

export default function SupportPage() { return <AuthGuard><SupportContent /></AuthGuard>; }
