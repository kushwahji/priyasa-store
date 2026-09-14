'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Review = { id?: string | number; rating?: number; title?: string; body?: string; comment?: string; review?: string; user_name?: string; customer_name?: string; created_at?: string };
function unwrap(value: any): Review[] { const v = value?.data ?? value ?? []; if (Array.isArray(v)) return v; return v.items ?? v.reviews ?? v.data ?? []; }

export default function ProductReviews({ productId }: { productId: string | number }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const r = await api<any>(`/storefront/products/${encodeURIComponent(String(productId))}/reviews`);
        if (active) setReviews(unwrap(r));
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Unable to load reviews.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [productId]);

  return <section className="reviewsSection" aria-labelledby="reviews-title">
    <div className="sectionHead"><div><span className="eyebrow">PRIYASA / REVIEWS</span><h2 id="reviews-title">Customer reviews</h2></div></div>
    {loading ? <p className="muted">Loading reviews…</p> : error ? <p className="muted">Reviews are temporarily unavailable.</p> : reviews.length === 0 ? <p className="muted">No reviews yet. Be the first to share your experience after purchase.</p> : <div className="reviewList">{reviews.map((review, index) => <article className="reviewCard" key={review.id ?? index}><div className="reviewMeta"><strong>★ {Number(review.rating || 0).toFixed(1)}</strong><span>{review.customer_name || review.user_name || 'Verified customer'}</span></div>{review.title && <h3>{review.title}</h3>}<p>{review.body || review.comment || review.review || ''}</p>{review.created_at && <small className="muted">{new Date(review.created_at).toLocaleDateString('en-IN')}</small>}</article>)}</div>}
  </section>;
}
