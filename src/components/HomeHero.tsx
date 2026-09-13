'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type HeroItem = { id?: string | number; image_url?: string; mobile_image_url?: string; eyebrow?: string; title?: string; subtitle?: string; cta?: { label?: string; href?: string } };

export default function HomeHero({ items, interval = 4500 }: { items: HeroItem[]; interval?: number }) {
  const [index, setIndex] = useState(0);
  useEffect(() => { if (items.length < 2) return; const timer = window.setInterval(() => setIndex(i => (i + 1) % items.length), Math.max(2500, interval)); return () => window.clearInterval(timer); }, [items.length, interval]);
  if (!items.length) return null;
  return <section className="hero homeDynamicHero"><div className="heroSlider" aria-roledescription="carousel" aria-label="PRIYASA featured collections">{items.map((item, i) => <article className={`heroSlide ${i === index ? 'isActive' : ''}`} key={item.id || i} aria-hidden={i !== index}><picture><source media="(max-width: 720px)" srcSet={item.mobile_image_url || item.image_url || ''}/>{item.image_url && <img src={item.image_url} alt={item.title || 'PRIYASA'} />}</picture><div className="heroCopy"><span className="eyebrow">{item.eyebrow || 'PRIYASA'}</span>{item.title && <h1>{item.title}</h1>}{item.subtitle && <p>{item.subtitle}</p>}{item.cta?.href && <div className="heroActions"><Link className="button" href={item.cta.href}>{item.cta.label || 'Shop Now'}</Link></div>}</div></article>)}</div>{items.length > 1 && <div className="heroDots" aria-label="Hero slides">{items.map((item, i) => <button type="button" key={item.id || i} aria-label={`Show slide ${i + 1}`} aria-current={i === index} onClick={() => setIndex(i)}>{i + 1}</button>)}</div>}</section>;
}
