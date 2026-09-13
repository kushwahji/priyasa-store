'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import NotificationEnrollment from '@/components/NotificationEnrollment';

type SessionState = 'loading' | 'authenticated' | 'guest' | 'unavailable';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>('loading');

  const check = async () => {
    setState('loading');
    try {
      const response = await fetch('/api/session', { credentials: 'include', cache: 'no-store', headers: { Accept: 'application/json' } });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.authenticated === true) setState('authenticated');
      else if (response.status === 401 || (response.ok && data.authenticated === false)) setState('guest');
      else setState('unavailable');
    } catch { setState('unavailable'); }
  };

  useEffect(() => { void check(); }, []);

  if (state === 'loading') return <main className="accountPage"><section className="authCard"><p className="muted">Checking your PRIYASA session…</p></section></main>;
  if (state === 'unavailable') return <main className="accountPage"><section className="emptyState"><span className="eyebrow">PRIYASA ACCOUNT</span><h1>Session check unavailable</h1><p>We could not verify your secure session right now. Your login has not been discarded.</p><button className="button" type="button" onClick={() => void check()}>Try again</button></section></main>;
  if (state === 'guest') return <main className="accountPage"><section className="emptyState"><span className="eyebrow">PRIYASA ACCOUNT</span><h1>Sign in to continue</h1><p>Sign in once to access your account, orders, wishlist and checkout.</p><Link className="button" href={`/auth/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`}>Sign in with OTP</Link></section></main>;

  return <><NotificationEnrollment />{children}</>;
}
