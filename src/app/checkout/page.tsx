'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import { api } from '@/lib/api';

type Address = { id: string | number; name?: string; recipient_name?: string; address_line1?: string; line1?: string; line2?: string; address_line2?: string; city: string; state: string; pincode?: string; postal_code?: string; is_default?: boolean };
type Cart = { subtotal?: number; discount?: number; total?: number; items?: Array<{ id: string | number; quantity: number; line_total?: number; unit_price?: number; price?: number }> };

function CheckoutContent() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [selected, setSelected] = useState('');
  const [coupon, setCoupon] = useState('');
  const [couponState, setCouponState] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const [addressResponse, cartResponse] = await Promise.all([
        api<{ data?: Address[] }>('/storefront/addresses'),
        api<{ data?: Cart }>('/storefront/cart'),
      ]);
      const list = addressResponse.data || [];
      setAddresses(list);
      const d = list.find(x => x.is_default) || list[0];
      setSelected(String(d?.id || ''));
      setCart(cartResponse.data || null);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load checkout'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function validateCoupon() {
    const code = coupon.trim();
    if (!code) { setCouponState('idle'); return true; }
    setCouponState('checking'); setError('');
    try {
      await api('/storefront/checkout/validate', { method: 'POST', body: JSON.stringify({ coupon_code: code }) });
      setCouponState('valid');
      return true;
    } catch (e) {
      setCouponState('invalid');
      setError(e instanceof Error ? e.message : 'Coupon could not be validated');
      return false;
    }
  }

  async function placeOrder() {
    if (!selected) { setError('Select a delivery address.'); return; }
    setBusy(true); setError('');
    try {
      if (coupon.trim() && couponState !== 'valid' && !(await validateCoupon())) return;
      const r = await api<any>('/storefront/checkout/create-order', { method: 'POST', body: JSON.stringify({ shipping_address_id: selected, coupon_code: coupon.trim() || undefined, payment_method: paymentMethod }) });
      const orderId = r.data?.id || r.data?.order_id || r.order_id;
      if (!orderId) throw new Error('Checkout did not return an order id.');
      if (paymentMethod === 'cod') window.location.href = `/orders/${encodeURIComponent(String(orderId))}`;
      else window.location.href = `/checkout/payment?order=${encodeURIComponent(String(orderId))}`;
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to create order'); }
    finally { setBusy(false); }
  }

  const subtotal = Number(cart?.subtotal || cart?.total || 0);
  const discount = Number(cart?.discount || 0);
  const total = Number(cart?.total || subtotal);
  return <main className="checkoutPage"><div className="sectionHead"><div><span className="eyebrow">PRIYASA / CHECKOUT</span><h1>Secure checkout</h1></div><Link className="textLink" href="/cart">← Bag</Link></div>{error && <div className="formError" role="alert">{error}</div>}<div className="checkoutGrid"><section><div className="checkoutCard"><h2>1. Delivery address</h2>{loading ? <p className="muted">Loading saved addresses…</p> : addresses.length ? addresses.map(a => <button type="button" key={a.id} className={`addressChoice ${selected === String(a.id) ? 'selected' : ''}`} onClick={() => setSelected(String(a.id))}><b>{a.recipient_name || a.name || 'Delivery address'}{a.is_default ? ' · Default' : ''}</b><span>{a.address_line1 || a.line1 || ''}{a.address_line2 || a.line2 ? `, ${a.address_line2 || a.line2}` : ''}, {a.city}, {a.state} {a.pincode || a.postal_code}</span></button>) : <div className="emptyInline"><p>No saved address found.</p><Link href="/addresses">Add delivery address</Link></div>}<Link className="textLink" href="/addresses">Manage addresses →</Link></div><div className="checkoutCard"><h2>2. Offers & coupon</h2><div className="coupon"><input value={coupon} onChange={e => { setCoupon(e.target.value.toUpperCase()); setCouponState('idle'); }} placeholder="Enter coupon code" aria-label="Coupon code"/><button type="button" onClick={validateCoupon} disabled={!coupon.trim() || couponState === 'checking'}>{couponState === 'checking' ? 'Checking…' : couponState === 'valid' ? 'Validated' : 'Apply'}</button></div>{couponState === 'valid' && <p className="formMessage">Coupon validated by PriyasaCore.</p>}</div><div className="checkoutCard"><h2>3. Payment</h2><button type="button" className={`paymentChoice ${paymentMethod === 'razorpay' ? 'selected' : ''}`} onClick={() => setPaymentMethod('razorpay')}><b>Razorpay</b><span>UPI, cards, net banking & wallets</span></button><button type="button" className={`paymentChoice ${paymentMethod === 'cod' ? 'selected' : ''}`} onClick={() => setPaymentMethod('cod')}><b>Cash on Delivery</b><span>Pay when your order arrives</span></button></div></section><aside className="summary"><span className="eyebrow">ORDER SUMMARY</span><div><span>Subtotal</span><b>₹{subtotal.toLocaleString('en-IN')}</b></div><div><span>Discount</span><b>- ₹{discount.toLocaleString('en-IN')}</b></div><hr /><div><strong>Total</strong><strong>₹{total.toLocaleString('en-IN')}</strong></div><button className="button" disabled={busy || loading || !selected || !cart?.items?.length}>{busy ? 'Creating order…' : paymentMethod === 'cod' ? 'Place COD order' : 'Continue to payment'}</button></aside></div></main>;
}

export default function Checkout() { return <AuthGuard><CheckoutContent /></AuthGuard>; }
