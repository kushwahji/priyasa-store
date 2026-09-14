import Link from 'next/link';

type Product = { id?: string|number; slug?: string; name: string; category?: string; price?: number; mrp?: number; image?: string };

export default function ProductCard({ product }: { product: Product }) {
  const price = Number(product.price || 0);
  const mrp = Number(product.mrp || 0);
  const discount = mrp > price ? Math.round((1 - price / mrp) * 100) : 0;
  return <Link className="productCard" href={`/product/${product.slug || product.id || ''}`}>
    <div className="productImage">{product.image ? <img src={product.image} alt={product.name} loading="lazy" /> : null}{discount > 0 && <span className="productBadge">{discount}% OFF</span>}<button className="heart" aria-label={`Wishlist ${product.name}`} onClick={e => e.preventDefault()}>♡</button></div>
    <div className="productInfo"><strong>{product.name}</strong><small>{product.category || 'PRIYASA'}</small><div className="price">₹{price.toLocaleString('en-IN')} {mrp > price && <del>₹{mrp.toLocaleString('en-IN')}</del>}</div></div>
  </Link>;
}
