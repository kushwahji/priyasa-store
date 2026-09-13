'use client';

import Link from 'next/link';
import {useSearchParams} from 'next/navigation';
import {useEffect,useState} from 'react';
import {api} from '@/lib/api';

type PaymentSession={razorpay_order_id?:string;order_id?:string;amount?:number|string;currency?:string;key_id?:string;razorpay_key_id?:string};

export default function PaymentContent(){
  const params=useSearchParams();
  const order=params.get('order');
  const [session,setSession]=useState<PaymentSession|null>(null);
  const [state,setState]=useState<'loading'|'ready'|'opening'|'error'>('loading');
  const [message,setMessage]=useState('Preparing secure payment…');

  useEffect(()=>{if(!order){setState('error');setMessage('Missing order reference.');return}api<any>(`/storefront/orders/${encodeURIComponent(order)}/payment`,{method:'POST',body:JSON.stringify({})}).then(r=>{const p=r.data?.payment||r.data||r.payment||r;const s={...p,razorpay_order_id:p.razorpay_order_id||p.order_id||p.provider_order_id,key_id:p.key_id||p.razorpay_key_id};if(!s.razorpay_order_id||!s.key_id)throw new Error('PriyasaCore did not return the Razorpay order or public key.');setSession(s);setState('ready');setMessage('Payment is ready.')}).catch(e=>{setState('error');setMessage(e instanceof Error?e.message:'Unable to prepare payment')})},[order]);

  async function pay(){if(!session||!order||state==='opening')return;setState('opening');setMessage('Opening secure Razorpay checkout…');try{await new Promise<void>((resolve,reject)=>{const existing=document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');if(existing)return resolve();const s=document.createElement('script');s.src='https://checkout.razorpay.com/v1/checkout.js';s.onload=()=>resolve();s.onerror=()=>reject(new Error('Unable to load Razorpay checkout.'));document.body.appendChild(s)});const RazorpayCtor=(window as any).Razorpay;if(!RazorpayCtor)throw new Error('Razorpay checkout is unavailable.');const rzp=new RazorpayCtor({key:session.key_id,amount:Number(session.amount||0),currency:session.currency||'INR',name:'PRIYASA',description:`Order #${order}`,order_id:session.razorpay_order_id,handler:async(response:any)=>{try{await api(`/storefront/orders/${encodeURIComponent(order)}/payment/capture`,{method:'POST',body:JSON.stringify({provider_payment_id:response.razorpay_payment_id,payload:{razorpay_order_id:response.razorpay_order_id,razorpay_signature:response.razorpay_signature}})});window.location.href=`/checkout/payment/return?order=${encodeURIComponent(order)}`}catch(e){setState('error');setMessage(e instanceof Error?e.message:'Payment verification failed. Please check your order status.')}},modal:{ondismiss:()=>{setState('ready');setMessage('Payment window closed. Your order has not been marked paid.')}}});rzp.on('payment.failed',()=>{setState('error');setMessage('Payment failed. Your order remains unconfirmed until PriyasaCore receives a successful payment status.')});rzp.open()}catch(e){setState('error');setMessage(e instanceof Error?e.message:'Unable to open payment')}}

  return <main className="checkoutPage"><section className="emptyState"><span className="eyebrow">PRIYASA / PAYMENT</span><h1>{state==='ready'?'Secure payment':state==='opening'?'Opening payment':state==='error'?'Payment unavailable':'Preparing payment'}</h1><p>{message}</p>{session&&state!=='error'&&<p><b>Amount: ₹{Number(session.amount||0).toLocaleString('en-IN')}</b> · {session.currency||'INR'}</p>}<div className="heroActions"><Link className="button secondary" href="/cart">Back to bag</Link>{state==='ready'&&<button className="button" onClick={pay}>Pay securely</button>}{state==='error'&&<Link className="button" href="/orders">Check my orders</Link>}</div><p className="muted">Payment confirmation is accepted only after PriyasaCore verifies the Razorpay response.</p></section></main>;
}
