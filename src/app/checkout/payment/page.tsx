'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {useSearchParams} from 'next/navigation';
import {api} from '@/lib/api';

export default function PaymentPage(){const params=useSearchParams();const order=params.get('order');const [state,setState]=useState<'loading'|'ready'|'error'>('loading');const [message,setMessage]=useState('Preparing secure payment…');
useEffect(()=>{if(!order){setState('error');setMessage('Missing order reference.');return}api<any>(`/checkout/payment?order=${encodeURIComponent(order)}`).then(r=>{if(r?.data||r?.order_id||r?.payment){setState('ready');setMessage('Your order is ready for payment.')}else throw new Error('Payment session was not created.')}).catch(e=>{setState('error');setMessage(e instanceof Error?e.message:'Unable to prepare payment')})},[order]);
return <main className="checkoutPage"><section className="emptyState"><span className="eyebrow">PRIYASA / PAYMENT</span><h1>{state==='ready'?'Payment ready':state==='error'?'Payment unavailable':'Preparing payment'}</h1><p>{message}</p>{state==='ready'&&<p className="muted">The Razorpay checkout adapter will use the server-created payment order and return the payment signature for server verification.</p>}<div className="heroActions"><Link className="button secondary" href="/cart">Back to bag</Link>{state==='error'&&<Link className="button" href="/checkout">Return to checkout</Link>}</div></section></main>}
