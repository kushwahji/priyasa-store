import { test, expect } from '@playwright/test';

const protectedPaths = ['/account', '/orders', '/addresses', '/wishlist', '/cart', '/checkout'];

test('protected routes preserve the intended destination when unauthenticated', async ({ page }) => {
  await page.route('**/api/session', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ authenticated: false }) });
  });

  for (const path of protectedPaths) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: /sign in to continue/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign in with otp/i })).toHaveAttribute('href', new RegExp(`next=${encodeURIComponent(path).replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}`));
  }
});

test('authenticated session survives navigation and refresh without client access-token storage', async ({ page }) => {
  let sessionChecks = 0;
  await page.route('**/api/session', async route => {
    sessionChecks += 1;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ authenticated: true, data: { user: { id: 42 } } }) });
  });
  await page.route('**/api/priyasa/storefront/orders?page=1&per_page=20', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { data: [], current_page: 1, last_page: 1, total: 0 } }) });
  });

  await page.goto('/account');
  await expect(page.getByRole('heading', { name: /my account/i })).toBeVisible();
  await page.getByRole('link', { name: /my orders/i }).click();
  await expect(page.getByRole('heading', { name: /^orders$/i })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: /^orders$/i })).toBeVisible();
  expect(sessionChecks).toBeGreaterThanOrEqual(2);
});

test('session outage does not turn into a sign-in redirect', async ({ page }) => {
  await page.route('**/api/session', async route => {
    await route.fulfill({ status: 502, contentType: 'application/json', body: JSON.stringify({ authenticated: false, message: 'Unable to reach PriyasaCore.' }) });
  });
  await page.goto('/account');
  await expect(page.getByRole('heading', { name: /session check unavailable/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /try again/i })).toBeVisible();
  await expect(page).toHaveURL(/\/account$/);
});

test('successful logout clears the browser session and protected navigation requires sign-in', async ({ page }) => {
  let authenticated = true;
  await page.route('**/api/session', async route => {
    await route.fulfill({ status: authenticated ? 200 : 200, contentType: 'application/json', body: JSON.stringify({ authenticated }) });
  });
  await page.route('**/api/priyasa/storefront/session/logout', async route => {
    authenticated = false;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
  });

  await page.goto('/account');
  await expect(page.getByRole('heading', { name: /my account/i })).toBeVisible();
  await page.getByRole('button', { name: /sign out/i }).click();
  await expect(page).toHaveURL('/');
  await page.goto('/orders');
  await expect(page.getByRole('heading', { name: /sign in to continue/i })).toBeVisible();
});
