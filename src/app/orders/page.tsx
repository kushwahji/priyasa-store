'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, clearAccessToken, getAccessToken, isUnauthorizedError } from '@/lib/api';

export default function Orders(){const [orders,setOrders]=useState<any[]>([]);const [loading,setLoading]=useState(true);const [signedOut,setSignedOut]=useState(false);
  useEffect(()=>{let mounted=true;if(!getAccessToken()){setLoading(false);return}api<any>('/orders').then(r=>{if(mounted)setOrders(r.data?.orders||r.data||r.orders||[])}).catch(e=>{if(isUnauthorizedError(e)){clearAccessToken();if(mounted)setSignedOut(true)}else if(mounted)setOrders([])}).finally(()=>{if(mounted)setLoading(false)});return()=>{mounted=false}},[]);
  if((!getAccessToken()||signedOut)&&!loading)return <main className="accountPage"><div className="emptyState"><h2>Sign in to view orders</h2><Link className="button" href="/auth/login">Sign in</Link></div></main>;
  return <main className="accountPage"><span className="eyebrow">MY PRIYASA</span><h1>Orders</h1>{loading?<p className="muted">Loading your orders…</p>:orders.length?<div className="orderList">{orders.map((o,i)=><article className="orderCard" key={o.id||i}><div><strong>Order #{o.order_number||o.id}</strong><small>{o.status||'Processing'}</small></div><div><b>₹{Number(o.total||o.grand_total||0).toLocaleString('en-IN')}</b><Link href={`/orders/${o.id}`}>View order →</Link></div></article>)}</div>:<div className="emptyState"><h2>No orders yet</h2><p>Your completed purchases will appear here.</p><Link className="button" href="/shop">Start shopping</Link></div>}</main>}
