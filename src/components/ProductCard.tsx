'use client';

import Link from 'next/link';
import { useState, type MouseEvent } from 'react';
import { api } from '@/lib/api';

type Product = Record<string, any>;

export default function ProductCard({ product }: { product: Product }) {
  const pricing = product.pricing || {};
  const price = Number(pricing.selling_price ?? product.price ?? 0);
  const mrp = Number(pricing.mrp ?? product.mrp ?? 0);
  const discount = Number(pricing.discount_percent) || (mrp > price ? Math.round((1 - price / mrp) * 100) : 0);
  const media = Array.isArray(product.media) ? product.media : [];
  const image = media[0]?.url ?? media[0] ?? product.image;
  const category = typeof product.category === 'object' ? product.category?.name : product.category;
  const key = product.id ?? product.slug ?? '';
  const variantId = product.variant_id ?? product.variants?.[0]?.id ?? '';
  const rating = Number(product.rating?.average ?? product.rating ?? 0);
  const reviewCount = Number(product.rating?.count ?? product.reviewCount ?? 0);
  const [wishlisted, setWishlisted] = useState(Boolean(product.is_wishlisted ?? product.wishlisted));
  const [saving, setSaving] = useState(false);
  const [wishError, setWishError] = useState('');
  const storeUrl = process.env.NEXT_PUBLIC_STORE_URL || '';
  const shareUrl = storeUrl ? `${storeUrl}/product/${encodeURIComponent(String(key))}` : '';
  const whatsapp = `https://wa.me/918104132334?text=${encodeURIComponent(`Hi PRIYASA, I want to order this product.\nProduct: ${product.name}\nPrice: ₹${price.toLocaleString('en-IN')}\n${mrp > price ? `MRP: ₹${mrp.toLocaleString('en-IN')}` : ''}${shareUrl ? `\nLink: ${shareUrl}` : ''}`)}`;

  async function toggleWishlist(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!variantId || saving) return;
    setSaving(true);
    setWishError('');
    try {
      await api('/storefront/wishlist/toggle', { method: 'POST', body: JSON.stringify({ variant_id: variantId }) });
      setWishlisted((value) => !value);
    } catch (error) {
      if (error instanceof Error && /401|unauthorized|authentication/i.test(error.message)) window.location.assign('/auth/login');
      else setWishError(error instanceof Error ? error.message : 'Unable to update wishlist');
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="productCard">
      <div className="productImageWrap">
        <Link href={`/product/${encodeURIComponent(String(key))}`} className="productCardLink">
          <div className="productImage">
            {image ? <img src={image} alt={product.name} loading="lazy" /> : <div className="productImagePlaceholder">PRIYASA</div>}
            {discount > 0 && <span className="productBadge">{discount}% OFF</span>}
          </div>
        </Link>
        <button type="button" className={`productHeart${wishlisted ? ' isWishlisted' : ''}`} onClick={toggleWishlist} aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`} aria-pressed={wishlisted} disabled={saving}>{wishlisted ? '♥' : '♡'}</button>
        {(saving || wishError) && <span className="productQuickLabel">{saving ? 'Saving…' : wishError}</span>}
      </div>
      <Link href={`/product/${encodeURIComponent(String(key))}`} className="productCardLink">
        <div className="productInfo">
          <strong>{product.brand || 'PRIYASA'}</strong>
          <span className="productName">{product.name}</span>
          <small>{category || 'Fashion & lifestyle'}</small>
          <div className="price">₹{price.toLocaleString('en-IN')} {mrp > price && <del>₹{mrp.toLocaleString('en-IN')}</del>}{discount > 0 && <em>{discount}% OFF</em>}</div>
          {rating > 0 && <div className="productRating"><span>★ {rating.toFixed(1)}</span>{reviewCount > 0 && <small> · {reviewCount}</small>}</div>}
        </div>
      </Link>
      <a className="productWhatsapp" href={whatsapp} target="_blank" rel="noreferrer" aria-label={`Order ${product.name} on WhatsApp`}>💬 WhatsApp</a>
    </article>
  );
}
