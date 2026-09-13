'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import { api } from '@/lib/api';

function TicketPageInner() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<any>(null);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    try { const r = await api<any>(`/storefront/support/tickets/${encodeURIComponent(id)}`); setTicket(r.data?.ticket || r.ticket || r.data || r); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load ticket'); }
  }
  useEffect(() => { if (id) load(); }, [id]);

  async function sendReply(e: React.FormEvent) {
    e.preventDefault(); if (!reply.trim()) return;
    setBusy(true); setError(''); setNotice('');
    try { await api(`/storefront/support/tickets/${encodeURIComponent(id)}/messages`, { method: 'POST', body: JSON.stringify({ message: reply.trim() }) }); setReply(''); setNotice('Reply sent.'); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to send reply'); }
    finally { setBusy(false); }
  }

  async function closeTicket() {
    setBusy(true); setError('');
    try { await api(`/storefront/support/tickets/${encodeURIComponent(id)}/close`, { method: 'POST', body: JSON.stringify({}) }); setNotice('Ticket closed.'); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to close ticket'); }
    finally { setBusy(false); }
  }

  if (!ticket && !error) return <main className="accountPage"><p className="muted">Loading support ticket…</p></main>;
  return <main className="accountPage"><div className="sectionHead"><div><span className="eyebrow">PRIYASA / SUPPORT</span><h1>{ticket?.subject || `Ticket #${id}`}</h1><p className="muted">Status: {ticket?.status || 'open'}</p></div><Link className="textLink" href="/support">← Support</Link></div>{error && <div className="formError" role="alert">{error}</div>}{notice && <div className="formMessage" role="status">{notice}</div>}<div className="checkoutCard">{ticket?.messages?.length ? ticket.messages.map((m: any, i: number) => <article key={m.id || i} className="checkoutCard"><strong>{m.author_name || m.sender || 'PRIYASA Support'}</strong><p>{m.message || m.body}</p><small>{m.created_at ? new Date(m.created_at).toLocaleString('en-IN') : ''}</small></article>) : <p className="muted">No messages loaded for this ticket.</p>}</div>{String(ticket?.status || '').toLowerCase() !== 'closed' && <form className="checkoutCard" onSubmit={sendReply}><h2>Reply</h2><textarea rows={5} value={reply} onChange={e => setReply(e.target.value)} maxLength={10000} required placeholder="Write your reply…" /><div className="heroActions"><button className="button" disabled={busy}>{busy ? 'Sending…' : 'Send reply'}</button><button type="button" className="button secondary" disabled={busy} onClick={closeTicket}>Close ticket</button></div></form>}</main>;
}

export default function TicketPage() { return <AuthGuard><TicketPageInner /></AuthGuard>; }
