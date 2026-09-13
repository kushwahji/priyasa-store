const UPSTREAM=(process.env.PRIYASA_API_BASE_URL||process.env.PRIYASA_API_URL||'').replace(/\/$/,'');
const BROWSER_BASE='/api/priyasa/proxy';

/** Browser auth is same-origin and HttpOnly; tokens are never exposed to JS. */
export function getAccessToken(){return null}
export function setAccessToken(_token:string){void _token}
export function clearAccessToken(){void 0}

function loginUrl(){
  if(typeof window==='undefined')return '/auth/login';
  const next=`${window.location.pathname}${window.location.search}${window.location.hash}`;
  return `/auth/login?next=${encodeURIComponent(next||'/')}`;
}

export async function api<T>(path:string,init:RequestInit={}){
  const headers=new Headers(init.headers);
  headers.set('Accept','application/json');
  if(init.body&&!headers.has('Content-Type'))headers.set('Content-Type','application/json');
  if(['POST','PUT','PATCH','DELETE'].includes((init.method||'GET').toUpperCase())&&!headers.has('Idempotency-Key')){
    headers.set('Idempotency-Key',typeof crypto?.randomUUID==='function'?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`);
  }
  const normalized=path.startsWith('/')?path.slice(1):path;
  const base=typeof window!=='undefined'?BROWSER_BASE:UPSTREAM;
  const url=typeof window!=='undefined'?`${base}?path=${encodeURIComponent(normalized)}`:`${base}/${normalized}`;
  try{
    const res=await fetch(url,{...init,headers,credentials:'include',cache:'no-store'});
    const body=await res.json().catch(()=>null);
    if(res.status===401&&typeof window!=='undefined'&&!window.location.pathname.startsWith('/auth/login')){
      window.location.replace(loginUrl());
      throw new Error('Your session has expired. Please sign in again.');
    }
    if(!res.ok)throw new Error(body?.message||body?.error||`PRIYASA_API_${res.status}`);
    return body as T;
  }catch(error){
    if(error instanceof Error&&error.message!=='Failed to fetch')throw error;
    throw new Error('Unable to reach PRIYASA Core. Check the Store deployment and PRIYASA_API_BASE_URL.');
  }
}
