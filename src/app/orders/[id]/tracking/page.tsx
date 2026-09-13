'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import AuthGuard from '@/components/AuthGuard';

function TrackingInner() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError('');
    try {
      const r = await api<any>(`/storefront/orders/${encodeURIComponent(id)}/tracking`);
      setData(r.data || r);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load tracking'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { void load(); }, [load]);
  const events = Array.isArray(data?.timeline) ? data.timeline : (Array.isArray(data?.events) ? data.events : []);

  return <main className="accountPage">
    <div className="sectionHead"><div><span className="eyebrow">PRIYASA / DELIVERY</span><h1>Track order</h1></div><Link className="textLink" href={`/orders/${encodeURIComponent(id)}`}>← Order</Link></div>
    {loading ? <div className="emptyState"><p className="muted">Loading shipment status…</p></div> : error ? <div className="emptyState"><div className="formError" role="alert">{error}</div><button className="button" onClick={() => void load()}>Retry</button></div> : <div className="checkoutCard">
      <h2>{data?.status || data?.current_status || 'Shipment status'}</h2>
      {(data?.tracking_number || data?.awb) && <p><b>{data?.carrier || data?.courier_name || 'Courier'}</b> · {data?.tracking_number || data?.awb}</p>}
      <div className="timeline">{events.map((event: any, i: number) => <div className="timelineItem" key={event.id || i}><b>{event.status || event.title || 'Shipment update'}</b><span>{event.description || event.message || ''}</span><small>{event.created_at ? new Date(event.created_at).toLocaleString('en-IN') : ''}</small></div>)}{!events.length && <p className="muted">Tracking events will appear here when the shipment is updated.</p>}</div>
    </div>}
  </main>;
}
export default function TrackingPage() { return <AuthGuard><TrackingInner /></AuthGuard>; }
