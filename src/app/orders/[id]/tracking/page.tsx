'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import { api } from '@/lib/api';

type TrackingData = { shipment?: any; tracking?: any };

function TrackingInner() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<TrackingData | null>(null);
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

  const shipment = data?.shipment || {};
  const tracking = data?.tracking || {};
  const trackingData = tracking?.tracking_data || tracking?.data || tracking;
  const activities = Array.isArray(trackingData?.shipment_track_activities)
    ? trackingData.shipment_track_activities
    : Array.isArray(trackingData?.activities)
      ? trackingData.activities
      : Array.isArray(trackingData?.timeline)
        ? trackingData.timeline
        : [];
  const latestTrack = Array.isArray(trackingData?.shipment_track) ? trackingData.shipment_track[0] : trackingData?.shipment_track;
  const status = trackingData?.shipment_status || latestTrack?.current_status || trackingData?.current_status || shipment.status || 'Shipment status';
  const carrier = latestTrack?.courier_name || trackingData?.courier_name || shipment.courier_name || shipment.courier || 'Courier';
  const awb = latestTrack?.awb_code || trackingData?.awb_code || shipment.awb;
  const trackingUrl = shipment.tracking_url;

  return <main className="accountPage">
    <div className="sectionHead"><div><span className="eyebrow">PRIYASA / DELIVERY</span><h1>Track order</h1></div><Link className="textLink" href={`/orders/${encodeURIComponent(id)}`}>← Order</Link></div>
    {loading ? <div className="emptyState"><p className="muted">Loading shipment status…</p></div> : error ? <div className="emptyState"><div className="formError" role="alert">{error}</div><button className="button" onClick={() => void load()}>Retry</button></div> : <div className="checkoutCard">
      <div className="orderStatus"><strong>{status}</strong><span>{awb ? `${carrier} · ${awb}` : 'Tracking updates'}</span></div>
      {trackingUrl && <p><a className="textLink" href={trackingUrl} target="_blank" rel="noreferrer">Open courier tracking →</a></p>}
      <div className="timeline">
        {activities.map((event: any, i: number) => <div className="timelineItem" key={event.id || `${event.date || event.activity || event.status || 'event'}-${i}`}>
          <b>{event.activity || event.status || event.title || 'Shipment update'}</b>
          <span>{event.location || event.description || event.message || ''}</span>
          <small>{event.date || event.created_at ? new Date(event.date || event.created_at).toLocaleString('en-IN') : ''}</small>
        </div>)}
        {!activities.length && <p className="muted">Tracking events will appear here when the courier provides shipment updates.</p>}
      </div>
    </div>}
  </main>;
}
export default function TrackingPage() { return <AuthGuard><TrackingInner /></AuthGuard>; }
