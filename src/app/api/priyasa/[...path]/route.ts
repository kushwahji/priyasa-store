import { NextRequest, NextResponse } from 'next/server';

const UPSTREAM=(process.env.PRIYASA_API_BASE_URL||process.env.PRIYASA_API_URL||'').replace(/\/$/,'');
const SESSION_COOKIE='priyasa_session';
const TIMEOUT_MS=15_000;

function extractToken(value:unknown):string|null{
  if(!value||typeof value!=='object')return null;
  const record=value as Record<string,unknown>;
  const direct=[record.access_token,record.accessToken,record.token].find(v=>typeof v==='string'&&v.length>20);
  if(direct)return direct as string;
  if(record.data&&typeof record.data==='object')return extractToken(record.data);
  return null;
}
function isMutation(method:string){return ['POST','PUT','PATCH','DELETE'].includes(method)}
function sameOrigin(request:NextRequest){const origin=request.headers.get('origin');return !origin||origin===request.nextUrl.origin}

export async function ALL(request:NextRequest,context:{params:Promise<{path:string[]}>}){
  if(!UPSTREAM)return NextResponse.json({message:'PRIYASA_API_BASE_URL is not configured.'},{status:500});
  if(isMutation(request.method)&&!sameOrigin(request))return NextResponse.json({message:'Cross-origin request rejected.'},{status:403});
  const {path}=await context.params;
  const target=`${UPSTREAM}/${path.map(encodeURIComponent).join('/')}${request.nextUrl.search}`;
  const headers=new Headers();
  for(const [key,value] of request.headers){
    if(['host','content-length','connection','cookie','authorization','x-priyasa-store-proxy'].includes(key.toLowerCase()))continue;
    headers.set(key,value);
  }
  const session=request.cookies.get(SESSION_COOKIE)?.value;
  if(session)headers.set('Authorization',`Bearer ${session}`);
  const body=['GET','HEAD'].includes(request.method)?undefined:await request.arrayBuffer();
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),TIMEOUT_MS);
  try{
    const upstream=await fetch(target,{method:request.method,headers,body,cache:'no-store',redirect:'manual',signal:controller.signal});
    const responseBody=await upstream.arrayBuffer();
    const responseHeaders=new Headers();
    const contentType=upstream.headers.get('content-type');
    if(contentType)responseHeaders.set('content-type',contentType);
    for(const name of ['cache-control','etag','x-request-id','x-correlation-id']){const value=upstream.headers.get(name);if(value)responseHeaders.set(name,value)}
    const response=new NextResponse(responseBody,{status:upstream.status,statusText:upstream.statusText,headers:responseHeaders});
    const route=path.join('/');
    const clear=()=>response.cookies.set(SESSION_COOKIE,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:0});
    if(route==='auth/verify-otp'&&upstream.ok&&contentType?.includes('application/json')){
      try{const parsed=JSON.parse(new TextDecoder().decode(responseBody));const token=extractToken(parsed);if(token)response.cookies.set(SESSION_COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*30})}catch{}
    }
    if(route==='auth/logout'||upstream.status===401)clear();
    return response;
  }catch(error){
    if(error instanceof Error&&error.name==='AbortError')return NextResponse.json({message:'PriyasaCore API request timed out'},{status:504});
    return NextResponse.json({message:'Unable to reach PriyasaCore API'},{status:502});
  }finally{clearTimeout(timeout)}
}
export const GET=ALL;export const POST=ALL;export const PUT=ALL;export const PATCH=ALL;export const DELETE=ALL;export const HEAD=ALL;
export const dynamic='force-dynamic';
