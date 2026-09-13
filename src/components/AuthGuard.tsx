'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getAccessToken } from '@/lib/api';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [ready,setReady]=useState(false);
  useEffect(()=>{setReady(true)},[]);
  if(!ready)return <main className="accountPage"><section className="authCard"><p className="muted">Checking your PRIYASA session…</p></section></main>;
  if(!getAccessToken())return <main className="accountPage"><section className="emptyState"><span className="eyebrow">PRIYASA ACCOUNT</span><h1>Sign in to continue</h1><p>Sign in once to access your account, orders, wishlist and checkout.</p><Link className="button" href="/auth/login">Sign in with OTP</Link></section></main>;
  return <>{children}</>;
}
