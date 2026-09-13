import { test, expect, type Page, type Route } from '@playwright/test';

async function mockSession(page: Page) {
  await page.route('**/api/session', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ authenticated: true }) });
  });
}

test('home and core commerce navigation render', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/PRIYASA/);
  await expect(page.getByRole('link', { name: /shop new arrivals/i })).toBeVisible();
  await page.getByRole('link', { name: /shop new arrivals/i }).click();
  await expect(page).toHaveURL(/\/shop/);
  await expect(page.getByRole('heading', { name: /all styles/i })).toBeVisible();
});

test('search route is usable', async ({ page }) => {
  await page.goto('/search');
  await expect(page.getByRole('heading', { name: /find your next priyasa edit/i })).toBeVisible();
  await page.getByLabel('Search products').fill('kurti');
  await expect(page.getByLabel('Search products')).toHaveValue('kurti');
});

test('protected account route requires a same-origin session', async ({ page }) => {
  await page.route('**/api/session', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ authenticated: false }) });
  });
  await page.goto('/account');
  await expect(page.getByRole('heading', { name: /sign in to continue/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /sign in with otp/i })).toHaveAttribute('href', /\/auth\/login\?next=/);
});

test('authenticated account route renders behind the same-origin session guard', async ({ page }) => {
  await mockSession(page);
  await page.goto('/account');
  await expect(page.getByRole('heading', { name: /my account/i })).toBeVisible();
});

test('OTP login validates mobile, requests OTP and verifies before redirect', async ({ page }) => {
  await page.route('**/api/priyasa/auth/send-otp', async route => {
    expect(route.request().method()).toBe('POST');
    const body = route.request().postDataJSON();
    expect(body.mobile).toBe('9876543210');
    expect(body.channel).toBe('auto');
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ request_id: 'e2e-request', success: true }) });
  });
  await page.route('**/api/priyasa/auth/verify-otp', async route => {
    expect(route.request().method()).toBe('POST');
    const body = route.request().postDataJSON();
    expect(body.request_id).toBe('e2e-request');
    expect(body.otp).toBe('123456');
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ authenticated: true, token: 'e2e-token' }) });
  });
  await page.goto('/auth/login?next=/account');
  await page.getByLabel('Mobile number').fill('9876543210');
  await page.getByRole('button', { name: /send otp/i }).click();
  await expect(page.getByRole('heading', { name: /verify your otp/i })).toBeVisible();
  await page.getByLabel('OTP').fill('123456');
  await page.getByRole('button', { name: /verify & continue/i }).click();
  await expect(page).toHaveURL(/\/account$/);
});

test('expired protected API session redirects to login', async ({ page }) => {
  await mockSession(page);
  await page.route('**/api/priyasa/storefront/orders', async route => {
    await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Unauthenticated' }) });
  });
  await page.goto('/orders');
  await expect(page).toHaveURL(/\/auth\/login\?next=%2Forders/);
  await expect(page.getByRole('heading', { name: /sign in to priyasa/i })).toBeVisible();
});

test('sign out calls documented auth logout and returns to storefront', async ({ page }) => {
  await mockSession(page);
  let logoutCalled = false;
  await page.route('**/api/priyasa/auth/logout', async route => {
    logoutCalled = true;
    expect(route.request().method()).toBe('POST');
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
  });
  await page.goto('/account');
  await expect(page.getByRole('heading', { name: /my account/i })).toBeVisible();
  await page.getByRole('button', { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/$/);
  expect(logoutCalled).toBe(true);
});

test('authenticated bag flows through documented checkout create-order contract', async ({ page }) => {
  await mockSession(page);
  await page.route('**/api/priyasa/storefront/cart', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { items: [{ id: 'cart-1', variant_id: 1, name: 'E2E Kurti', quantity: 1, unit_price: 1299, line_total: 1299, available_quantity: 5 }], subtotal: 1299, discount: 0, total: 1299 } }) });
  });
  await page.route('**/api/priyasa/storefront/addresses', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [{ id: 1, recipient_name: 'PRIYASA E2E', address_line1: '1 Test Street', city: 'Noida', state: 'Uttar Pradesh', postal_code: '201301', is_default: true }] }) });
  });
  await page.route('**/api/priyasa/storefront/checkout/create-order', async route => {
    expect(route.request().method()).toBe('POST');
    const body = route.request().postDataJSON();
    expect(body.shipping_address_id).toBe(1);
    expect(body.payment_method).toBe('razorpay');
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ data: { id: 'order-e2e' } }) });
  });
  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: /shopping bag/i })).toBeVisible();
  await expect(page.getByText('E2E Kurti')).toBeVisible();
  await page.getByRole('link', { name: /proceed to checkout/i }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByRole('heading', { name: /secure checkout/i })).toBeVisible();
  await page.getByRole('button', { name: /continue to payment/i }).click();
  await expect(page).toHaveURL(/\/checkout\/payment\?order=order-e2e/);
});
