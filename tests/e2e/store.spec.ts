import { test, expect } from '@playwright/test';

test.describe('PRIYASA storefront smoke', () => {
  test('home is CMS-driven and responsive', async ({ page }) => {
    const home = page.waitForResponse(r => r.url().includes('/api/priyasa/storefront/home') && r.request().method() === 'GET');
    await page.goto('/');
    await expect(page).toHaveTitle(/PRIYASA/);
    await home;
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('catalog and PDP are usable', async ({ page }) => {
    await page.goto('/shop');
    await expect(page.locator('.productCard').first()).toBeVisible();
    await page.locator('.productCard').first().click();
    await expect(page).toHaveURL(/\/product\//);
    await expect(page.locator('.pdpInfo h1')).toBeVisible();
  });

  test('header search works', async ({ page }) => {
    await page.goto('/');
    const search = page.locator('header input[aria-label="Search products"]').first();
    await search.fill('kurti');
    await search.press('Enter');
    await expect(page).toHaveURL(/\/search\?q=kurti/);
  });

  test('mobile drawer and bottom navigation work', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(page.locator('.mobileMenu')).toBeVisible();
    await page.getByRole('link', { name: 'NEW IN' }).first().click();
    await expect(page).toHaveURL(/\/shop\?sort=newest/);
    await expect(page.locator('.bottomNav')).toBeVisible();
  });

  test('checkout uses Core contract and supports COD', async ({ page }) => {
    await page.route('**/api/session', async route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ authenticated: true }) }));
    await page.goto('/checkout');
    await expect(page.getByText('Delivery address')).toBeVisible();
    await expect(page.getByText('Cash on Delivery')).toBeVisible();
    await page.getByRole('button', { name: /Cash on Delivery/ }).click();
    const createOrder = page.waitForResponse(r => r.url().includes('/api/priyasa/storefront/checkout/create-order') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Place COD order' }).click();
    const response = await createOrder;
    expect(response.ok()).toBeTruthy();
    await expect(page).toHaveURL(/\/orders\/1001/);
  });

  test('checkout coupon is validated by Core', async ({ page }) => {
    await page.route('**/api/session', async route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ authenticated: true }) }));
    await page.goto('/checkout');
    const validate = page.waitForResponse(r => r.url().includes('/api/priyasa/storefront/checkout/validate') && r.request().method() === 'POST');
    await page.getByLabel('Coupon code').fill('SAVE100');
    await page.getByRole('button', { name: 'Apply' }).click();
    const response = await validate;
    expect(response.ok()).toBeTruthy();
    await expect(page.getByRole('status')).toContainText('Coupon checked');
  });

  test('OTP login flow establishes the session', async ({ page }) => {
    test.skip(!process.env.PRIYASA_E2E_MOBILE || !process.env.PRIYASA_E2E_OTP, 'Set PRIYASA_E2E_MOBILE and PRIYASA_E2E_OTP for a real deployed OTP journey.');
    await page.goto('/auth/login?next=/account');
    await page.getByLabel('Mobile number').fill(process.env.PRIYASA_E2E_MOBILE!);
    await page.getByRole('button', { name: 'Send OTP' }).click();
    await expect(page.getByLabel('OTP')).toBeVisible();
    await page.getByLabel('OTP').fill(process.env.PRIYASA_E2E_OTP!);
    await page.getByRole('button', { name: 'Verify & continue' }).click();
    await expect(page).toHaveURL(/\/account/);
  });

  test('guest protected route returns to login', async ({ page }) => {
    await page.goto('/cart');
    await expect(page).toHaveURL(/\/auth\/login\?next=/);
  });
});