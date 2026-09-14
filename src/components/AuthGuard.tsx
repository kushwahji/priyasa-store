'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<'checking' | 'authenticated' | 'guest'>('checking');

  useEffect(() => {
    let active = true;

    fetch('/api/session', { credentials: 'include', cache: 'no-store' })
      .then(async (response) => ({
        ok: response.ok,
        body: await response.json().catch(() => null),
      }))
      .then(({ ok, body }) => {
        if (!active) return;
        setState(ok && body?.authenticated ? 'authenticated' : 'guest');
      })
      .catch(() => {
        if (active) setState('guest');
      });

    return () => {
      active = false;
    };
  }, []);

  if (state === 'checking') {
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
          <Link className="button" href="/auth/login">Sign in with OTP</Link>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
