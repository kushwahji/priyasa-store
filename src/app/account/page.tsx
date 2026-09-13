'use client';

import Link from 'next/link';
import { useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import { api } from '@/lib/api';

function AccountContent() {
  const [busy, setBusy] = useState(false);
  async function signOut() { setBusy(true); try { await api('/storefront/session/logout', { method: 'POST', body: JSON.stringify({}) }); } catch { /* The BFF clears the HttpOnly session on a successful logout or 401. */ } finally { window.location.href = '/'; } }
  return <main className="accountPage"><span className="eyebrow">MY PRIYASA</span><h1>My account</h1><p className="muted">Manage your orders, saved styles, addresses and support from one place.</p><div className="accountGrid"><Link href="/orders"><strong>My orders</strong><small>Track, cancel, reorder and return orders</small></Link><Link href="/wishlist"><strong>Wishlist</strong><small>Saved styles and favourites</small></Link><Link href="/addresses"><strong>Addresses</strong><small>Manage delivery addresses</small></Link><Link href="/returns"><strong>Returns & refunds</strong><small>Track return requests and refunds</small></Link><Link href="/support"><strong>Help & support</strong><small>Get help with your purchase</small></Link><Link href="/account/notifications"><strong>Notifications</strong><small>Offers, order updates and preferences</small></Link><Link href="/account/loyalty"><strong>Wallet & loyalty</strong><small>Rewards, wallet and referral benefits</small></Link></div><button className="textButton" disabled={busy} onClick={signOut}>{busy ? 'Signing out…' : 'Sign out'}</button></main>;
}

export default function Account() { return <AuthGuard><AccountContent /></AuthGuard>; }
