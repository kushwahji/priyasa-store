'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [ready,setReady]=useState(false);
  const [authenticated,setAuthenticated]=useState(false);
  useEffect(()=>{
    let active=true;
    fetch('/api/session',{credentials:'include',cache:'no-store'})
      .then(async r=>({ok:r.ok,data:await r.json().catch(()=>({authenticated:false}))}))
      .then(({ok,data})=>{if(active){setAuthenticated(ok&&Boolean(data.authenticated));setReady(true)}})
      .catch(()=>{if(active){setAuthenticated(false);setReady(true)}});
    return()=>{active=false};
  },[]);
  if(!ready)return <main className="accountPage"><section className="authCard"><p className="muted">Checking your PRIYASA session…</p></section></main>;
  if(!authenticated){
    const next=typeof window!=='undefined'?`${window.location.pathname}${window.location.search}`:'/account';
    return <main className="accountPage"><section className="emptyState"><span className="eyebrow">PRIYASA ACCOUNT</span><h1>Sign in to continue</h1><p>Your secure session is required for account, wishlist, bag and checkout.</p><Link className="button" href={`/auth/login?next=${encodeURIComponent(next)}`}>Sign in with OTP</Link></section></main>;
  }
  return <>{children}</>;
}
