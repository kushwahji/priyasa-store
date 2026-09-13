'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getAccessToken } from '@/lib/api';

function hasSessionCookie(){
  if(typeof document==='undefined')return false;
  return document.cookie.split(';').some((part)=>part.trim().startsWith('priyasa_session='));
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [ready,setReady]=useState(false);
  const [authenticated,setAuthenticated]=useState(false);
  useEffect(()=>{
    setAuthenticated(hasSessionCookie() || Boolean(getAccessToken()));
    setReady(true);
  },[]);
  if(!ready)return <main className="accountPage"><section className="authCard"><p className="muted">Checking your PRIYASA session…</p></section></main>;
  if(!authenticated)return <main className="accountPage"><section className="emptyState"><span className="eyebrow">PRIYASA ACCOUNT</span><h1>Sign in to continue</h1><p>Sign in once to access your account, orders, wishlist and checkout.</p><Link className="button" href="/auth/login">Sign in with OTP</Link></section></main>;
  return <>{children}</>;
}
