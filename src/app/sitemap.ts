import type { MetadataRoute } from 'next';
export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_STORE_URL || 'http://localhost:3000').replace(/\/$/, ''); const now = new Date();
  const pages = ['','/shop','/search','/about','/contact','/faq','/shipping','/return-policy','/refund-policy','/terms','/terms-conditions','/privacy','/privacy-policy'];
  return pages.map((path, index) => ({ url: `${base}${path}`, lastModified: now, changeFrequency: path === '/search' ? 'daily' : 'weekly', priority: index === 0 ? 1 : path === '/shop' ? .9 : .6 }));
}
