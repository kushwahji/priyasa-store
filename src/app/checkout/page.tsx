'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Address = Record<string, any>;
type Quote = Record<string, any>;

function unwrap(r: any) { return r?.data ?? r ?? {}; }
function addressesOf(r: any): Address[] { const v = unwrap(r); return Array.isArray(v) ? v : v.addresses ?? v.data?.addresses ?? []; }
function quoteOf(r: any): Quote { const v = unwrap(r); return v.quote ?? v; }
function money(v: any) { return `₹${Number(v || 0).toLocaleString('en-IN')}`; }

export default function Checkout() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selected, setSelected] = useState('');
  const [coupon, setCoupon] = useState('');
  const [quote, setQuote] = useState<Quote>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadQuote = useCallback(async (code: string) => {
    const r = await api<any>('/storefront/checkout/validate', { method: 'POST', body: JSON.stringify({ coupon_code: code || '' }) });
    setQuote(quoteOf(r));
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true); setError('');
      try {
        const r = await api<any>('/storefront/addresses');
        const list = addressesOf(r);
        setAddresses(list);
        const preferred = list.find(a => a.is_default || a.default || a.default_address) || list[0];
        if (preferred) setSelected(String(preferred.id));
        await loadQuote('');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unable to load checkout.');
      } finally { setLoading(false); }
    })();
  }, [loadQuote]);

  async function applyCoupon() {
    setError(''); setMessage('');
    try { await loadQuote(coupon.trim().toUpperCase()); setMessage(coupon ? 'Coupon checked against the current cart.' : 'Coupon removed.'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Coupon could not be applied.'); }
  }

  async function placeOrder() {
    if (!selected) { setError('Select a delivery address.'); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      const r = await api<any>('/storefront/checkout/create-order', {
        method: 'POST',
        body: JSON.stringify({ shipping_address_id: selected, coupon_code: coupon.trim().toUpperCase(), payment_method: 'razorpay' }),
      });
      const v = unwrap(r);
      const orderId = v.order?.id ?? v.id ?? v.order_id;
      if (!orderId) throw new Error('Checkout did not return an order id.');
      window.location.assign(`/checkout/payment?order=${encodeURIComponent(String(orderId))}`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to create your order.'); setBusy(false); }
  }

  const subtotal = Number(quote.subtotal ?? quote.items_subtotal ?? 0);
  const discount = Number(quote.discount_total ?? quote.discount ?? 0);
  const shipping = Number(quote.shipping_total ?? quote.shipping ?? 0);
  const tax = Number(quote.tax_total ?? quote.tax ?? 0);
  const total = Number(quote.grand_total ?? quote.total ?? subtotal - discount + shipping + tax);

  return <main className="checkoutPage">
    <div className="sectionHead"><div><span className="eyebrow">PRIYASA / CHECKOUT</span><h1>Secure checkout</h1><p className="muted">Address → payment → order confirmation</p></div><Link className="textLink" href="/cart">← Bag</Link></div>
    {error && <div className="formError" role="alert">{error}</div>}
    {message && <div className="formMessage" role="status">{message}</div>}
    {loading ? <div className="emptyState"><h2>Preparing your checkout…</h2></div> : <div className="checkoutGrid">
      <section>
        <div className="checkoutCard"><span className="eyebrow">STEP 1</span><h2>Delivery address</h2>
          {addresses.length ? addresses.map(a => <button type="button" key={a.id} className={`addressChoice ${selected === String(a.id) ? 'selected' : ''}`} onClick={() => setSelected(String(a.id))}>
            <b>{a.name || a.full_name || 'Delivery address'} {a.is_default || a.default ? ' · Default' : ''}</b>
            <span>{[a.address_line1 ?? a.line1, a.address_line2 ?? a.line2, a.city, a.state, a.postal_code ?? a.pincode].filter(Boolean).join(', ')}</span>
            {(a.mobile_number || a.phone) && <small>{a.mobile_number || a.phone}</small>}
          </button>) : <div className="emptyInline"><p>No saved address found.</p><Link href="/addresses">Add delivery address</Link></div>}
        </div>
        <div className="checkoutCard"><span className="eyebrow">STEP 2</span><h2>Offers & coupon</h2><div className="coupon"><input aria-label="Coupon code" value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())} placeholder="Enter coupon code"/><button type="button" onClick={applyCoupon}>Apply</button></div></div>
        <div className="checkoutCard"><span className="eyebrow">STEP 3</span><h2>Payment</h2><div className="paymentChoice"><b>Razorpay</b><span>UPI, cards, net banking and wallets</span></div><p className="muted">Payment is verified by PriyasaCore. The browser does not mark an order as paid.</p></div>
      </section>
      <aside className="summary"><span className="eyebrow">ORDER SUMMARY</span><div><span>Subtotal</span><b>{money(subtotal)}</b></div>{discount > 0 && <div><span>Discount</span><b>-{money(discount)}</b></div>}<div><span>Shipping</span><b>{shipping ? money(shipping) : 'FREE'}</b></div>{tax > 0 && <div><span>Tax</span><b>{money(tax)}</b></div>}<hr/><div><strong>Total</strong><strong>{money(total)}</strong></div><button className="button" disabled={busy || !selected} onClick={placeOrder}>{busy ? 'Creating secure order…' : 'Continue to payment'}</button><small className="muted">Your final amount is calculated server-side from the current cart.</small></aside>
    </div>}
  </main>;
}
