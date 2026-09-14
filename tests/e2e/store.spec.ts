import { test, expect, type Page } from '@playwright/test';

async function requireSession(page: Page) {
  const token = process.env.PRIYASA_E2E_ACCESS_TOKEN;
  test.skip(!token, 'Set PRIYASA_E2E_ACCESS_TOKEN for authenticated E2E journeys.');
  const url = new URL(process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000');
  await page.context().addCookies([{ name: 'priyasa_session', value: token!, domain: url.hostname, path: '/', secure: url.protocol === 'https:', httpOnly: true, sameSite: 'Lax' }]);
}

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

  test('authenticated checkout loads saved addresses through the documented contract', async ({ page }) => {
    await requireSession(page);
    const addresses = page.waitForResponse(r => r.url().includes('/api/priyasa/storefront/addresses') && r.request().method() === 'GET');
    await page.goto('/checkout');
    const response = await addresses;
    expect(response.status()).toBeLessThan(500);
    await expect(page.getByText('Delivery address')).toBeVisible();
  });

  test('checkout coupon validation uses the documented contract', async ({ page }) => {
    await requireSession(page);
    await page.goto('/checkout');
    await expect(page.getByText('Offers & coupon')).toBeVisible();
    const validation = page.waitForResponse(r => r.url().includes('/api/priyasa/storefront/checkout/validate') && r.request().method() === 'POST');
    await page.getByLabel('Coupon code').fill('');
    await page.getByRole('button', { name: 'Apply' }).click();
    const response = await validation;
    expect(response.status()).toBeLessThan(500);
  });

  test('payment page checks authoritative Core payment state first', async ({ page }) => {
    await requireSession(page);
    const orderId = process.env.PRIYASA_E2E_PAYMENT_ORDER_ID;
    test.skip(!orderId, 'Set PRIYASA_E2E_PAYMENT_ORDER_ID to exercise a real unpaid Razorpay order.');
    const status = page.waitForResponse(r => r.url().includes(`/api/priyasa/storefront/orders/${orderId}`) && r.request().method() === 'GET');
    await page.goto(`/checkout/payment?order=${encodeURIComponent(orderId!)}`);
    const response = await status;
    expect(response.status()).toBeLessThan(500);
  });

  test('OTP login flow establishes the BFF session', async ({ page }) => {
    test.skip(!process.env.PRIYASA_E2E_MOBILE || !process.env.PRIYASA_E2E_OTP, 'Set PRIYASA_E2E_MOBILE and PRIYASA_E2E_OTP for a real deployed OTP journey.');
    await page.goto('/auth/login?next=/account');
    await page.getByLabel('Mobile number').fill(process.env.PRIYASA_E2E_MOBILE!);
    await page.getByRole('button', { name: 'Send OTP' }).click();
    await expect(page.getByLabel('OTP')).toBeVisible();
    await page.getByLabel('OTP').fill(process.env.PRIYASA_E2E_OTP!);
    await page.getByRole('button', { name: 'Verify & continue' }).click();
    await expect(page).toHaveURL(/\/account/);
    const cookies = await page.context().cookies();
    expect(cookies.find(c => c.name === 'priyasa_session')?.httpOnly).toBeTruthy();
  });

  test('guest protected route returns to login', async ({ page }) => {
    await page.goto('/cart');
    await expect(page).toHaveURL(/\/auth\/login\?next=/);
  });
});
