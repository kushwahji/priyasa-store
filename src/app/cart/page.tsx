'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Item = {
  id: string | number;
  name?: string;
  product_name?: string;
  quantity: number;
  price?: number;
  unit_price?: number;
  image?: string;
  size?: string;
  variant_label?: string;
  product?: any;
};

type CartData = {
  items?: Item[];
  subtotal?: number;
  discount_total?: number;
  shipping_total?: number;
  total?: number;
  grand_total?: number;
  currency?: string;
};

function normalize(r: any): CartData {
  const value = r?.data?.cart ?? r?.data ?? r?.cart ?? r ?? {};
  return {
    ...value,
    items: value.items || value.line_items || [],
    subtotal: Number(value.subtotal ?? 0),
    discount_total: Number(value.discount_total ?? value.discount ?? 0),
    shipping_total: Number(value.shipping_total ?? value.shipping ?? 0),
    total: Number(value.total ?? value.grand_total ?? 0),
  };
}

export default function Cart() {
  const [cart, setCart] = useState<CartData>({ items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setCart(normalize(await api<any>('/storefront/cart')));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load your bag.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function update(id: string | number, quantity: number) {
    if (quantity < 1) return;
    setBusy(id);
    try {
      await api(`/storefront/cart/items/${encodeURIComponent(String(id))}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to update your bag.');
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string | number) {
    setBusy(id);
    try {
      await api(`/storefront/cart/items/${encodeURIComponent(String(id))}`, {
        method: 'DELETE',
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to remove this item.');
    } finally {
      setBusy(null);
    }
  }

  const items = cart.items || [];
  const subtotal = Number(cart.subtotal || 0);
  const discount = Number(cart.discount_total || 0);
  const shipping = Number(cart.shipping_total || 0);
  const total = Number(
    cart.total ?? cart.grand_total ?? subtotal - discount + shipping,
  );

  return (
    <main className="cartPage">
      <div className="sectionHead">
        <div>
          <span className="eyebrow">PRIYASA / YOUR BAG</span>
          <h1>Shopping bag</h1>
          <p className="muted">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </p>
        </div>
        <Link className="textLink" href="/shop">
          Continue shopping →
        </Link>
      </div>

      {error && (
        <div className="formError" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="emptyState">
          <h2>Loading your bag…</h2>
        </div>
      ) : !items.length ? (
        <div className="emptyState">
          <h2>Your bag is empty</h2>
          <p>Discover styles you&apos;ll love.</p>
          <Link className="button" href="/shop">
            Shop now
          </Link>
        </div>
      ) : (
        <div className="cartLayout">
          <section className="cartItems">
            {items.map((item) => {
              const name =
                item.name ||
                item.product_name ||
                item.product?.name ||
                'PRIYASA product';
              const price = Number(
                item.price ?? item.unit_price ?? item.product?.price ?? 0,
              );
              const image =
                item.image ||
                item.product?.image ||
                item.product?.media?.[0]?.url;

              return (
                <article className="cartItem" key={String(item.id)}>
                  <div className="cartThumb">
                    {image && <img src={image} alt="" />}
                  </div>
                  <div className="cartItemInfo">
                    <strong>{name}</strong>
                    <small>{item.variant_label || item.size || 'Standard'}</small>
                    <b>₹{price.toLocaleString('en-IN')}</b>
                    <div className="qty">
                      <button
                        type="button"
                        aria-label={`Decrease ${name}`}
                        disabled={busy === item.id || item.quantity <= 1}
                        onClick={() => void update(item.id, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        aria-label={`Increase ${name}`}
                        disabled={busy === item.id}
                        onClick={() => void update(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      className="textButton"
                      disabled={busy === item.id}
                      onClick={() => void remove(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </article>
              );
            })}
          </section>

          <aside className="summary">
            <span className="eyebrow">PRICE DETAILS</span>
            <div>
              <span>Subtotal</span>
              <b>₹{subtotal.toLocaleString('en-IN')}</b>
            </div>
            {discount > 0 && (
              <div>
                <span>Discount</span>
                <b>-₹{discount.toLocaleString('en-IN')}</b>
              </div>
            )}
            <div>
              <span>Shipping</span>
              <b>{shipping === 0 ? 'FREE' : `₹${shipping.toLocaleString('en-IN')}`}</b>
            </div>
            <hr />
            <div>
              <strong>Total</strong>
              <strong>₹{total.toLocaleString('en-IN')}</strong>
            </div>
            <Link className="button" href="/checkout">
              Proceed to checkout
            </Link>
          </aside>
        </div>
      )}
    </main>
  );
}
