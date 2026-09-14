import http from 'node:http';

const port = Number(process.env.MOCK_CORE_PORT || 8787);
const state = { otpRequestId: 'otp-test-1', accessToken: 'e2e-access-token', orderId: '1001' };

const json = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
};

const readBody = (req) => new Promise((resolve) => {
  let raw = '';
  req.on('data', (chunk) => { raw += chunk; });
  req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { resolve({}); } });
});

const products = [
  { id: 101, slug: 'e2e-kurti', name: 'PRIYASA Everyday Kurti', category: 'Kurtis', price: 999, mrp: 1999, image: '/placeholder-product.svg' },
  { id: 102, slug: 'e2e-dress', name: 'PRIYASA Edit Dress', category: 'Dresses', price: 1499, mrp: 2499, image: '/placeholder-product.svg' },
];

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const path = url.pathname.replace(/^\/api\/v1\/?/, '/');
  const body = await readBody(req);
  const authenticated = (req.headers.authorization || '').includes(state.accessToken);

  if (req.method === 'POST' && path === '/auth/send-otp') return json(res, 200, { success: true, data: { request_id: state.otpRequestId } });
  if (req.method === 'POST' && path === '/auth/resend-otp') return json(res, 200, { success: true, data: { request_id: state.otpRequestId } });
  if (req.method === 'POST' && path === '/auth/verify-otp') return json(res, 200, { success: true, data: { access_token: state.accessToken, token: state.accessToken } });
  if (req.method === 'POST' && ['/auth/logout', '/storefront/session/logout'].includes(path)) return json(res, 200, { success: true });
  if (path === '/storefront/session') return authenticated ? json(res, 200, { success: true, data: { authenticated: true } }) : json(res, 401, { success: false, message: 'Unauthenticated' });

  if (req.method === 'GET' && path === '/storefront/products') {
    const q = (url.searchParams.get('q') || '').toLowerCase();
    const category = (url.searchParams.get('category') || '').toLowerCase();
    const result = products.filter((p) => (!q || `${p.name} ${p.category}`.toLowerCase().includes(q)) && (!category || p.category.toLowerCase() === category || p.slug === category));
    return json(res, 200, { success: true, data: { products: result, categories: products.map((p) => ({ id: String(p.id), slug: p.category.toLowerCase(), name: p.category })) } });
  }
  if (req.method === 'GET' && path.startsWith('/storefront/products/')) {
    const slug = path.split('/').pop();
    const product = products.find((p) => p.slug === slug) || products[0];
    return json(res, 200, { success: true, data: { product, variants: [{ id: 1, sku: 'E2E-001', label: 'M', size: 'M', color: 'Pink', stock: 10, price: product.price }] } });
  }

  if (path === '/storefront/cart/experience') return authenticated ? json(res, 200, { success: true, data: { cart: { items: [], subtotal: 0, total: 0 } } }) : json(res, 401, { success: false, message: 'Unauthenticated' });
  if (path === '/storefront/checkout/quote') return authenticated ? json(res, 200, { success: true, data: { subtotal: Number(body.subtotal || 999), discount_total: 0, shipping_total: 0, grand_total: Number(body.subtotal || 999), currency: 'INR' } }) : json(res, 401, { success: false });
  if (path === '/storefront/checkout/place') return authenticated ? json(res, 200, { success: true, data: { order: { id: state.orderId, status: 'confirmed', grand_total: 999 } } }) : json(res, 401, { success: false });
  if (path === '/storefront/orders') return authenticated ? json(res, 200, { success: true, data: { orders: [] } }) : json(res, 401, { success: false });
  if (path.startsWith('/storefront/orders/')) return authenticated ? json(res, 200, { success: true, data: { order: { id: state.orderId, status: 'confirmed', items: [] } } }) : json(res, 401, { success: false });
  if (path === '/storefront/wishlist/items') return authenticated ? json(res, 200, { success: true, data: { items: [] } }) : json(res, 401, { success: false });
  if (path === '/storefront/notifications/unread') return authenticated ? json(res, 200, { success: true, data: { unread: 0 } }) : json(res, 401, { success: false });
  if (path === '/device/register' && req.method === 'POST') return json(res, 200, { success: true, data: { registered: true } });

  return json(res, 404, { success: false, message: `Mock Core route not implemented: ${req.method} ${path}` });
});

server.listen(port, '127.0.0.1', () => console.log(`Mock PriyasaCore listening on ${port}`));
