'use client';

import { useState } from 'react';

export default function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  if (!images.length) return <div className="pdpGallery"><div className="pdpMainImage"><span>No image available</span></div></div>;
  const index = Math.min(active, images.length - 1);
  return <div className="pdpGallery"><div className="pdpMainImage"><img src={images[index]} alt={`${name} view ${index + 1}`} /></div><div className="pdpThumbs" role="list" aria-label={`${name} images`}>{images.slice(0, 8).map((src, i) => <button type="button" role="listitem" key={`${src}-${i}`} className={`pdpThumb ${i === index ? 'selected' : ''}`} aria-label={`View image ${i + 1}`} aria-pressed={i === index} onClick={() => setActive(i)}><img src={src} alt="" /></button>)}</div>{images.length > 1 && <div className="pdpGalleryNav"><button type="button" disabled={index === 0} onClick={() => setActive(i => Math.max(0, i - 1))} aria-label="Previous product image">←</button><span>{index + 1} / {images.length}</span><button type="button" disabled={index === images.length - 1} onClick={() => setActive(i => Math.min(images.length - 1, i + 1))} aria-label="Next product image">→</button></div>}</div>;
}
