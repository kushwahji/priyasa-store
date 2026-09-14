'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

const REASONS = [
  'Product damaged or defective',
  'Wrong product received',
  'Product does not match description',
  'Size or fit issue',
  'Changed my mind',
  'Other',
];

type ApiRecord = Record<string, unknown>;
type OrderItem = ApiRecord & { id?: string | number; quantity?: number };
type Order = ApiRecord & { id?: string | number; order_number?: string | number; items?: OrderItem[]; line_items?: OrderItem[] };

function asRecord(value: unknown): ApiRecord {
  return value && typeof value === 'object' ? value as ApiRecord : {};
}

function unwrap(value: unknown): Order {
  const root = asRecord(value);
  const data = asRecord(root.data);
  return asRecord(data.order ?? root.order ?? root) as Order;
}

function ReturnRequestContent() {
  const search = useSearchParams();
  const router = useRouter();
  const orderId = search.get('order') || '';
  const [order, setOrder] = useState<Order | null>(null);
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!orderId) { setLoading(false); return; }
    setLoading(true); setError('');
    try { setOrder(unwrap(await api<unknown>(`/storefront/orders/${encodeURIComponent(orderId)}`))); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load this order.'); }
    finally { setLoading(false); }
  }, [orderId]);

  useEffect(() => { void load(); }, [load]);

  const items = useMemo(() => order?.items || order?.line_items || [], [order]);

  async function submit() {
    if (!orderId || !reason.trim()) return;
    setSubmitting(true); setError('');
    try {
      const payload = {
        reason: reason === 'Other' && details.trim() ? details.trim() : reason,
        ...(details.trim() && reason !== 'Other' ? { metadata: { customer_note: details.trim() } } : {}),
      };
      const response = await api<unknown>(`/storefront/orders/${encodeURIComponent(orderId)}/returns`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const root = asRecord(response);
      const data = asRecord(root.data);
      const created = asRecord(data.return ?? root.return ?? root.data ?? root);
      const returnId = created.id ?? created.return_id;
      router.replace(returnId ? `/returns/${encodeURIComponent(String(returnId))}` : '/returns');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to submit the return request.');
    } finally { setSubmitting(false); }
  }

  if (!orderId) return <main className="accountPage"><div className="emptyState"><h1>Return request</h1><p>Open a return request from an eligible order.</p><Link className="button" href="/orders">View orders</Link></div></main>;
  if (loading) return <main className="accountPage"><div className="emptyState"><h2>Loading order…</h2></div></main>;
  if (error && !order) return <main className="accountPage"><div className="emptyState"><h1>Return request unavailable</h1><p>{error}</p><button className="button" type="button" onClick={() => void load()}>Retry</button></div></main>;

  const orderNumber = order?.order_number || order?.id || orderId;
  return <main className="accountPage">
    <div className="sectionHead">
      <div><span className="eyebrow">PRIYASA / RETURNS</span><h1>Request a return</h1><p className="muted">Order #{orderNumber}</p></div>
      <Link className="textLink" href={`/orders/${encodeURIComponent(orderId)}`}>← Order details</Link>
    </div>

    {error && <div className="formError" role="alert">{error}</div>}

    <div className="orderDetailGrid">
      <section>
        <div className="checkoutCard">
          <span className="eyebrow">ORDER ITEMS</span>
          {items.length ? items.map((item, i) => <article className="orderLine" key={String(item.id || i)}>
            <div><strong>{String(item.product_name || item.name || asRecord(item.product).name || 'PRIYASA product')}</strong><small>{String(item.variant_label || item.size || asRecord(item.variant).label || 'Standard')} · Qty {Number(item.quantity || 1)}</small></div>
          </article>) : <p className="muted">Order items are not available in this response.</p>}
        </div>

        <div className="checkoutCard">
          <span className="eyebrow">WHY ARE YOU RETURNING IT?</span>
          <div className="formGrid">
            <label>Reason
              <select value={reason} onChange={e => setReason(e.target.value)} disabled={submitting}>
                {REASONS.map(value => <option key={value}>{value}</option>)}
              </select>
            </label>
            <label>Additional details <span className="muted">(optional)</span>
              <textarea value={details} onChange={e => setDetails(e.target.value)} maxLength={1000} rows={5} disabled={submitting} placeholder="Tell us anything that will help us review your request." />
            </label>
          </div>
          <p className="muted">Return eligibility, approval, items, refund amount and final outcome are decided by PRIYASA Core. The storefront does not calculate or promise a refund.</p>
          <button className="button" type="button" disabled={submitting || !reason.trim()} onClick={() => void submit()}>{submitting ? 'Submitting request…' : 'Submit return request'}</button>
        </div>
      </section>

      <aside className="summary">
        <span className="eyebrow">BEFORE YOU SUBMIT</span>
        <div><span>Order</span><b>#{orderNumber}</b></div>
        <div><span>Request type</span><b>Return</b></div>
        <hr />
        <p className="muted">Submitting creates a return request. It does not mark the order as returned or the refund as completed.</p>
      </aside>
    </div>
  </main>;
}

export default function ReturnRequestPage() {
  return <Suspense fallback={<main className="accountPage"><div className="emptyState"><h2>Loading return request…</h2></div></main>}><ReturnRequestContent /></Suspense>;
}
