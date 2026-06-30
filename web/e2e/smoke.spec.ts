import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#root')).toBeVisible();
});

test('login page shows form', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);
  const usernameInput = page.locator('input[id="username"], input[placeholder*="用户"], input[placeholder*="账号"]');
  const passwordInput = page.locator('input[type="password"]');
  const hasLoginForm = (await usernameInput.count() + await passwordInput.count()) > 0;
  expect(hasLoginForm).toBe(true);
});
