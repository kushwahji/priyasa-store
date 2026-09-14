import http from 'node:http';

const port = Number(process.env.MOCK_CORE_PORT || 8787);
const product = { id: 1, slug: 'e2e-kurti', name: 'E2E Kurti', category: 'Kurtis', price: 1299, mrp: 1999, image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e5?w=800', images: ['https://images.unsplash.com/photo-1583391733956-6c78276477e5?w=800'], sizes: ['S', 'M', 'L'], colors: ['Pink'], rating: 4.7, reviewCount: 12 };

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload) });
  res.end(payload);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  if (url.pathname === '/api/v1/storefront/categories') return json(res, 200, { data: [{ id: 1, slug: 'kurtis', name: 'Kurtis' }, { id: 2, slug: 'dresses', name: 'Dresses' }] });
  if (url.pathname === '/api/v1/storefront/products' && req.method === 'GET') return json(res, 200, { data: { data: [product], meta: { total: 1, current_page: 1, last_page: 1, per_page: 24 } } });
  if (url.pathname === '/api/v1/storefront/products/e2e-kurti' && req.method === 'GET') return json(res, 200, { data: product });
  if (url.pathname.startsWith('/api/v1/storefront/products/') && url.pathname.endsWith('/reviews')) return json(res, 200, { data: { items: [] } });
  if (url.pathname === '/api/v1/auth/logout' && req.method === 'POST') return json(res, 200, { success: true });
  if (url.pathname === '/api/v1/auth/send-otp' && req.method === 'POST') return json(res, 200, { request_id: 'mock-request', success: true });
  if (url.pathname === '/api/v1/auth/verify-otp' && req.method === 'POST') return json(res, 200, { authenticated: true, token: 'mock-token' });
  return json(res, 404, { message: 'Mock endpoint not implemented' });
});

server.listen(port, '127.0.0.1', () => console.log(`Mock PriyasaCore listening on ${port}`));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));
