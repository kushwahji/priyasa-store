import { test, expect } from '@playwright/test';

const protectedRoutes = [
  '/account',
  '/orders',
  '/addresses',
  '/wishlist',
  '/cart',
  '/checkout',
  '/checkout/payment?order=test',
  '/checkout/payment/return?order=test',
  '/orders/test',
  '/orders/test/invoice',
];

for (const route of protectedRoutes) {
  test(`unauthenticated ${route.split('?')[0]} is guarded`, async ({ page }) => {
    await page.goto(route);
    await expect(
      page.getByRole('heading', { name: /sign in to continue/i }),
    ).toBeVisible();

    const href = await page
      .getByRole('link', { name: /sign in with otp/i })
      .getAttribute('href');

    expect(href).toContain('next=');
    expect(decodeURIComponent(href || '')).toContain(route);
  });
}

test('login validates mobile input before calling API', async ({ page }) => {
  await page.goto('/auth/login?next=%2Forders');
  await page.getByLabel('Mobile number').fill('123');
  await page.getByRole('button', { name: 'Send OTP' }).click();
  await expect(page.getByRole('alert')).toContainText('valid 10-digit');
});

test('public storefront navigation works', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/PRIYASA/i);
  await page.goto('/shop');
  await expect(page.getByRole('heading', { name: /all styles/i })).toBeVisible();
});

test('authenticated smoke flow', async ({ page }) => {
  test.skip(
    !process.env.E2E_PHONE || !process.env.E2E_OTP,
    'Set E2E_PHONE and E2E_OTP to run authenticated smoke tests.',
  );

  const phone = process.env.E2E_PHONE!;
  const otp = process.env.E2E_OTP!;

  await page.goto('/cart');
  await page.getByRole('link', { name: /sign in with otp/i }).click();
  await page.getByLabel('Mobile number').fill(phone);
  await page.getByRole('button', { name: 'Send OTP' }).click();
  await expect(page.getByLabel('OTP')).toBeVisible();
  await page.getByLabel('OTP').fill(otp);
  await page.getByRole('button', { name: /verify & continue/i }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await page.reload();
  await expect(page).not.toHaveURL(/\/auth\/login/);

  for (const route of ['/account', '/orders', '/addresses', '/wishlist', '/cart', '/checkout']) {
    await page.goto(route);
    await expect(page.getByRole('heading')).toBeVisible();
  }
});
