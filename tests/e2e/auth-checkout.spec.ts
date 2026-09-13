import { test, expect } from '@playwright/test';

test('authenticated customer can reach secure checkout and payment', async ({ page }) => {
  await page.route('**/api/session', async route => { await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ authenticated: true }) }); });
  await page.route('**/api/priyasa/storefront/checkout/addresses', async route => { await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [{ id: 1, name: 'Test Customer', address_line1: 'Test Street', city: 'Noida', state: 'Uttar Pradesh', pincode: '201301', is_default: true }] }) }); });
  await page.route('**/api/priyasa/storefront/checkout/transaction/quote', async route => { await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { subtotal: 1299, discount: 0, shipping_charge: 0, grand_total: 1299, delivery: { serviceable: true, cod: { eligible: true } } } }) }); });
  await page.route('**/api/priyasa/storefront/checkout/transaction/place', async route => { await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ data: { id: 'order-e2e' } }) }); });
  await page.route('**/api/priyasa/storefront/orders/order-e2e/payment', async route => { await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { razorpay_order_id: 'rzp-order-e2e', key_id: 'rzp_test_e2e', amount: 129900, currency: 'INR' } }) }); });

  await page.goto('/checkout');
  await expect(page.getByRole('heading', { name: /secure checkout/i })).toBeVisible();
  await page.getByRole('button', { name: /continue to payment/i }).click();
  await expect(page).toHaveURL(/\/checkout\/payment\?order=order-e2e/);
  await expect(page.getByRole('heading', { name: /secure payment/i })).toBeVisible();
  await expect(page.getByText(/₹1,299/)).toBeVisible();
});
