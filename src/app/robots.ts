import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_STORE_URL || 'http://localhost:3000';
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/account', '/orders', '/cart', '/checkout', '/addresses', '/api/'] }],
    sitemap: `${base.replace(/\/$/, '')}/sitemap.xml`,
  };
}
