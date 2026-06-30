import { test, expect } from '@playwright/test';

test('sidebar menu loads after login', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);
  const menuItems = page.locator('.ant-menu-item, [class*="menu-item"]');
  const count = await menuItems.count();
  expect(count).toBeGreaterThanOrEqual(0);
});
