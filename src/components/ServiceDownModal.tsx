'use client';

import { useEffect, useState } from 'react';

const WHATSAPP = 'https://wa.me/917987610989?text=Hi%20PRIYASA%2C%20the%20store%20service%20is%20currently%20unavailable.';
const PRIYASA = 'https://priyasa.com';

type ServiceDownDetail = { code?: string; message?: string };

export default function ServiceDownModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onServiceDown = (event: Event) => {
      const detail = (event as CustomEvent<ServiceDownDetail>).detail;
      if (!detail?.code || detail.code === 'PRIYASA_API_404' || detail.code === 'PRIYASA_API_DOWN') {
        setOpen(true);
      }
    };
    window.addEventListener('priyasa:service-down', onServiceDown);
    return () => window.removeEventListener('priyasa:service-down', onServiceDown);
  }, []);

  if (!open) return null;

  return (
    <div className="serviceDownBackdrop" role="presentation">
      <section className="serviceDownModal" role="alertdialog" aria-modal="true" aria-labelledby="service-down-title">
        <div className="serviceDownIcon" aria-hidden="true">!</div>
        <span className="eyebrow">PRIYASA</span>
        <h2 id="service-down-title">Service temporarily unavailable</h2>
        <p>We’re having trouble connecting to the PRIYASA store service. Please try again shortly or contact us on WhatsApp.</p>
        <div className="serviceDownActions">
          <button className="button" onClick={() => window.location.reload()}>Retry</button>
          <a className="serviceDownSecondary" href={WHATSAPP} target="_blank" rel="noopener noreferrer">WhatsApp</a>
          <a className="serviceDownSecondary" href={PRIYASA} target="_blank" rel="noopener noreferrer">Go to priyasa.com</a>
        </div>
      </section>
    </div>
  );
}
