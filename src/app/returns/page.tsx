'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import { api } from '@/lib/api';

export default function ReturnsPage() { const [items,setItems]=useState<any[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(''); useEffect(()=>{api<any>('/storefront/returns').then(r=>setItems(r.data?.data||r.data?.items||r.items||[])).catch(e=>setError(e instanceof Error?e.message:'Unable to load returns')).finally(()=>setLoading(false))},[]); return <AuthGuard><main className="accountPage"><div className="sectionHead"><div><span className="eyebrow">PRIYASA / RETURNS</span><h1>Returns & refunds</h1><p className="muted">Your return requests and their current status.</p></div><Link className="textLink" href="/orders">My orders →</Link></div>{error&&<div className="formError" role="alert">{error}</div>}{loading?<p className="muted">Loading returns…</p>:items.length?<div className="orderList">{items.map((r,i)=><Link className="orderCard" href={`/returns/${r.id||r.return_id}`} key={r.id||i}><div><strong>Return #{r.id||r.return_id}</strong><small>{r.reason||'Return request'}</small></div><div><b>{r.status||'processing'}</b></div></Link>)}</div>:<div className="emptyState"><h2>No return requests</h2><p>Eligible returns can be requested from an order after delivery.</p><Link className="button" href="/orders">View orders</Link></div>}</main></AuthGuard>; }
