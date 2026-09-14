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
    const search = page.locator('header input[aria-label="Search products"]');
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
