'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export default function ProductActions({ productId, sizes = [], colors = [] }: { productId: string | number; sizes?: string[]; colors?: string[] }) {
  const [size, setSize] = useState(sizes[0] || '');
  const [color, setColor] = useState(colors[0] || '');
  const [busy, setBusy] = useState<'bag' | 'wishlist' | null>(null);
  const [message, setMessage] = useState('');

  async function addToBag() {
    if (sizes.length && !size) return setMessage('Please select a size.');
    setBusy('bag'); setMessage('');
    try {
      await api('/cart/items', { method: 'POST', body: JSON.stringify({ product_id: productId, quantity: 1, ...(size ? { size } : {}), ...(color ? { color } : {}) }) });
      setMessage('Added to bag.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to add this item.');
    } finally { setBusy(null); }
  }

  async function addToWishlist() {
    setBusy('wishlist'); setMessage('');
    try {
      await api('/wishlist/items', { method: 'POST', body: JSON.stringify({ product_id: productId }) });
      setMessage('Added to wishlist.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to update wishlist.');
    } finally { setBusy(null); }
  }

  return <>
    {sizes.length ? <div className="variantBlock"><strong>Select size</strong><div className="variantRow">{sizes.map(s => <button type="button" key={s} className={size === s ? 'selected' : ''} onClick={() => setSize(s)}>{s}</button>)}</div></div> : null}
    {colors.length ? <div className="variantBlock"><strong>Select colour</strong><div className="variantRow">{colors.map(c => <button type="button" key={c} className={color === c ? 'selected' : ''} onClick={() => setColor(c)}>{c}</button>)}</div></div> : null}
    <div className="pdpActions">
      <button type="button" className="button secondary" disabled={busy !== null} onClick={addToWishlist}>{busy === 'wishlist' ? 'SAVING…' : '♡ WISHLIST'}</button>
      <button type="button" className="button" disabled={busy !== null} onClick={addToBag}>{busy === 'bag' ? 'ADDING…' : 'ADD TO BAG'}</button>
    </div>
    <p className="actionMessage" role="status" aria-live="polite">{message}</p>
  </>;
}
