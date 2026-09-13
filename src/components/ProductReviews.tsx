'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Review = { id?: string | number; rating: number; title?: string; body?: string; author_name?: string; user_name?: string; created_at?: string; helpful_count?: number };

export default function ProductReviews({ productId }: { productId: string | number }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function load() {
    try { const r = await api<any>(`/storefront/products/${encodeURIComponent(String(productId))}/reviews`); setReviews(r.data?.reviews || r.reviews || r.data || []); }
    catch { setReviews([]); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [productId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!body.trim()) return setMessage('Please write a review.');
    setBusy(true); setMessage('');
    try {
      const r = await api<any>('/storefront/reviews', { method: 'POST', body: JSON.stringify({ product_id: Number(productId), rating, title: title.trim() || undefined, body: body.trim() }) });
      const review = r.data?.review || r.review || r.data;
      if (review) setReviews(x => [review, ...x]); else await load();
      setTitle(''); setBody(''); setRating(5); setMessage('Thanks — your review was submitted for moderation.');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to submit review. Please sign in and try again.'); }
    finally { setBusy(false); }
  }

  return <section className="reviewSection"><div className="sectionHead"><div><span className="eyebrow">PRIYASA / REVIEWS</span><h2>Customer reviews</h2></div><span className="muted">{reviews.length} review{reviews.length === 1 ? '' : 's'}</span></div><form className="checkoutCard" onSubmit={submit}><strong>Write a review</strong><label>Rating<select value={rating} onChange={e => setRating(Number(e.target.value))}>{[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{'★'.repeat(n)} ({n}/5)</option>)}</select></label><label>Title<input value={title} onChange={e => setTitle(e.target.value)} maxLength={160} placeholder="Summarise your experience" /></label><label>Review<textarea value={body} onChange={e => setBody(e.target.value)} maxLength={5000} rows={4} placeholder="How was the product?" required /></label><button className="button" disabled={busy}>{busy ? 'Submitting…' : 'Submit review'}</button>{message && <p className="formMessage" role="status">{message}</p>}</form>{loading ? <p className="muted">Loading reviews…</p> : !reviews.length ? <div className="emptyState"><p>No reviews yet. Be the first to share your experience.</p></div> : <div className="reviewList">{reviews.map((r, i) => <article className="checkoutCard" key={r.id || i}><div><strong>{'★'.repeat(Math.max(0, Math.min(5, Number(r.rating || 0))))}</strong>{r.author_name || r.user_name ? <small> · {r.author_name || r.user_name}</small> : null}</div>{r.title && <h3>{r.title}</h3>}<p>{r.body}</p>{r.created_at && <small>{new Date(r.created_at).toLocaleDateString('en-IN')}</small>}</article>)}</div>}</section>;
}
