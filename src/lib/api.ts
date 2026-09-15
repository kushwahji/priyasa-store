const SERVER_BASE=(process.env.PRIYASA_API_BASE_URL||process.env.PRIYASA_API_URL||'https://api.priyasa.com/api/v1').replace(/\/$/,'');
const BROWSER_BASE='/api/priyasa';
const SESSION_MARKER='priyasa_session_active';

function buildUrl(path:string){
  if(typeof window==='undefined')return `${SERVER_BASE}${path}`;
  const [pathname,query='']=path.split('?');
  const params=new URLSearchParams(query);
  params.set('_path',pathname.startsWith('/')?pathname:`/${pathname}`);
  return `${BROWSER_BASE}?${params.toString()}`;
}

function idempotencyKey(){
  try{
    if(typeof crypto!=='undefined'&&typeof crypto.randomUUID==='function')return crypto.randomUUID();
    if(typeof crypto!=='undefined'&&typeof crypto.getRandomValues==='function'){
      const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);
      return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
    }
  }catch{}
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

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
  if(['POST','PUT','PATCH','DELETE'].includes(method)&&!headers.has('Idempotency-Key'))headers.set('Idempotency-Key',idempotencyKey());

  let res:Response;
  try{
    res=await fetch(buildUrl(path),{...init,headers,cache:'no-store',credentials:'include'});
  }catch(e){
    throw new Error(e instanceof Error&&e.message?`Unable to reach PriyasaCore: ${e.message}`:'Unable to reach PriyasaCore. Check the Store API connection.');
  }

  if(res.status===401){
    clearAccessToken();
    redirectToLogin();
  }
  const body=await res.json().catch(()=>null);
  if(!res.ok)throw new Error(body?.message||body?.error||`PRIYASA_API_${res.status}`);
  return body as T;
}
