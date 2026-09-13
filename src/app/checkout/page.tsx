'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import AuthGuard from '@/components/AuthGuard';

type Address = { id: string | number; name?: string; recipient_name?: string; phone?: string; address_line1?: string; address_line2?: string; line1?: string; line2?: string; landmark?: string; city: string; state: string; pincode?: string; postal_code?: string; is_default?: boolean };
type Quote = { subtotal?: number; discount?: number; shipping_charge?: number; grand_total?: number; total?: number; delivery?: { serviceable?: boolean; message?: string; shipping_charge?: number; cod?: { eligible?: boolean } } };

function CheckoutContent() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selected, setSelected] = useState('');
  const [coupon, setCoupon] = useState('');
  const [couponState, setCouponState] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadAddresses() {
    setLoading(true); setError('');
    try {
      const r = await api<{ data?: Address[] }>('/storefront/checkout/addresses');
      const list = r.data || [];
      setAddresses(list);
      const d = list.find(x => x.is_default) || list[0];
      setSelected(String(d?.id || ''));
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load addresses'); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadAddresses(); }, []);

  async function loadQuote(addressId = selected, method = paymentMethod, code = coupon) {
    if (!addressId) { setQuote(null); return; }
    try {
      const r = await api<{ data?: Quote }>('/storefront/checkout/transaction/quote', { method: 'POST', body: JSON.stringify({ shipping_address_id: Number(addressId), coupon_code: code.trim() || undefined, payment_method: method }) });
      setQuote(r.data || null);
    } catch (e) { setQuote(null); setError(e instanceof Error ? e.message : 'Unable to calculate checkout total'); }
  }

  useEffect(() => { if (selected) loadQuote(); }, [selected, paymentMethod]);

  async function validateCoupon() {
    const code = coupon.trim();
    if (!code) { setCouponState('idle'); await loadQuote(selected, paymentMethod, ''); return true; }
    setCouponState('checking'); setError('');
    try { await loadQuote(selected, paymentMethod, code); setCouponState('valid'); return true; }
    catch { setCouponState('invalid'); return false; }
  }

  async function placeOrder() {
    if (!selected) { setError('Select a delivery address.'); return; }
    if (quote?.delivery?.serviceable === false) { setError(quote.delivery.message || 'Delivery is unavailable for this address.'); return; }
    if (paymentMethod === 'cod' && quote?.delivery?.cod?.eligible === false) { setError('Cash on Delivery is unavailable for this order.'); return; }
    setBusy(true); setError('');
    try {
      if (coupon.trim() && couponState !== 'valid' && !(await validateCoupon())) return;
      const r = await api<any>('/storefront/checkout/transaction/place', { method: 'POST', body: JSON.stringify({ shipping_address_id: Number(selected), coupon_code: coupon.trim() || undefined, payment_method: paymentMethod }) });
      const orderId = r.data?.id || r.data?.order_id || r.order_id;
      if (!orderId) throw new Error('Checkout did not return an order id.');
      if (paymentMethod === 'cod') window.location.href = `/orders/${encodeURIComponent(String(orderId))}`;
      else window.location.href = `/checkout/payment?order=${encodeURIComponent(String(orderId))}`;
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to create order'); }
    finally { setBusy(false); }
  }

  return <main className="checkoutPage"><div className="sectionHead"><div><span className="eyebrow">PRIYASA / CHECKOUT</span><h1>Secure checkout</h1></div><Link className="textLink" href="/cart">← Bag</Link></div>{error && <div className="formError" role="alert">{error}</div>}<div className="checkoutGrid"><section><div className="checkoutCard"><h2>1. Delivery address</h2>{loading ? <p className="muted">Loading saved addresses…</p> : addresses.length ? addresses.map(a => <button type="button" key={a.id} className={`addressChoice ${selected === String(a.id) ? 'selected' : ''}`} onClick={() => setSelected(String(a.id))}><b>{a.recipient_name || a.name || 'Delivery address'}{a.is_default ? ' · Default' : ''}</b><span>{a.address_line1 || a.line1 || ''}{a.address_line2 || a.line2 ? `, ${a.address_line2 || a.line2}` : ''}, {a.city}, {a.state} {a.pincode || a.postal_code}</span></button>) : <div className="emptyInline"><p>No saved address found.</p><Link href="/addresses">Add delivery address</Link></div>}<Link className="textLink" href="/addresses">Manage addresses →</Link></div><div className="checkoutCard"><h2>2. Offers & coupon</h2><div className="coupon"><input value={coupon} onChange={e => { setCoupon(e.target.value.toUpperCase()); setCouponState('idle'); }} placeholder="Enter coupon code" aria-label="Coupon code"/><button type="button" onClick={validateCoupon} disabled={!coupon.trim() || couponState === 'checking'}>{couponState === 'checking' ? 'Checking…' : couponState === 'valid' ? 'Validated' : 'Apply'}</button></div>{couponState === 'valid' && <p className="formMessage">Coupon applied to the authoritative checkout quote.</p>}</div><div className="checkoutCard"><h2>3. Payment</h2><button type="button" className={`paymentChoice ${paymentMethod === 'razorpay' ? 'selected' : ''}`} onClick={() => setPaymentMethod('razorpay')}><b>Razorpay</b><span>UPI, cards, net banking & wallets</span></button><button type="button" className={`paymentChoice ${paymentMethod === 'cod' ? 'selected' : ''}`} onClick={() => setPaymentMethod('cod')}><b>Cash on Delivery</b><span>{quote?.delivery?.cod?.eligible === false ? 'Not available for this order' : 'Pay when your order arrives'}</span></button></div></section><aside className="summary"><span className="eyebrow">ORDER SUMMARY</span>{quote ? <><div><span>Subtotal</span><b>₹{Number(quote.subtotal || 0).toLocaleString('en-IN')}</b></div><div><span>Discount</span><b>- ₹{Number(quote.discount || 0).toLocaleString('en-IN')}</b></div><div><span>Shipping</span><b>₹{Number(quote.shipping_charge ?? quote.delivery?.shipping_charge ?? 0).toLocaleString('en-IN')}</b></div><hr /><div><strong>Total</strong><strong>₹{Number(quote.grand_total ?? quote.total ?? 0).toLocaleString('en-IN')}</strong></div></> : <p className="muted">Select an address to calculate the final total.</p>}<button className="button" disabled={busy || loading || !selected || !quote} onClick={placeOrder}>{busy ? 'Creating order…' : paymentMethod === 'cod' ? 'Place COD order' : 'Continue to payment'}</button></aside></div></main>;
}

export default function Checkout() { return <AuthGuard><CheckoutContent /></AuthGuard>; }
