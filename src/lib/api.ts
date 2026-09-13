const UPSTREAM=(process.env.PRIYASA_API_BASE_URL||process.env.PRIYASA_API_URL||'').replace(/\/$/,'');
const BROWSER_BASE='/api/priyasa';

/** Browser authentication is carried by the Store's HttpOnly session cookie. */
export function getAccessToken(){return null}
export function setAccessToken(_token:string){void _token}
export function clearAccessToken(){void 0}

export class ApiError extends Error {
  status:number;
  requestId:string|null;
  code:string|null;
  details:unknown;
  constructor(message:string,status:number,requestId:string|null=null,code:string|null=null,details:unknown=null){
    super(message); this.name='ApiError'; this.status=status; this.requestId=requestId; this.code=code; this.details=details;
  }
}

function loginUrl(){
  if(typeof window==='undefined')return '/auth/login';
  const next=`${window.location.pathname}${window.location.search}${window.location.hash}`;
  return `/auth/login?next=${encodeURIComponent(next||'/')}`;
}

function headerValue(res:Response,...names:string[]){for(const name of names){const value=res.headers.get(name);if(value)return value}return null}

export async function api<T>(path:string,init:RequestInit={}){
  const headers=new Headers(init.headers);
  headers.set('Accept','application/json');
  if(init.body&&!headers.has('Content-Type'))headers.set('Content-Type','application/json');
  if(['POST','PUT','PATCH','DELETE'].includes((init.method||'GET').toUpperCase())&&!headers.has('Idempotency-Key')){
    headers.set('Idempotency-Key',typeof crypto?.randomUUID==='function'?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`);
  }
  const normalized=path.startsWith('/')?path.slice(1):path;
  const isBrowser=typeof window!=='undefined';
  const url=isBrowser?`${BROWSER_BASE}/${normalized}`:`${UPSTREAM}/${normalized}`;
  try{
    const res=await fetch(url,{...init,headers,credentials:'include',cache:'no-store'});
    const body=await res.json().catch(()=>null);
    const requestId=headerValue(res,'X-Request-Id','X-Correlation-Id','X-Request-ID')||body?.request_id||body?.meta?.request_id||null;
    if(res.status===401&&isBrowser&&!window.location.pathname.startsWith('/auth/login')){
      window.location.replace(loginUrl());
      throw new ApiError('Your session has expired. Please sign in again.',401,requestId,body?.code||'UNAUTHENTICATED',body);
    }
    if(!res.ok){
      const message=body?.message||body?.error||body?.errors?.message||`PRIYASA_API_${res.status}`;
      const code=body?.code||body?.error_code||body?.meta?.code||null;
      throw new ApiError(String(message),res.status,requestId,code,body?.errors??body?.data??null);
    }
    return body as T;
  }catch(error){
    if(error instanceof ApiError)throw error;
    if(error instanceof Error&&error.message!=='Failed to fetch')throw error;
    throw new Error('Unable to reach PRIYASA Core. Check the Store deployment and PRIYASA_API_BASE_URL.');
  }
}
