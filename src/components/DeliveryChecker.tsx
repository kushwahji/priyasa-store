'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export default function DeliveryChecker() {
  const [pincode, setPincode] = useState('');
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('');
  const [ok, setOk] = useState<boolean | null>(null);
  async function check(e: React.FormEvent) { e.preventDefault(); const value = pincode.trim(); if (!/^[0-9A-Za-z -]{3,16}$/.test(value)) { setOk(false); setMessage('Enter a valid delivery PIN code.'); return; } setChecking(true); setMessage(''); setOk(null); try { const r = await api<any>(`/storefront/shipping/serviceability?pincode=${encodeURIComponent(value)}&payment_method=razorpay`); const data = r.data || r; const serviceable = data.serviceable ?? data.is_serviceable ?? data.available ?? data.success; setOk(Boolean(serviceable)); setMessage(serviceable ? (data.message || 'Delivery is available to this PIN code.') : (data.message || 'Delivery is not currently available to this PIN code.')); } catch (e) { setOk(false); setMessage(e instanceof Error ? e.message : 'Unable to check delivery right now.'); } finally { setChecking(false); } }
  return <div className="deliveryChecker"><strong>Check delivery</strong><form onSubmit={check}><input value={pincode} onChange={e => setPincode(e.target.value)} inputMode="numeric" autoComplete="postal-code" maxLength={16} placeholder="Enter PIN code" aria-label="Delivery PIN code"/><button className="button secondary" disabled={checking}>{checking ? 'Checking…' : 'Check'}</button></form>{message && <p className={ok === false ? 'formError' : 'formMessage'} role="status">{message}</p>}</div>;
}
