'use client';

import { useMemo, useState } from 'react';
import { api } from '@/lib/api';

type Variant = {
  id: string | number;
  size?: string;
  color?: string;
  inventory?: { available?: number; in_stock?: boolean };
};

type Props = {
  variantId: string | number;
  sizes?: string[];
  colors?: string[];
  variants?: Variant[];
};

export default function ProductActions({
  variantId,
  sizes = [],
  colors = [],
  variants = [],
}: Props) {
  const [size, setSize] = useState(sizes[0] || '');
  const [color, setColor] = useState(colors[0] || '');
  const [busy, setBusy] = useState<'bag' | 'buy' | 'wishlist' | null>(null);
  const [message, setMessage] = useState('');

  const selectedVariant = useMemo(() => {
    if (!variants.length) return variantId;

    const exact = variants.find(
      (v) => (!size || (v.size || '') === size) && (!color || (v.color || '') === color),
    );

    return (
      exact ||
      variants.find((v) => !size || (v.size || '') === size) ||
      variants.find((v) => !color || (v.color || '') === color) ||
      variants[0]
    )?.id || '';
  }, [variants, variantId, size, color]);

  const selected = variants.find((v) => String(v.id) === String(selectedVariant));
  const available = selected ? Number(selected.inventory?.available ?? 0) : 0;
  const unavailable = !selectedVariant || (Boolean(selected) && available <= 0);

  async function addToBag(redirect = false) {
    if (!selectedVariant) return setMessage('This product variant is unavailable.');
    if (sizes.length && !size) return setMessage('Please select a size.');
    if (colors.length && !color) return setMessage('Please select a colour.');
    if (unavailable) return setMessage('This selected variant is out of stock.');

    setBusy(redirect ? 'buy' : 'bag');
    setMessage('');

    try {
      await api('/storefront/cart/items', {
        method: 'POST',
        body: JSON.stringify({ variant_id: selectedVariant, quantity: 1 }),
      });
      if (redirect) window.location.assign('/checkout');
      else setMessage('Added to bag.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to add this item.');
    } finally {
      setBusy(null);
    }
  }

  async function toggleWishlist() {
    if (!selectedVariant) return setMessage('This product variant is unavailable.');

    setBusy('wishlist');
    setMessage('');

    try {
      await api('/storefront/wishlist/toggle', {
        method: 'POST',
        body: JSON.stringify({ variant_id: selectedVariant }),
      });
      setMessage('Wishlist updated.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to update wishlist.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      {sizes.length > 0 && (
        <div className="variantBlock">
          <strong>Select size</strong>
          <div className="variantRow">
            {sizes.map((value) => (
              <button
                type="button"
                key={value}
                className={size === value ? 'selected' : ''}
                aria-pressed={size === value}
                onClick={() => setSize(value)}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      )}

      {colors.length > 0 && (
        <div className="variantBlock">
          <strong>Select colour</strong>
          <div className="variantRow">
            {colors.map((value) => (
              <button
                type="button"
                key={value}
                className={color === value ? 'selected' : ''}
                aria-pressed={color === value}
                onClick={() => setColor(value)}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <div className="selectedVariant" aria-live="polite">
          <span>
            {selected.size || ''}
            {selected.color ? ` · ${selected.color}` : ''}
          </span>
          <b>
            {available <= 0
              ? 'Out of stock'
              : available <= 5
                ? `Only ${available} left`
                : 'In stock'}
          </b>
        </div>
      )}

      <div className="pdpActions">
        <button
          type="button"
          className="button secondary"
          disabled={busy !== null || !selectedVariant}
          onClick={() => void toggleWishlist()}
        >
          {busy === 'wishlist' ? 'SAVING…' : '♡ WISHLIST'}
        </button>
        <button
          type="button"
          className="button secondary"
          disabled={busy !== null || unavailable}
          onClick={() => void addToBag(false)}
        >
          {busy === 'bag' ? 'ADDING…' : 'ADD TO BAG'}
        </button>
        <button
          type="button"
          className="button"
          disabled={busy !== null || unavailable}
          onClick={() => void addToBag(true)}
        >
          {busy === 'buy' ? 'OPENING…' : 'BUY NOW'}
        </button>
      </div>

      <p className="actionMessage" role="status" aria-live="polite">
        {message}
      </p>
    </>
  );
}
