'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import AuthGuard from '@/components/AuthGuard';

function PaymentReturnInner(){const q=useSearchParams();const order=q.get('order');const [status,setStatus]=useState('checking');useEffect(()=>{if(!order){setStatus('missing');return}let cancelled=false;const check=async()=>{try{const r=await api<any>(`/storefront/orders/${encodeURIComponent(order)}/payment`);const data=r.data||r;const s=String(data.payment?.status||data.payment_status||data.status||'pending').toLowerCase();if(!cancelled)setStatus(s)}catch{if(!cancelled)setStatus('unknown')}};check();return()=>{cancelled=true}},[order]);const paid=['paid','captured','confirmed','completed','success'].includes(status);const pending=['pending','created','authorized','checking'].includes(status);return <main className="checkoutPage"><section className="emptyState"><span className="eyebrow">PRIYASA / ORDER</span><h1>{paid?'Order confirmed':pending?'Confirming your order':'Payment needs attention'}</h1><p>{paid?'Your payment has been confirmed by PriyasaCore.':pending?'We are checking the authoritative payment status. Do not retry payment until this check completes.':'We could not confirm a successful payment. Please check your order status before trying again.'}</p><div className="heroActions">{order&&<Link className="button" href={`/orders/${encodeURIComponent(order)}`}>View order</Link>}<Link className="button secondary" href="/shop">Continue shopping</Link></div></section></main>}
export default function PaymentReturnContent(){return <AuthGuard><PaymentReturnInner/></AuthGuard>}
