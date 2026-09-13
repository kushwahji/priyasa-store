'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import { api } from '@/lib/api';

function ReturnDetail() { const {id}=useParams<{id:string}>(); const [item,setItem]=useState<any>(null); const [error,setError]=useState(''); useEffect(()=>{api<any>(`/storefront/returns/${encodeURIComponent(id)}`).then(r=>setItem(r.data?.return||r.return||r.data||r)).catch(e=>setError(e instanceof Error?e.message:'Unable to load return')).finally(()=>undefined)},[id]); return <main className="accountPage"><div className="sectionHead"><div><span className="eyebrow">PRIYASA / RETURN</span><h1>Return #{id}</h1></div><Link className="textLink" href="/returns">← Returns</Link></div>{error?<div className="formError" role="alert">{error}</div>:item?<div className="checkoutCard"><div className="orderStatus"><strong>{item.status||'Processing'}</strong><span>{item.reason||'Return request'}</span></div><p>{item.customer_note||item.note||'Your return request is being processed by PriyasaCore.'}</p>{item.order&&<Link className="textLink" href={`/orders/${item.order.id}`}>View order →</Link>}</div>:<p className="muted">Loading return…</p>}</main>; }
export default function ReturnDetailPage(){return <AuthGuard><ReturnDetail/></AuthGuard>}
