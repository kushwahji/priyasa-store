'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import { api } from '@/lib/api';

function InvoiceInner() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError('');
    try { const r = await api<any>(`/storefront/orders/${encodeURIComponent(id)}/invoice`); setInvoice(r.data || r); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load invoice'); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { void load(); }, [load]);
  const items = Array.isArray(invoice?.lines) ? invoice.lines : (Array.isArray(invoice?.items) ? invoice.items : (Array.isArray(invoice?.line_items) ? invoice.line_items : []));
  const money = (value: unknown) => `₹${Number(value ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const address = invoice?.shipping_address || {};
  return <main className="accountPage">
    <div className="sectionHead"><div><span className="eyebrow">PRIYASA / INVOICE</span><h1>Invoice</h1></div><Link className="textLink" href={`/orders/${encodeURIComponent(id)}`}>← Order</Link></div>
    {loading ? <div className="emptyState"><p className="muted">Loading invoice…</p></div> : error ? <div className="emptyState"><div className="formError" role="alert">{error}</div><button className="button" onClick={() => void load()}>Retry</button></div> : <div className="checkoutCard invoiceCard">
      <div className="orderStatus"><strong>{invoice?.status || 'Issued'}</strong><span>{invoice?.invoice_number || `Order #${invoice?.order_id || id}`}</span></div>
      {invoice?.issued_at && <p className="muted">Issued {new Date(invoice.issued_at).toLocaleString('en-IN')}</p>}
      {invoice?.seller_gstin && <p className="muted">Seller GSTIN: {invoice.seller_gstin}</p>}
      {address?.recipient_name && <div><b>Shipping address</b><p>{address.recipient_name}<br/>{address.line1 || ''}{address.line2 ? <><br/>{address.line2}</> : null}<br/>{address.city || ''}, {address.state || ''} {address.postal_code || address.pincode || ''}</p></div>}
      <h2>Items</h2>
      {items.length ? items.map((item: any, i: number) => <div className="cartItem" key={item.order_item_id || item.id || i}><div><b>{item.product_name || item.name || 'Product'}</b><p className="muted">{item.variant_label ? `${item.variant_label} · ` : ''}Qty {item.quantity || 1} · Unit {money(item.unit_price)}</p></div><strong>{money(item.line_total ?? item.total ?? item.amount ?? item.price)}</strong></div>) : <p className="muted">No invoice line items were returned.</p>}
      <hr/>
      <div><span>Subtotal</span><strong>{money(invoice?.subtotal)}</strong></div>
      <div><span>Discount</span><strong>−{money(invoice?.discount_total)}</strong></div>
      <div><span>Tax</span><strong>{money(invoice?.tax_total)}</strong></div>
      <div><span>Shipping</span><strong>{money(invoice?.shipping_total)}</strong></div>
      <div><strong>Total</strong><strong>{money(invoice?.grand_total ?? invoice?.total)}</strong></div>
    </div>}
  </main>;
}
export default function InvoicePage() { return <AuthGuard><InvoiceInner /></AuthGuard>; }
