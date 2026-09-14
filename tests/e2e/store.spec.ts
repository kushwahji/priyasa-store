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
  const searchInput = page.locator('input[aria-label="Search products"]').first();
  await expect(searchInput).toBeVisible();
  await searchInput.fill('kurti');
  await expect(searchInput).toHaveValue('kurti');
});
