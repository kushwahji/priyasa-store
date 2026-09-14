'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, clearAccessToken } from '@/lib/api';

type SessionState = 'loading' | 'authenticated' | 'guest' | 'unavailable';

export default function Account() {
  const [state, setState] = useState<SessionState>('loading');
  const checkSession = async () => {
    setState('loading');
    try {
      const response = await fetch('/api/session', { credentials: 'include', cache: 'no-store', headers: { Accept: 'application/json' } });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.authenticated === true) return setState('authenticated');
      if (response.status === 401 || (response.ok && data.authenticated === false)) return setState('guest');
      setState('unavailable');
    } catch { setState('unavailable'); }
  };
  useEffect(() => { void checkSession(); }, []);

  const signOut = async () => {
    try { await api('/storefront/session/logout', { method: 'POST' }); }
    catch { /* BFF clears the session when Core returns 401. */ }
    finally { clearAccessToken(); window.location.assign('/'); }
  };

  if (state === 'loading') return <main className="accountPage"><section className="authCard"><p className="muted">Checking your PRIYASA session…</p></section></main>;
  if (state === 'unavailable') return <main className="accountPage"><section className="emptyState"><span className="eyebrow">MY PRIYASA</span><h1>Session check unavailable</h1><p>We could not verify your secure session right now. Your login has not been discarded.</p><button className="button" type="button" onClick={() => void checkSession()}>Try again</button></section></main>;
  if (state === 'guest') return <main className="accountPage"><section className="emptyState"><span className="eyebrow">MY PRIYASA</span><h1>Sign in to continue</h1><p>Access your orders, wishlist, addresses and support.</p><Link className="button" href={`/auth/login?next=${encodeURIComponent('/account')}`}>Sign in with OTP</Link></section></main>;

  return <main className="accountPage"><span className="eyebrow">MY PRIYASA</span><h1>My account</h1><div className="accountGrid">
    <Link href="/orders"><strong>My orders</strong><small>Track, cancel and return orders</small></Link>
    <Link href="/wishlist"><strong>Wishlist</strong><small>Saved styles and favourites</small></Link>
    <Link href="/addresses"><strong>Addresses</strong><small>Manage delivery addresses</small></Link>
    <Link href="/support"><strong>Help & support</strong><small>Get help with your purchase</small></Link>
  </div><button className="textButton" type="button" onClick={() => void signOut()}>Sign out</button></main>;
}
