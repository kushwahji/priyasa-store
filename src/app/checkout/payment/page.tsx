'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type RazorpayResponse = { razorpay_payment_id?: string; razorpay_order_id?: string; razorpay_signature?: string };
type WindowWithRazorpay = Window & { Razorpay?: new (options: Record<string, any>) => { open: () => void } };
function unwrap(r: any) { return r?.data ?? r ?? {}; }
function statusValues(v: any): string[] {
  const values = [v?.payment_status, v?.status, v?.payment?.status, v?.payment?.payment_status, ...(Array.isArray(v?.paymentTransactions) ? v.paymentTransactions.map((x: any) => x?.status) : [])];
  return values.map(x => String(x ?? '').toLowerCase().trim()).filter(Boolean);
}
function isSettled(v: any): boolean {
  return statusValues(v).some(s => ['paid', 'captured', 'success', 'successful', 'completed'].includes(s));
}
function isFailed(v: any): boolean {
  return statusValues(v).some(s => ['failed', 'cancelled', 'refunded'].includes(s));
}
function loadScript(src: string) { return new Promise<boolean>((resolve) => { if (document.querySelector(`script[src="${src}"]`)) return resolve(true); const s = document.createElement('script'); s.src = src; s.async = true; s.onload = () => resolve(true); s.onerror = () => resolve(false); document.body.appendChild(s); }); }

export default function PaymentPage() {
  const [orderId, setOrderId] = useState('');
  const [payment, setPayment] = useState<any>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('Checking payment status…');

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('order') || '';
    setOrderId(id);
    if (!id) { setError('Missing order id.'); setBusy(false); return; }

    (async () => {
      try {
        // Always ask Core for the authoritative order/payment state first. This prevents
        // reopening Razorpay for an order that was already captured by a previous attempt.
        const statusResponse = await api<any>(`/storefront/orders/${encodeURIComponent(id)}/payment`);
        const current = unwrap(statusResponse);
        if (isSettled(current)) { window.location.assign(`/orders/${encodeURIComponent(id)}`); return; }
        if (isFailed(current) && statusValues(current).includes('refunded')) { throw new Error('This payment has already been refunded.'); }

        setMessage('Preparing secure payment…');
        const r = await api<any>(`/storefront/orders/${encodeURIComponent(id)}/payment`, { method: 'POST', body: JSON.stringify({}) });
        const v = unwrap(r); const p = v.payment ?? v;
        setPayment(p);
        if (isSettled(v) || isSettled(p)) { window.location.assign(`/orders/${encodeURIComponent(id)}`); return; }

        const shortUrl = p.short_url ?? p.checkout_url ?? p.payment_url;
        if (shortUrl) { window.location.assign(shortUrl); return; }
        const razorpayOrderId = p.razorpay_order_id ?? p.provider_order_id ?? p.order_id;
        const amount = Number(p.amount ?? p.amount_minor ?? 0);
        const key = p.key_id ?? p.razorpay_key_id ?? p.key;
        if (!razorpayOrderId || !amount || !key) throw new Error('Payment service did not return a usable Razorpay checkout payload.');
        if (!await loadScript('https://checkout.razorpay.com/v1/checkout.js')) throw new Error('Secure payment checkout could not be loaded.');
        if (!(window as WindowWithRazorpay).Razorpay) throw new Error('Secure payment checkout is unavailable.');

        const rzp = new (window as WindowWithRazorpay).Razorpay!({
          key, amount, currency: p.currency ?? 'INR', name: 'PRIYASA', description: `PRIYASA order #${id}`, order_id: razorpayOrderId,
          prefill: p.prefill ?? {}, theme: { color: '#e91e63' },
          handler: async (response: RazorpayResponse) => {
            if (!response.razorpay_payment_id || !response.razorpay_order_id || !response.razorpay_signature) { setError('Razorpay returned an incomplete payment response.'); setBusy(false); return; }
            try {
              setBusy(true); setMessage('Verifying your payment…'); setError('');
              await api(`/storefront/orders/${encodeURIComponent(id)}/payment/capture`, { method: 'POST', body: JSON.stringify({ provider_payment_id: response.razorpay_payment_id, provider_order_id: response.razorpay_order_id, signature: response.razorpay_signature, payload: response }) });

              // Capture is not treated as success by the browser. Confirm the persisted
              // state from Core before navigating to the order page.
              const confirmed = unwrap(await api<any>(`/storefront/orders/${encodeURIComponent(id)}/payment`));
              if (!isSettled(confirmed)) throw new Error('Payment was submitted but PriyasaCore has not confirmed it yet. Please check the order status before trying again.');
              window.location.assign(`/orders/${encodeURIComponent(id)}`);
            } catch (e) { setError(e instanceof Error ? e.message : 'Payment verification failed.'); setBusy(false); }
          },
          modal: { ondismiss: () => { setMessage('Payment window closed. Your order remains unpaid.'); setBusy(false); } },
        });
        setBusy(false); setMessage('Secure payment is ready.'); rzp.open();
      } catch (e) { setError(e instanceof Error ? e.message : 'Unable to start payment.'); setBusy(false); }
    })();
  }, []);

  return <main className="checkoutPage"><div className="sectionHead"><div><span className="eyebrow">PRIYASA / PAYMENT</span><h1>Secure payment</h1><p className="muted">Order {orderId ? `#${orderId}` : ''}</p></div><Link className="textLink" href={`/orders/${encodeURIComponent(orderId)}`}>← Order</Link></div>{error ? <section className="emptyState"><h2>Payment could not be completed</h2><p>{error}</p><Link className="button" href={`/orders/${encodeURIComponent(orderId)}`}>View order</Link></section> : <section className="checkoutCard paymentPageCard"><div className="paymentSecure">🔒</div><span className="eyebrow">RAZORPAY</span><h2>{message}</h2><p className="muted">Payment is confirmed only after PriyasaCore verifies the Razorpay response.</p>{payment && <div className="paymentMeta"><span>Order</span><b>#{orderId}</b></div>}{busy && <div className="skeleton" />}</section>}</main>;
}
