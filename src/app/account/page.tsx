'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import { api, clearAccessToken } from '@/lib/api';

type Me = { user?: { name?: string; mobile?: string; phone?: string; email?: string }; customer?: { id?: number } };

function AccountContent() {
  const [me, setMe] = useState<Me | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { api<{ data?: Me }>('/storefront/account/me').then(r => setMe(r.data || null)).catch(() => undefined); }, []);

  async function signOut() {
    setBusy(true);
    try { await api('/storefront/session/logout', { method: 'POST', body: JSON.stringify({}) }); }
    catch { /* The BFF also clears the session on a successful/401 response. */ }
    finally { clearAccessToken(); window.location.href = '/'; }
  }

  const name = me?.user?.name || 'PRIYASA customer';
  const contact = me?.user?.mobile || me?.user?.phone || me?.user?.email || '';
  return <main className="accountPage"><span className="eyebrow">MY PRIYASA</span><h1>{name}</h1>{contact && <p className="muted">{contact}</p>}<div className="accountGrid"><Link href="/orders"><strong>My orders</strong><small>Track, cancel, reorder and return orders</small></Link><Link href="/wishlist"><strong>Wishlist</strong><small>Saved styles and favourites</small></Link><Link href="/addresses"><strong>Addresses</strong><small>Manage delivery addresses</small></Link><Link href="/support"><strong>Help & support</strong><small>Get help with your purchase</small></Link><Link href="/account/notifications"><strong>Notifications</strong><small>Offers, order updates and preferences</small></Link><Link href="/account/loyalty"><strong>Wallet & loyalty</strong><small>Rewards, wallet and referral benefits</small></Link></div><button className="textButton" disabled={busy} onClick={signOut}>{busy ? 'Signing out…' : 'Sign out'}</button></main>;
}

export default function Account() { return <AuthGuard><AccountContent /></AuthGuard>; }
