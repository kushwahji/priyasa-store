'use client';

import { useMemo, useState } from 'react';
import { api } from '@/lib/api';

type Variant = { id: string | number; size?: string; label?: string; color?: string; colour?: string; stock?: number; inventory?: number };

export default function ProductActions({ variantId, sizes = [], colors = [], variants = [] }: { variantId: string | number; sizes?: string[]; colors?: string[]; variants?: Variant[] }) {
  const [size, setSize] = useState(sizes[0] || '');
  const [color, setColor] = useState(colors[0] || '');
  const [busy, setBusy] = useState<'bag' | 'buy' | 'wishlist' | null>(null);
  const [message, setMessage] = useState('');
  const selectedVariant = useMemo(() => {
    if (!variants.length) return variantId;
    return (variants.find(v => (v.size || v.label || '') === size && (!color || (v.color || v.colour || '') === color)) || variants.find(v => (v.size || v.label || '') === size) || variants[0])?.id || '';
  }, [variants, variantId, size, color]);
  const selected = variants.find(v => String(v.id) === String(selectedVariant));
  const stock = selected ? Number(selected.stock ?? selected.inventory ?? 0) : 0;
  const unavailable = selected ? stock <= 0 : !selectedVariant;
  async function addToBag(redirect = false) {
    if (!selectedVariant) return setMessage('This product variant is unavailable.');
    if (sizes.length && !size) return setMessage('Please select a size.');
    if (unavailable) return setMessage('This selected variant is out of stock.');
    setBusy(redirect ? 'buy' : 'bag'); setMessage('');
    try { await api('/storefront/cart/items', { method: 'POST', body: JSON.stringify({ variant_id: selectedVariant, quantity: 1 }) }); if (redirect) window.location.assign('/checkout'); else setMessage('Added to bag.'); }
    catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to add this item.'); }
    finally { setBusy(null); }
  }
  async function toggleWishlist() {
    if (!selectedVariant) return setMessage('This product variant is unavailable.');
    setBusy('wishlist'); setMessage('');
    try { await api('/storefront/wishlist/toggle', { method: 'POST', body: JSON.stringify({ variant_id: selectedVariant }) }); setMessage('Wishlist updated.'); }
    catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to update wishlist.'); }
    finally { setBusy(null); }
  }
  return <>
    {sizes.length ? <div className="variantBlock"><strong>Select size</strong><div className="variantRow">{sizes.map(s => <button type="button" key={s} className={size === s ? 'selected' : ''} aria-pressed={size === s} onClick={() => setSize(s)}>{s}</button>)}</div></div> : null}
    {colors.length ? <div className="variantBlock"><strong>Select colour</strong><div className="variantRow">{colors.map(c => <button type="button" key={c} className={color === c ? 'selected' : ''} aria-pressed={color === c} onClick={() => setColor(c)}>{c}</button>)}</div></div> : null}
    {selected && <div className="selectedVariant" aria-live="polite"><span>{selected.size || selected.label || ''}{selected.color || selected.colour ? ` · ${selected.color || selected.colour}` : ''}</span><b>{unavailable ? 'Out of stock' : stock <= 5 ? `Only ${stock} left` : 'In stock'}</b></div>}
    <div className="pdpActions">
      <button type="button" className="button secondary" disabled={busy !== null || !selectedVariant} onClick={toggleWishlist}>{busy === 'wishlist' ? 'SAVING…' : '♡ WISHLIST'}</button>
      <button type="button" className="button secondary" disabled={busy !== null || unavailable} onClick={() => void addToBag(false)}>{busy === 'bag' ? 'ADDING…' : 'ADD TO BAG'}</button>
      <button type="button" className="button" disabled={busy !== null || unavailable} onClick={() => void addToBag(true)}>{busy === 'buy' ? 'OPENING…' : 'BUY NOW'}</button>
    </div>
    <p className="actionMessage" role="status" aria-live="polite">{message}</p>
  </>;
}
