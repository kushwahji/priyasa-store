'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import AuthGuard from '@/components/AuthGuard';

type ReturnState = 'checking' | 'paid' | 'pending' | 'failed' | 'unknown' | 'missing';

function PaymentReturnInner() {
  const q = useSearchParams();
  const order = q.get('order');
  const [status, setStatus] = useState<ReturnState>('checking');
  const [attempts, setAttempts] = useState(0);

  const check = useCallback(async () => {
    if (!order) { setStatus('missing'); return true; }
    try {
      const r = await api<any>(`/storefront/orders/${encodeURIComponent(order)}/payment`);
      const data = r.data || r;
      const raw = String(data.payment?.status || data.payment_status || data.status || 'pending').toLowerCase();
      if (['paid', 'captured', 'confirmed', 'completed', 'success'].includes(raw)) { setStatus('paid'); return true; }
      if (['failed', 'cancelled', 'canceled', 'refunded', 'rejected'].includes(raw)) { setStatus('failed'); return true; }
      setStatus('pending'); return false;
    } catch {
      setStatus('unknown'); return false;
    }
  }, [order]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let count = 0;
    const poll = async () => {
      if (cancelled) return;
      count += 1; setAttempts(count);
      const terminal = await check();
      if (!cancelled && !terminal && count < 6) timer = setTimeout(poll, 2500);
    };
    void poll();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [check]);

  const title = status === 'paid' ? 'Order confirmed' : status === 'failed' ? 'Payment needs attention' : status === 'missing' ? 'Missing order reference' : 'Confirming your order';
  const text = status === 'paid' ? 'Your payment has been confirmed by PriyasaCore.' : status === 'failed' ? 'The payment was not confirmed. Check the order status before attempting another payment.' : status === 'unknown' ? 'We could not reach the payment-status service. Your order has not been marked paid by this page.' : status === 'missing' ? 'Open this page from the payment flow or your order history.' : `We are checking the authoritative payment status${attempts > 1 ? ` (check ${attempts} of 6)` : ''}. Do not retry payment while this check is running.`;

  return <main className="checkoutPage"><section className="emptyState"><span className="eyebrow">PRIYASA / ORDER</span><h1>{title}</h1><p>{text}</p><div className="heroActions">{order && <Link className="button" href={`/orders/${encodeURIComponent(order)}`}>View order</Link>}{(status === 'unknown' || status === 'failed') && order && <button className="button secondary" onClick={() => { setStatus('checking'); setAttempts(0); void check(); }}>Check again</button>}<Link className="button secondary" href="/shop">Continue shopping</Link></div><p className="muted">Payment confirmation is accepted only after PriyasaCore verifies the Razorpay response.</p></section></main>;
}

export default function PaymentReturnContent() { return <AuthGuard><PaymentReturnInner /></AuthGuard>; }
