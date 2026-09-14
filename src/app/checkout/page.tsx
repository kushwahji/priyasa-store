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
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [quote, setQuote] = useState<Quote>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadQuote = useCallback(async (code: string) => {
    try {
      const r = await api<any>('/storefront/checkout/validate', { method: 'POST', body: JSON.stringify({ coupon_code: code || '' }) });
      const nextQuote = quoteOf(r);
      setQuote(nextQuote);
      return nextQuote;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unable to validate your bag.';
      setError(message);
      throw e;
    }
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
      } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load checkout.'); }
      finally { setLoading(false); }
    })();
  }, [loadQuote]);

  async function applyCoupon() {
    setError(''); setMessage('');
    const code = coupon.trim().toUpperCase();
    try { await loadQuote(code); setMessage(code ? 'Coupon checked against the current cart.' : 'Coupon removed.'); }
    catch { /* loadQuote already exposes the API error */ }
  }

  async function placeOrder() {
    if (!selected) { setError('Select a delivery address.'); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      const r = await api<any>('/storefront/checkout/create-order', {
        method: 'POST',
        body: JSON.stringify({ shipping_address_id: selected, coupon_code: coupon.trim().toUpperCase(), payment_method: paymentMethod }),
      });
      const v = unwrap(r);
      const orderId = v.order?.id ?? v.id ?? v.order_id;
      if (!orderId) throw new Error('Checkout did not return an order id.');
      if (paymentMethod === 'cod') window.location.assign(`/orders/${encodeURIComponent(String(orderId))}`);
      else window.location.assign(`/checkout/payment?order=${encodeURIComponent(String(orderId))}`);
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
        <div className="checkoutCard"><span className="eyebrow">STEP 3</span><h2>Payment method</h2>
          <div className="paymentOptions">
            <button type="button" className={`paymentChoice ${paymentMethod === 'razorpay' ? 'selected' : ''}`} onClick={() => setPaymentMethod('razorpay')}><b>Razorpay</b><span>UPI, cards, net banking and wallets</span></button>
            <button type="button" className={`paymentChoice ${paymentMethod === 'cod' ? 'selected' : ''}`} onClick={() => setPaymentMethod('cod')}><b>Cash on Delivery</b><span>Pay securely when your order is delivered</span></button>
          </div>
          <p className="muted">{paymentMethod === 'razorpay' ? 'Payment is verified by PriyasaCore. The browser does not mark an order as paid.' : 'COD orders are created server-side and do not require online payment.'}</p>
        </div>
      </section>
      <aside className="summary"><span className="eyebrow">ORDER SUMMARY</span><div><span>Subtotal</span><b>{money(subtotal)}</b></div>{discount > 0 && <div><span>Discount</span><b>-{money(discount)}</b></div>}<div><span>Shipping</span><b>{shipping ? money(shipping) : 'FREE'}</b></div>{tax > 0 && <div><span>Tax</span><b>{money(tax)}</b></div>}<hr/><div><strong>Total</strong><strong>{money(total)}</strong></div><button className="button" disabled={busy || !selected} onClick={placeOrder}>{busy ? (paymentMethod === 'cod' ? 'Placing order…' : 'Creating secure order…') : (paymentMethod === 'cod' ? 'Place COD order' : 'Continue to payment')}</button><small className="muted">Final amount is calculated server-side from the current cart.</small></aside>
    </div>}
  </main>;
}
