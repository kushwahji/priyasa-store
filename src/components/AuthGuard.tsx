'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, getAccessToken } from '@/lib/api';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<'checking' | 'authenticated' | 'signed-out'>('checking');

  useEffect(() => {
    let active = true;
    if (!getAccessToken()) {
      setState('signed-out');
      return;
    }
    api('/auth/me')
      .then(() => active && setState('authenticated'))
      .catch(() => active && setState('signed-out'));
    return () => { active = false; };
  }, []);

  if (state === 'checking') return <main className="accountPage"><section className="authCard"><p className="muted">Checking your PRIYASA session…</p></section></main>;
  if (state === 'signed-out') return <main className="accountPage"><section className="emptyState"><span className="eyebrow">PRIYASA ACCOUNT</span><h1>Sign in to continue</h1><p>Sign in once to access your account, orders, wishlist and checkout.</p><Link className="button" href="/auth/login">Sign in with OTP</Link></section></main>;
  return <>{children}</>;
}
