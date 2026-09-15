'use client';

import AuthGuard from '@/components/AuthGuard';
import { api } from '@/lib/api';
import { useEffect, useState } from 'react';

type Notification={id?:number|string;title?:string;message?:string;body?:string;read_at?:string|null;created_at?:string;type?:string};
function Content(){const[n,setN]=useState<Notification[]>([]),[unread,setUnread]=useState(0),[loading,setLoading]=useState(true),[error,setError]=useState('');
 async function load(){setLoading(true);setError('');try{const[r,u]=await Promise.all([api<any>('/storefront/notifications/inbox'),api<any>('/storefront/notifications/unread')]);const items=r?.data?.items??r?.items??r?.data??[];const count=u?.data?.count??u?.count??(Array.isArray(u?.data)?u.data.length:0);setN(Array.isArray(items)?items:[]);setUnread(Number(count)||0)}catch(e){setError(e instanceof Error?e.message:'Unable to load notifications.')}finally{setLoading(false)}}
 useEffect(()=>{void load()},[]);
 async function mark(id:number|string){try{await api(`/storefront/notifications/${encodeURIComponent(String(id))}/read`,{method:'POST'});await load()}catch(e){setError(e instanceof Error?e.message:'Unable to mark notification as read.')}}
 return <main className="accountPage"><span className="eyebrow">PRIYASA / NOTIFICATIONS</span><div className="sectionHead"><div><h1>Notifications</h1><p className="muted">{unread} unread</p></div><button className="textButton" onClick={()=>void load()} disabled={loading}>Refresh</button></div>{error&&<div className="formError" role="alert">{error}</div>}{loading?<p className="muted">Loading notifications…</p>:n.length===0?<section className="emptyState"><h2>You’re all caught up</h2><p>Order updates, offers and account alerts will appear here.</p></section>:<div className="addressList">{n.map((item,i)=><article className={`addressChoice${item.read_at?'':' notificationUnread'}`} key={String(item.id??i)}><div><strong>{item.title||item.type||'PRIYASA update'}</strong><p>{item.message||item.body||''}</p>{item.created_at&&<small>{new Date(item.created_at).toLocaleString('en-IN')}</small>}</div>{!item.read_at&&item.id!=null&&<button className="textButton" onClick={()=>void mark(item.id!)}>Mark read</button>}</article>)}</div>}</main>}
export default function NotificationsPage(){return <AuthGuard><Content/></AuthGuard>}
