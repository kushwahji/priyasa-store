const UPSTREAM=(process.env.PRIYASA_API_BASE_URL||process.env.PRIYASA_API_URL||'').replace(/\/$/,'');
const BROWSER_BASE='/api/priyasa';

/**
 * Browser authentication is handled by the same-origin BFF using an HttpOnly
 * session cookie. These helpers remain only for compatibility with older code.
 */
export function getAccessToken(){return null}
export function setAccessToken(_token:string){void _token}
export function clearAccessToken(){void 0}

export async function api<T>(path:string,init:RequestInit={}){
  const headers=new Headers(init.headers);
  headers.set('Accept','application/json');
  if(init.body&&!headers.has('Content-Type'))headers.set('Content-Type','application/json');
  if(['POST','PUT','PATCH','DELETE'].includes((init.method||'GET').toUpperCase())&&!headers.has('Idempotency-Key'))headers.set('Idempotency-Key',crypto.randomUUID());

  const normalized=path.startsWith('/')?path:`/${path}`;
  const base=typeof window!=='undefined'?BROWSER_BASE:UPSTREAM;
  const res=await fetch(`${base}${normalized}`,{...init,headers,credentials:'include',cache:'no-store'});
  const body=await res.json().catch(()=>null);
  if(!res.ok)throw new Error(body?.message||`PRIYASA_API_${res.status}`);
  return body as T;
}
