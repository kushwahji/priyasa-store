'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import AuthGuard from '@/components/AuthGuard';

function InvoiceInner() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError('');
    try {
      const r = await api<any>(`/storefront/orders/${encodeURIComponent(id)}/invoice`);
      setInvoice(r.data || r);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load invoice'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { void load(); }, [load]);
  const items = Array.isArray(invoice?.items) ? invoice.items : (Array.isArray(invoice?.line_items) ? invoice.line_items : []);

  return <main className="accountPage">
    <div className="sectionHead"><div><span className="eyebrow">PRIYASA / INVOICE</span><h1>Invoice</h1></div><Link className="textLink" href={`/orders/${encodeURIComponent(id)}`}>← Order</Link></div>
    {loading ? <div className="emptyState"><p className="muted">Loading invoice…</p></div> : error ? <div className="emptyState"><div className="formError" role="alert">{error}</div><button className="button" onClick={() => void load()}>Retry</button></div> : <div className="checkoutCard invoiceCard">
      {invoice?.invoice_number && <p><b>Invoice:</b> {invoice.invoice_number}</p>}
      <h2>Order #{invoice?.order_number || invoice?.order_id || id}</h2>
      {invoice?.issued_at && <p className="muted">Issued {new Date(invoice.issued_at).toLocaleString('en-IN')}</p>}
      {items.length ? items.map((item: any, i: number) => <div className="cartItem" key={item.id || i}><div><b>{item.name || item.product_name || 'Product'}</b><p className="muted">Qty {item.quantity || 1}</p></div><strong>₹{Number(item.total ?? item.amount ?? item.price ?? 0).toLocaleString('en-IN')}</strong></div>) : <p className="muted">No invoice line items were returned.</p>}
      <hr/><div><strong>Total</strong><strong>₹{Number(invoice?.total ?? invoice?.grand_total ?? 0).toLocaleString('en-IN')}</strong></div>
    </div>}
  </main>;
}
export default function InvoicePage() { return <AuthGuard><InvoiceInner /></AuthGuard>; }
