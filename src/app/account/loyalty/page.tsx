'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import { api } from '@/lib/api';

function LoyaltyContent() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  useEffect(() => { api<any>('/storefront/account/growth').then(r => setData(r.data || r)).catch(e => setError(e instanceof Error ? e.message : 'Unable to load loyalty details')); }, []);
  return <main className="accountPage"><div className="sectionHead"><div><span className="eyebrow">MY PRIYASA / REWARDS</span><h1>Wallet & loyalty</h1><p className="muted">Rewards, wallet balance and referral benefits.</p></div><Link className="textLink" href="/account">← Account</Link></div>{error && <div className="formError" role="alert">{error}</div>}{data ? <div className="accountGrid"><section className="checkoutCard"><span className="eyebrow">WALLET</span><h2>₹{Number(data.wallet?.balance ?? data.wallet?.amount ?? 0).toLocaleString('en-IN')}</h2><p className="muted">Available wallet balance</p></section><section className="checkoutCard"><span className="eyebrow">LOYALTY</span><h2>{data.loyalty?.points ?? data.points ?? 0} points</h2><p className="muted">{data.loyalty?.tier || data.tier || 'PRIYASA member'}</p></section><section className="checkoutCard"><span className="eyebrow">REFERRAL</span><h2>{data.referral_code || data.referral?.code || '—'}</h2><p className="muted">Share your referral code when available.</p></section></div> : <p className="muted">Loading rewards…</p>}</main>;
}

export default function LoyaltyPage() { return <AuthGuard><LoyaltyContent /></AuthGuard>; }
