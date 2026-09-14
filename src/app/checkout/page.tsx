'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Address = Record<string, any>;
function unwrap(r: any) { return r?.data ?? r ?? {}; }
function addressesOf(r: any): Address[] { const v = unwrap(r); return Array.isArray(v) ? v : v.items ?? v.addresses ?? v.data?.addresses ?? []; }

export default function Checkout() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selected, setSelected] = useState('');
  const [coupon, setCoupon] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadAddresses = useCallback(async () => {
    const r = await api<any>('/storefront/addresses');
    const list = addressesOf(r);
    setAddresses(list);
    const preferred = list.find(a => a.is_default || a.default || a.default_address) || list[0];
    if (preferred) setSelected(String(preferred.id));
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true); setError('');
      try { await loadAddresses(); }
      catch (e) { setError(e instanceof Error ? e.message : 'Unable to load checkout.'); }
      finally { setLoading(false); }
    })();
  }, [loadAddresses]);

  async function validateCoupon() {
    setError(''); setMessage('');
    try {
      await api('/storefront/checkout/validate', { method: 'POST', body: JSON.stringify({ coupon_code: coupon.trim().toUpperCase() }) });
      setMessage(coupon.trim() ? 'Coupon checked with PriyasaCore.' : 'Coupon removed.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to validate coupon.'); }
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

  return <main className="checkoutPage">
    <div className="sectionHead"><div><span className="eyebrow">PRIYASA / CHECKOUT</span><h1>Secure checkout</h1><p className="muted">Address → payment → confirmation</p></div><Link className="textLink" href="/cart">← Bag</Link></div>
    {error && <div className="formError" role="alert">{error}</div>}
    {message && <div className="formMessage" role="status">{message}</div>}
    {loading ? <div className="emptyState"><h2>Preparing your checkout…</h2></div> : <div className="checkoutGrid">
      <section>
        <div className="checkoutCard"><span className="eyebrow">STEP 1</span><h2>Delivery address</h2>
          {addresses.length ? addresses.map(a => <button type="button" key={a.id} className={`addressChoice ${selected === String(a.id) ? 'selected' : ''}`} onClick={() => setSelected(String(a.id))}>
            <b>{a.name || a.full_name || a.recipient_name || 'Delivery address'} {a.is_default || a.default ? ' · Default' : ''}</b>
            <span>{[a.address_line1 ?? a.line1, a.address_line2 ?? a.line2, a.landmark, a.city, a.state, a.pincode ?? a.postal_code].filter(Boolean).join(', ')}</span>
            {(a.phone || a.mobile_number) && <small>{a.phone || a.mobile_number}</small>}
          </button>) : <div className="emptyInline"><p>No saved address found.</p><Link href="/addresses">Add delivery address</Link></div>}
        </div>
        <div className="checkoutCard"><span className="eyebrow">STEP 2</span><h2>Offers & coupon</h2><div className="coupon"><input aria-label="Coupon code" value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())} placeholder="Enter coupon code"/><button type="button" onClick={() => void validateCoupon()}>Apply</button></div></div>
        <div className="checkoutCard"><span className="eyebrow">STEP 3</span><h2>Payment method</h2>
          <div className="paymentOptions">
            <button type="button" className={`paymentChoice ${paymentMethod === 'razorpay' ? 'selected' : ''}`} onClick={() => setPaymentMethod('razorpay')}><b>Razorpay</b><span>UPI, cards, net banking and wallets</span></button>
            <button type="button" className={`paymentChoice ${paymentMethod === 'cod' ? 'selected' : ''}`} onClick={() => setPaymentMethod('cod')}><b>Cash on Delivery</b><span>Availability is validated by PriyasaCore when the order is created.</span></button>
          </div>
          <p className="muted">{paymentMethod === 'razorpay' ? 'Payment is verified by PriyasaCore. The browser does not mark an order as paid.' : 'COD is accepted only when PriyasaCore accepts the order.'}</p>
        </div>
      </section>
      <aside className="summary"><span className="eyebrow">ORDER SUMMARY</span><p className="muted">Final pricing, inventory, delivery charges, tax and discounts are authoritative in PriyasaCore.</p><hr/><button className="button" disabled={busy || !selected} onClick={() => void placeOrder()}>{busy ? (paymentMethod === 'cod' ? 'Placing order…' : 'Creating secure order…') : (paymentMethod === 'cod' ? 'Place COD order' : 'Continue to payment')}</button></aside>
    </div>}
  </main>;
}
