const SERVER_BASE=(process.env.PRIYASA_API_BASE_URL||process.env.PRIYASA_API_URL||'').replace(/\/$/,'');
const BROWSER_BASE='/api/priyasa';
const SESSION_MARKER='priyasa_session_active';

function base(){return typeof window==='undefined'?SERVER_BASE:BROWSER_BASE}

// Browser code never reads or stores the bearer token. The BFF owns the HttpOnly session cookie.
export function getAccessToken(){return typeof window!=='undefined'&&localStorage.getItem(SESSION_MARKER)==='1'?'session':null}
export function setAccessToken(token:string){if(typeof window!=='undefined'&&token)localStorage.setItem(SESSION_MARKER,'1')}
export function clearAccessToken(){if(typeof window!=='undefined')localStorage.removeItem(SESSION_MARKER)}

function redirectToLogin(){
  if(typeof window==='undefined')return;
  const path=window.location.pathname;
  if(path.startsWith('/auth/login'))return;
  const next=`${path}${window.location.search}`;
  window.location.assign(`/auth/login?next=${encodeURIComponent(next)}`);
}

export async function api<T>(path:string,init:RequestInit={}){
  const headers=new Headers(init.headers);
  headers.set('Accept','application/json');
  if(init.body&&!headers.has('Content-Type'))headers.set('Content-Type','application/json');
  const method=(init.method||'GET').toUpperCase();
  if(['POST','PUT','PATCH','DELETE'].includes(method)&&!headers.has('Idempotency-Key'))headers.set('Idempotency-Key',crypto.randomUUID());
  const res=await fetch(`${base()}${path}`,{...init,headers,cache:'no-store',credentials:'include'});
  if(res.status===401){
    clearAccessToken();
    redirectToLogin();
  }
  const body=await res.json().catch(()=>null);
  if(!res.ok)throw new Error(body?.message||`PRIYASA_API_${res.status}`);
  return body as T;
}
