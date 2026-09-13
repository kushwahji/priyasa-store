import { test, expect } from '@playwright/test';

test('home and core commerce navigation render on desktop and mobile', async ({ page }) => {
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

test('protected account route requires a valid same-origin session', async ({ page }) => {
  await page.route('**/api/session', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ authenticated: false }) });
  });
  await page.goto('/account');
  await expect(page.getByRole('heading', { name: /sign in to continue/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /sign in with otp/i })).toHaveAttribute('href', /\/auth\/login\?next=/);
});

test('authenticated account route trusts the same-origin session API', async ({ page }) => {
  await page.route('**/api/session', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ authenticated: true }) });
  });
  await page.goto('/account');
  await expect(page.getByRole('heading', { name: /my account/i })).toBeVisible();
});
