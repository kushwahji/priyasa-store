'use client';

import { useEffect, useState } from 'react';

export default function ApiStatusModal() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('Priyasa services are temporarily unavailable.');

  useEffect(() => {
    const onApiError = (event: Event) => {
      const detail = (event as CustomEvent<{ status?: number; message?: string }>).detail || {};
      setMessage(detail.message || (detail.status === 404
        ? 'The PRIYASA service endpoint is currently unavailable.'
        : 'Priyasa services are temporarily unavailable.'));
      setOpen(true);
    };
    window.addEventListener('priyasa-api-error', onApiError);
    return () => window.removeEventListener('priyasa-api-error', onApiError);
  }, []);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="priyasa-api-title" style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'grid', placeItems: 'center', padding: 20, background: 'rgba(15,15,15,.58)' }}>
      <section style={{ width: 'min(440px,100%)', borderRadius: 20, background: '#fff', padding: 28, boxShadow: '0 24px 80px rgba(0,0,0,.25)', textAlign: 'center' }}>
        <div style={{ fontSize: 34, marginBottom: 8 }}>⏳</div>
        <p style={{ margin: '0 0 6px', fontSize: 12, letterSpacing: '.16em', fontWeight: 700 }}>PRIYASA</p>
        <h2 id="priyasa-api-title" style={{ margin: '0 0 10px', fontSize: 24 }}>We’re refreshing the edit.</h2>
        <p style={{ margin: '0 auto 22px', maxWidth: 360, color: '#666', lineHeight: 1.55 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => window.location.reload()} style={{ border: 0, borderRadius: 999, padding: '12px 22px', background: '#111', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Retry</button>
          <a href="https://priyasa.com" style={{ border: '1px solid #ddd', borderRadius: 999, padding: '11px 22px', color: '#111', textDecoration: 'none', fontWeight: 700 }}>Open PRIYASA.COM</a>
        </div>
        <button type="button" onClick={() => setOpen(false)} style={{ marginTop: 16, border: 0, background: 'transparent', color: '#777', cursor: 'pointer' }}>Continue browsing</button>
      </section>
    </div>
  );
}
