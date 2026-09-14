const SERVER_BASE=(process.env.PRIYASA_API_BASE_URL||process.env.PRIYASA_API_URL||'http://localhost:8000/api/v1').replace(/\/$/,'');
const BROWSER_BASE='/api/backend';

function base(){return typeof window==='undefined'?SERVER_BASE:BROWSER_BASE}

export function getAccessToken(){return typeof window!=='undefined'?localStorage.getItem('priyasa_access_token'):null}
export function setAccessToken(token:string){if(typeof window!=='undefined')localStorage.setItem('priyasa_access_token',token)}
export function clearAccessToken(){if(typeof window!=='undefined')localStorage.removeItem('priyasa_access_token')}

export async function api<T>(path:string,init:RequestInit={}){
  const headers=new Headers(init.headers);
  headers.set('Accept','application/json');
  if(init.body&&!headers.has('Content-Type'))headers.set('Content-Type','application/json');
  const token=getAccessToken();
  if(token)headers.set('Authorization',`Bearer ${token}`);
  const method=(init.method||'GET').toUpperCase();
  if(['POST','PUT','PATCH','DELETE'].includes(method)&&!headers.has('Idempotency-Key'))headers.set('Idempotency-Key',crypto.randomUUID());
  const res=await fetch(`${base()}${path}`,{...init,headers,cache:'no-store'});
  if(res.status===401)clearAccessToken();
  const body=await res.json().catch(()=>null);
  if(!res.ok)throw new Error(body?.message||`PRIYASA_API_${res.status}`);
  return body as T;
}
