import {test,expect} from '@playwright/test';

const protectedRoutes=['/account','/orders','/addresses','/wishlist','/cart','/checkout'];
const hasE2EAuth=Boolean(process.env.E2E_PHONE&&process.env.E2E_OTP);

for(const route of protectedRoutes){
  test(`unauthenticated ${route} is guarded`,async({page})=>{
    await page.goto(route);
    await expect(page.getByRole('heading',{name:/sign in to continue/i})).toBeVisible();
    await expect(page.getByRole('link',{name:/sign in with otp/i})).toHaveAttribute('href',new RegExp(`next=${encodeURIComponent(route).replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&')}`));
  });
}

test('login page validates mobile input before calling API',async({page})=>{
  await page.goto('/auth/login?next=%2Forders');
  await page.getByLabel('Mobile number').fill('123');
  await page.getByRole('button',{name:'Send OTP'}).click();
  await expect(page.getByRole('alert')).toContainText('valid 10-digit');
});

test('public storefront navigation works',async({page})=>{
  await page.goto('/');
  await expect(page).toHaveTitle(/PRIYASA/i);
  await page.goto('/shop');
  await expect(page.getByRole('heading',{name:/all styles/i})).toBeVisible();
});

test.skip(!hasE2EAuth,'Set E2E_PHONE and E2E_OTP to run authenticated checkout/order smoke tests.',async({page})=>{
  const phone=process.env.E2E_PHONE!;const otp=process.env.E2E_OTP!;
  await page.goto('/cart');
  await page.getByRole('link',{name:/sign in with otp/i}).click();
  await page.getByLabel('Mobile number').fill(phone);
  await page.getByRole('button',{name:'Send OTP'}).click();
  await expect(page.getByLabel('OTP')).toBeVisible();
  await page.getByLabel('OTP').fill(otp);
  await page.getByRole('button',{name:/verify & continue/i}).click();
  await expect(page).toHaveURL(/\/cart$/);
  await page.reload();
  await expect(page).not.toHaveURL(/\/auth\/login/);
  await page.goto('/account');
  await expect(page.getByRole('heading')).toBeVisible();
  await page.goto('/orders');
  await expect(page.getByRole('heading',{name:/orders/i})).toBeVisible();
  await page.goto('/addresses');
  await expect(page.getByRole('heading',{name:/delivery addresses/i})).toBeVisible();
  await page.goto('/wishlist');
  await expect(page.getByRole('heading',{name:/wishlist/i})).toBeVisible();
});
