'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Address = Record<string, any>;
type Quote = Record<string, any>;
function unwrap(r: any) { return r?.data ?? r ?? {}; }
function addressesOf(r: any): Address[] { const v = unwrap(r); return Array.isArray(v) ? v : v.items ?? v.addresses ?? v.data?.addresses ?? []; }
function money(v: any) { const n = Number(v ?? 0); return `₹${Number.isFinite(n) ? n.toLocaleString('en-IN') : '0'}`; }
function quoteOf(r: any): Quote { return unwrap(r)?.quote ?? unwrap(r); }

export default function Checkout() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selected, setSelected] = useState('');
  const [coupon, setCoupon] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [quoting, setQuoting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadAddresses = useCallback(async () => {
    const r = await api<any>('/storefront/checkout/addresses');
    const list = addressesOf(r);
    setAddresses(list);
    const preferred = list.find(a => a.is_default || a.default || a.default_address) || list[0];
    if (preferred) setSelected(String(preferred.id));
  }, []);

  const loadQuote = useCallback(async (addressId: string, code: string) => {
    if (!addressId) { setQuote(null); return; }
    setQuoting(true); setError('');
    try {
      const r = await api<any>('/storefront/checkout/quote', { method: 'POST', body: JSON.stringify({ shipping_address_id: addressId, coupon_code: code.trim().toUpperCase() || undefined }) });
      setQuote(quoteOf(r));
    } catch (e) { setQuote(null); setError(e instanceof Error ? e.message : 'Unable to calculate delivery and pricing.'); }
    finally { setQuoting(false); }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true); setError('');
      try { await loadAddresses(); }
      catch (e) { setError(e instanceof Error ? e.message : 'Unable to load checkout.'); }
      finally { setLoading(false); }
    })();
  }, [loadAddresses]);

  useEffect(() => { if (selected) void loadQuote(selected, coupon); }, [selected, coupon, loadQuote]);

  async function validateCoupon() {
    await loadQuote(selected, coupon);
    setMessage(coupon.trim() ? 'Coupon and delivery quote checked with PriyasaCore.' : 'Coupon removed.');
  }

  async function placeOrder() {
    if (!selected) { setError('Select a delivery address.'); return; }
    if (!quote) { setError('Calculate the checkout quote before placing the order.'); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      const r = await api<any>('/storefront/checkout/place', {
        method: 'POST',
        body: JSON.stringify({ shipping_address_id: selected, coupon_code: coupon.trim().toUpperCase() || undefined, payment_method: paymentMethod }),
      });
      const v = unwrap(r);
      const orderId = v.order?.id ?? v.id ?? v.order_id;
      if (!orderId) throw new Error('Checkout did not return an order id.');
      if (paymentMethod === 'cod') window.location.assign(`/orders/${encodeURIComponent(String(orderId))}`);
      else window.location.assign(`/checkout/payment?order=${encodeURIComponent(String(orderId))}`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to place your order.'); setBusy(false); }
  }

  const deliveryAvailable = quote?.delivery?.serviceable ?? quote?.serviceable ?? quote?.delivery_available;
  const codEligible = quote?.cod?.eligible ?? quote?.cod_eligible ?? quote?.payment?.cod_eligible;
  const shipping = quote?.shipping_total ?? quote?.shipping_charge ?? quote?.shipping?.amount;
  const total = quote?.grand_total ?? quote?.total;

  return <main className="checkoutPage">
    <div className="sectionHead"><div><span className="eyebrow">PRIYASA / CHECKOUT</span><h1>Secure checkout</h1><p className="muted">Address → delivery → payment → confirmation</p></div><Link className="textLink" href="/cart">← Bag</Link></div>
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
          <Link className="textLink" href="/addresses">+ Manage addresses</Link>
        </div>
        <div className="checkoutCard"><span className="eyebrow">STEP 2</span><h2>Delivery & price</h2>
          {quoting ? <p className="muted">Checking serviceability and calculating your final price…</p> : quote ? <div className="quoteBox"><p><b>{deliveryAvailable === false ? 'Delivery unavailable' : 'Delivery available'}</b></p>{quote.delivery_promise && <p>{quote.delivery_promise}</p>}{quote.delivery?.promise && <p>{quote.delivery.promise}</p>}{shipping != null && <p>Delivery: {money(shipping)}</p>}{total != null && <p><strong>Total: {money(total)}</strong></p>}</div> : <p className="muted">Select an address to calculate delivery.</p>}
        </div>
        <div className="checkoutCard"><span className="eyebrow">STEP 3</span><h2>Offers & coupon</h2><div className="coupon"><input aria-label="Coupon code" value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())} placeholder="Enter coupon code"/><button type="button" onClick={() => void validateCoupon()} disabled={quoting}>Apply</button></div></div>
        <div className="checkoutCard"><span className="eyebrow">STEP 4</span><h2>Payment method</h2>
          <div className="paymentOptions">
            <button type="button" className={`paymentChoice ${paymentMethod === 'razorpay' ? 'selected' : ''}`} onClick={() => setPaymentMethod('razorpay')}><b>Razorpay</b><span>UPI, cards, net banking and wallets</span></button>
            <button type="button" disabled={codEligible === false} className={`paymentChoice ${paymentMethod === 'cod' ? 'selected' : ''}`} onClick={() => setPaymentMethod('cod')}><b>Cash on Delivery</b><span>{codEligible === false ? 'COD is not available for this checkout.' : 'Availability is validated by PriyasaCore.'}</span></button>
          </div>
          <p className="muted">Payment is verified server-side by PriyasaCore. The browser never marks an order as paid.</p>
        </div>
      </section>
      <aside className="summary"><span className="eyebrow">ORDER SUMMARY</span>{quote && <><p>Subtotal: {money(quote.subtotal)}</p><p>Discount: −{money(quote.discount_total ?? quote.discount)}</p><p>Shipping: {money(shipping)}</p>{quote.tax_total != null && <p>Tax: {money(quote.tax_total)}</p>}<hr/><h2>{money(total)}</h2></>}<button className="button" disabled={busy || quoting || !selected || !quote || deliveryAvailable === false || (paymentMethod === 'cod' && codEligible === false)} onClick={() => void placeOrder()}>{busy ? (paymentMethod === 'cod' ? 'Placing order…' : 'Creating secure order…') : (paymentMethod === 'cod' ? 'Place COD order' : 'Continue to payment')}</button></aside>
    </div>}
  </main>;
}
