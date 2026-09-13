'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function OrderTimeline({ orderId }: { orderId: string | number }) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    api<any>(`/storefront/orders/${encodeURIComponent(String(orderId))}/timeline`)
      .then((r) => {
        if (!alive) return;
        setEvents(r.data?.timeline || r.data?.events || r.timeline || r.events || []);
      })
      .catch((e) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : 'Unable to load order timeline');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, [orderId]);

  return (
    <div className="checkoutCard">
      <h2>Order timeline</h2>
      {loading ? <p className="muted">Loading timeline…</p> : error ? <p className="muted">{error}</p> : events.length ? (
        <div className="timeline">
          {events.map((event: any, i: number) => (
            <div className="timelineItem" key={event.id || i}>
              <b>{event.status || event.title || 'Order update'}</b>
              <span>{event.description || event.message || ''}</span>
              <small>{event.created_at ? new Date(event.created_at).toLocaleString('en-IN') : ''}</small>
            </div>
          ))}
        </div>
      ) : <p className="muted">Order updates will appear here as fulfillment progresses.</p>}
    </div>
  );
}
