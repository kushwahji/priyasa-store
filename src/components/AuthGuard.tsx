'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

type SessionState = 'checking' | 'authenticated' | 'unauthenticated' | 'unavailable';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>('checking');

  const checkSession = useCallback(async () => {
    setState('checking');
    try {
      const response = await fetch('/api/session', { credentials: 'include', cache: 'no-store', headers: { Accept: 'application/json' } });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.authenticated === true) setState('authenticated');
      else if (response.status === 401 || (response.ok && data.authenticated === false)) setState('unauthenticated');
      else setState('unavailable');
    } catch {
      setState('unavailable');
    }
  }, []);

  useEffect(() => { void checkSession(); }, [checkSession]);

  if (state === 'checking') return <main className="accountPage"><section className="authCard"><p className="muted">Checking your PRIYASA session…</p></section></main>;

  if (state === 'unavailable') return <main className="accountPage"><section className="emptyState"><span className="eyebrow">PRIYASA ACCOUNT</span><h1>Session check unavailable</h1><p>We could not verify your secure session right now. Your login has not been discarded.</p><button className="button" type="button" onClick={() => void checkSession()}>Try again</button></section></main>;

  if (state === 'unauthenticated') {
    const next = typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/account';
    return <main className="accountPage"><section className="emptyState"><span className="eyebrow">PRIYASA ACCOUNT</span><h1>Sign in to continue</h1><p>Your secure session is required for account, wishlist, bag and checkout.</p><Link className="button" href={`/auth/login?next=${encodeURIComponent(next)}`}>Sign in with OTP</Link></section></main>;
  }

  return <>{children}</>;
}
