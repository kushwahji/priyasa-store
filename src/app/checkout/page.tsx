'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Address = Record<string, any>;
type Quote = Record<string, any>;

function unwrap(r: any) { return r?.data ?? r ?? {}; }
function addressesOf(r: any): Address[] { const v = unwrap(r); return Array.isArray(v) ? v : v.items ?? v.addresses ?? v.data?.addresses ?? []; }
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

  const loadQuote = useCallback(async (addressId: string, code: string) => {
    if (!addressId) return null;
    try {
      const r = await api<any>('/storefront/checkout/quote', {
        method: 'POST',
        body: JSON.stringify({ shipping_address_id: Number(addressId), coupon_code: code || '' }),
      });
      const nextQuote = unwrap(r);
      setQuote(nextQuote);
      return nextQuote;
    } catch (e) {
      const text = e instanceof Error ? e.message : 'Unable to calculate delivery and checkout pricing.';
      setError(text);
      setQuote({});
      throw e;
    }
  }, []);

  const refreshQuote = useCallback(async (addressId: string, code: string) => {
    if (!addressId) return;
    setError('');
    try { await loadQuote(addressId, code); }
    catch { /* loadQuote exposes the API error */ }
  }, [loadQuote]);

  useEffect(() => {
    (async () => {
      setLoading(true); setError('');
      try {
        const r = await api<any>('/storefront/checkout/addresses');
        const list = addressesOf(r);
        setAddresses(list);
        const preferred = list.find(a => a.is_default || a.default || a.default_address) || list[0];
        if (preferred) {
          const id = String(preferred.id);
          setSelected(id);
          await loadQuote(id, '');
        }
      } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load checkout.'); }
      finally { setLoading(false); }
    })();
  }, [loadQuote]);

  async function selectAddress(id: string) {
    setSelected(id);
    await refreshQuote(id, coupon.trim().toUpperCase());
  }

  async function applyCoupon() {
    setError(''); setMessage('');
    if (!selected) { setError('Select a delivery address first.'); return; }
    const code = coupon.trim().toUpperCase();
    try { await loadQuote(selected, code); setMessage(code ? 'Coupon checked with delivery pricing.' : 'Coupon removed.'); }
    catch { /* loadQuote already exposes the API error */ }
  }

  async function placeOrder() {
    if (!selected) { setError('Select a delivery address.'); return; }
    const delivery = quote.delivery;
    if (delivery && delivery.serviceable === false) { setError('Delivery is unavailable for this pincode.'); return; }
    if (paymentMethod === 'cod' && delivery?.cod && delivery.cod.eligible === false) { setError(delivery.cod.reason || 'Cash on Delivery is unavailable for this delivery.'); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      const r = await api<any>('/storefront/checkout/place', {
        method: 'POST',
        body: JSON.stringify({ shipping_address_id: Number(selected), coupon_code: coupon.trim().toUpperCase(), payment_method: paymentMethod }),
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
  const delivery = quote.delivery || {};
  const shipping = Number(quote.shipping_charge ?? quote.shipping_total ?? quote.shipping ?? delivery.shipping_charge ?? 0);
  const tax = Number(quote.tax_total ?? quote.tax ?? 0);
  const total = Number(quote.grand_total ?? quote.total ?? subtotal - discount + shipping + tax);

  return <main className="checkoutPage">
    <div className="sectionHead"><div><span className="eyebrow">PRIYASA / CHECKOUT</span><h1>Secure checkout</h1><p className="muted">Address → delivery → payment → confirmation</p></div><Link className="textLink" href="/cart">← Bag</Link></div>
    {error && <div className="formError" role="alert">{error}</div>}
    {message && <div className="formMessage" role="status">{message}</div>}
    {loading ? <div className="emptyState"><h2>Preparing your checkout…</h2></div> : <div className="checkoutGrid">
      <section>
        <div className="checkoutCard"><span className="eyebrow">STEP 1</span><h2>Delivery address</h2>
          {addresses.length ? addresses.map(a => <button type="button" key={a.id} className={`addressChoice ${selected === String(a.id) ? 'selected' : ''}`} onClick={() => void selectAddress(String(a.id))}>
            <b>{a.name || a.full_name || a.recipient_name || 'Delivery address'} {a.is_default || a.default ? ' · Default' : ''}</b>
            <span>{[a.address_line1 ?? a.line1, a.address_line2 ?? a.line2, a.landmark, a.city, a.state, a.pincode ?? a.postal_code].filter(Boolean).join(', ')}</span>
            {(a.phone || a.mobile_number) && <small>{a.phone || a.mobile_number}</small>}
          </button>) : <div className="emptyInline"><p>No saved address found.</p><Link href="/addresses">Add delivery address</Link></div>}
          {selected && delivery.pincode && <div className="deliveryStatus" aria-live="polite"><strong>{delivery.serviceable === false ? 'Not deliverable' : 'Delivery available'}</strong><span>PIN {delivery.pincode}{delivery.delivery_promise ? ` · ${delivery.delivery_promise}` : ''}</span></div>}
        </div>
        <div className="checkoutCard"><span className="eyebrow">STEP 2</span><h2>Offers & coupon</h2><div className="coupon"><input aria-label="Coupon code" value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())} placeholder="Enter coupon code"/><button type="button" onClick={() => void applyCoupon()}>Apply</button></div></div>
        <div className="checkoutCard"><span className="eyebrow">STEP 3</span><h2>Payment method</h2>
          <div className="paymentOptions">
            <button type="button" className={`paymentChoice ${paymentMethod === 'razorpay' ? 'selected' : ''}`} onClick={() => setPaymentMethod('razorpay')}><b>Razorpay</b><span>UPI, cards, net banking and wallets</span></button>
            <button type="button" className={`paymentChoice ${paymentMethod === 'cod' ? 'selected' : ''}`} disabled={delivery?.cod?.eligible === false} className={`paymentChoice ${paymentMethod === 'cod' ? 'selected' : ''}`} onClick={() => setPaymentMethod('cod')}><b>Cash on Delivery</b><span>{delivery?.cod?.eligible === false ? (delivery.cod.reason || 'Unavailable for this delivery') : 'Pay securely when your order is delivered'}</span></button>
          </div>
          <p className="muted">{paymentMethod === 'razorpay' ? 'Payment is verified by PriyasaCore. The browser does not mark an order as paid.' : 'COD orders are created server-side and confirmed only when Core accepts COD for this delivery.'}</p>
        </div>
      </section>
      <aside className="summary"><span className="eyebrow">ORDER SUMMARY</span><div><span>Subtotal</span><b>{money(subtotal)}</b></div>{discount > 0 && <div><span>Discount</span><b>-{money(discount)}</b></div>}<div><span>Shipping</span><b>{shipping ? money(shipping) : 'FREE'}</b></div>{tax > 0 && <div><span>Tax</span><b>{money(tax)}</b></div>}<hr/><div><strong>Total</strong><strong>{money(total)}</strong></div><button className="button" disabled={busy || !selected || delivery.serviceable === false || (paymentMethod === 'cod' && delivery.cod?.eligible === false)} onClick={() => void placeOrder()}>{busy ? (paymentMethod === 'cod' ? 'Placing order…' : 'Creating secure order…') : (paymentMethod === 'cod' ? 'Place COD order' : 'Continue to payment')}</button><small className="muted">Delivery, discount, tax, inventory and final amount are authoritative in PriyasaCore.</small></aside>
    </div>}
  </main>;
}
