'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [ready,setReady]=useState(false);
  const [authenticated,setAuthenticated]=useState(false);
  useEffect(()=>{
    let active=true;
    fetch('/api/session',{credentials:'include',cache:'no-store'})
      .then((r)=>r.ok?r.json():{authenticated:false})
      .then((data)=>{if(active){setAuthenticated(Boolean(data.authenticated));setReady(true)}})
      .catch(()=>{if(active){setAuthenticated(false);setReady(true)}});
    return()=>{active=false};
  },[]);
  if(!ready)return <main className="accountPage"><section className="authCard"><p className="muted">Checking your PRIYASA session…</p></section></main>;
  if(!authenticated)return <main className="accountPage"><section className="emptyState"><span className="eyebrow">PRIYASA ACCOUNT</span><h1>Sign in to continue</h1><p>Sign in once to access your account, orders, wishlist and checkout.</p><Link className="button" href="/auth/login">Sign in with OTP</Link></section></main>;
  return <>{children}</>;
}
