const BASE = (typeof window === 'undefined' ? process.env.PRIYASA_API_BASE_URL : process.env.NEXT_PUBLIC_PRIYASA_API_BASE_URL || process.env.PRIYASA_API_BASE_URL || '').replace(/\/$/, '');

export function getAccessToken(){return typeof window!=='undefined'?localStorage.getItem('priyasa_access_token'):null}
export function setAccessToken(token:string){if(typeof window!=='undefined')localStorage.setItem('priyasa_access_token',token)}
export function clearAccessToken(){if(typeof window!=='undefined')localStorage.removeItem('priyasa_access_token')}

export async function api<T>(path:string,init:RequestInit={}){
  if(!BASE) throw new Error('PRIYASA_API_BASE_URL is not configured');
  const headers=new Headers(init.headers);headers.set('Accept','application/json');
  if(init.body&&!headers.has('Content-Type'))headers.set('Content-Type','application/json');
  const token=getAccessToken();if(token)headers.set('Authorization',`Bearer ${token}`);
  if(['POST','PUT','PATCH','DELETE'].includes((init.method||'GET').toUpperCase())&&!headers.has('Idempotency-Key'))headers.set('Idempotency-Key',crypto.randomUUID());
  const res=await fetch(`${BASE}${path}`,{...init,headers,cache:'no-store'});
  if(res.status===401)clearAccessToken();
  const body=await res.json().catch(()=>null);
  if(!res.ok)throw new Error(body?.message||`PRIYASA_API_${res.status}`);
  return body as T;
}
