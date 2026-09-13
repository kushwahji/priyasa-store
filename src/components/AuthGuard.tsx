'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * Uses a same-origin session hint because the access token is HttpOnly.
 * PriyasaCore remains authoritative; any protected API 401 is handled by the
 * API client and redirects the customer back to login.
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<'loading' | 'authenticated' | 'guest'>('loading');

  useEffect(() => {
    let active = true;
    fetch('/api/session', { credentials: 'include', cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error('session check failed');
        return response.json() as Promise<{ authenticated?: boolean }>;
      })
      .then(data => {
        if (active) setState(data.authenticated ? 'authenticated' : 'guest');
      })
      .catch(() => {
        if (active) setState('guest');
      });
    return () => { active = false; };
  }, []);

  if (state === 'loading') {
    return (
      <main className="accountPage">
        <section className="authCard">
          <p className="muted">Checking your PRIYASA session…</p>
        </section>
      </main>
    );
  }

  if (state === 'guest') {
    return (
      <main className="accountPage">
        <section className="emptyState">
          <span className="eyebrow">PRIYASA ACCOUNT</span>
          <h1>Sign in to continue</h1>
          <p>Sign in once to access your account, orders, wishlist and checkout.</p>
          <Link className="button" href={`/auth/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`}>
            Sign in with OTP
          </Link>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
