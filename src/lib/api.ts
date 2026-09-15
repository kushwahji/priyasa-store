const BASE = (typeof window === 'undefined' ? process.env.PRIYASA_API_BASE_URL : process.env.NEXT_PUBLIC_PRIYASA_API_BASE_URL || process.env.PRIYASA_API_BASE_URL || '').replace(/\/$/, '');

let memoryToken: string | null = null;
let serviceDownNotified = false;

export class PriyasaUnauthorizedError extends Error { constructor(){super('PRIYASA_AUTH_UNAUTHORIZED');this.name='PriyasaUnauthorizedError'} }
export class PriyasaServiceDownError extends Error { constructor(public readonly status?: number){super(status===404?'PRIYASA_API_404':'PRIYASA_API_DOWN');this.name='PriyasaServiceDownError'} }

export function getAccessToken(){
  if(typeof window==='undefined') return null;
  if(memoryToken) return memoryToken;
  try { memoryToken=localStorage.getItem('priyasa_access_token'); } catch { memoryToken=null; }
  return memoryToken;
}
export function setAccessToken(token:string){
  memoryToken=token;
  if(typeof window!=='undefined') try { localStorage.setItem('priyasa_access_token',token); } catch {}
}
export function clearAccessToken(){
  memoryToken=null;
  if(typeof window!=='undefined') try { localStorage.removeItem('priyasa_access_token'); } catch {}
}

function notifyServiceDown(code:string, status?:number){
  if(typeof window==='undefined' || serviceDownNotified) return;
  serviceDownNotified=true;
  window.dispatchEvent(new CustomEvent('priyasa:service-down',{detail:{code,status}}));
}
export function resetServiceDownNotice(){serviceDownNotified=false;}

export async function api<T>(path:string,init:RequestInit={}){
  if(!BASE){notifyServiceDown('PRIYASA_API_DOWN');throw new PriyasaServiceDownError();}
  const headers=new Headers(init.headers);headers.set('Accept','application/json');
  if(init.body&&!headers.has('Content-Type'))headers.set('Content-Type','application/json');
  const token=getAccessToken();if(token)headers.set('Authorization',`Bearer ${token}`);
  if(['POST','PUT','PATCH','DELETE'].includes((init.method||'GET').toUpperCase())&&!headers.has('Idempotency-Key')){
    headers.set('Idempotency-Key',typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`);
  }
  let res:Response;
  try { res=await fetch(`${BASE}${path}`,{...init,headers,cache:'no-store'}); }
  catch { notifyServiceDown('PRIYASA_API_DOWN'); throw new PriyasaServiceDownError(); }
  if(res.status===401) throw new PriyasaUnauthorizedError();
  if([404,502,503,504].includes(res.status)) { notifyServiceDown(res.status===404?'PRIYASA_API_404':'PRIYASA_API_DOWN',res.status); throw new PriyasaServiceDownError(res.status); }
  const body=await res.json().catch(()=>null);
  if(!res.ok)throw new Error(body?.message||`PRIYASA_API_${res.status}`);
  return body as T;
}
