const UPSTREAM=(process.env.PRIYASA_API_BASE_URL||process.env.PRIYASA_API_URL||'').replace(/\/$/,'');
const BROWSER_BASE='/api/priyasa';

/**
 * Legacy token helpers are retained only for compatibility with older builds.
 * New browser sessions are stored in the BFF's HttpOnly cookie and are never
 * persisted to localStorage.
 */
export function getAccessToken(){return typeof window!=='undefined'?localStorage.getItem('priyasa_access_token'):null}
export function setAccessToken(_token:string){if(typeof window!=='undefined')localStorage.removeItem('priyasa_access_token')}
export function clearAccessToken(){if(typeof window!=='undefined')localStorage.removeItem('priyasa_access_token')}

export async function api<T>(path:string,init:RequestInit={}){
  const headers=new Headers(init.headers);
  headers.set('Accept','application/json');
  if(init.body&&!headers.has('Content-Type'))headers.set('Content-Type','application/json');
  const token=getAccessToken();
  if(token)headers.set('Authorization',`Bearer ${token}`);
  if(['POST','PUT','PATCH','DELETE'].includes((init.method||'GET').toUpperCase())&&!headers.has('Idempotency-Key'))headers.set('Idempotency-Key',crypto.randomUUID());

  const normalized=path.startsWith('/')?path:`/${path}`;
  const base=typeof window!=='undefined'?BROWSER_BASE:UPSTREAM;
  const res=await fetch(`${base}${normalized}`,{...init,headers,credentials:'include',cache:'no-store'});
  if(res.status===401)clearAccessToken();
  const body=await res.json().catch(()=>null);
  if(!res.ok)throw new Error(body?.message||`PRIYASA_API_${res.status}`);
  return body as T;
}
