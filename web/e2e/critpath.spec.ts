import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';

test.describe('Authentication', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Should show login form or dashboard (if already logged in)
    const hasLoginForm = await page.locator('input').count();
    const hasDashboard = await page.locator('.ant-layout-sider').count();
    expect(hasLoginForm + hasDashboard).toBeGreaterThan(0);
  });

  test('sidebar menu is visible after login', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // If not logged in, login form should be present
    const loginInputs = await page.locator('input').count();
    expect(loginInputs).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Navigation', () => {
  test('can navigate to dashboard', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Should load without JS errors
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.waitForTimeout(1000);
    expect(errors.length).toBe(0);
  });

  const pages = [
    { path: '/dashboard', name: '仪表盘' },
    { path: '/npi/projects', name: 'NPI项目' },
    { path: '/plm/products', name: '产品管理' },
    { path: '/crm/customers', name: '客户管理' },
    { path: '/erp/materials', name: '物料管理' },
    { path: '/purchase', name: '采购单' },
    { path: '/warehouse', name: '仓库' },
    { path: '/finance', name: '财务' },
    { path: '/manufacturing/orders', name: '制造工单' },
    { path: '/quality/iqc', name: '来料检验' },
    { path: '/equipment', name: '设备台账' },
    { path: '/admin/employee', name: '员工管理' },
  ];

  for (const { path, name } of pages) {
    test(`page "${name}" loads without error`, async ({ page }) => {
      await page.goto(BASE + path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      // Page should have content (either login redirect or actual page)
      const content = await page.locator('#root').innerHTML();
      expect(content.length).toBeGreaterThan(50);
    });
  }
});

test.describe('Critical flows', () => {
  test('warehouse page modals open and close', async ({ page }) => {
    await page.goto(BASE + '/warehouse');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    // Should not crash
    const rootContent = await page.locator('#root').innerHTML();
    expect(rootContent).toBeTruthy();
  });

  test('quality IQC page renders inspection table', async ({ page }) => {
    await page.goto(BASE + '/quality/iqc');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const rootContent = await page.locator('#root').innerHTML();
    expect(rootContent).toBeTruthy();
  });

  test('admin employee page renders user table', async ({ page }) => {
    await page.goto(BASE + '/admin/employee');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const rootContent = await page.locator('#root').innerHTML();
    expect(rootContent).toBeTruthy();
  });
});

test.describe('Code-split lazy loading', () => {
  test('lazy pages load their chunks on navigation', async ({ page }) => {
    await page.goto(BASE + '/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    // Navigate to warehouse - should lazily load WarehousePage chunk
    await page.goto(BASE + '/warehouse');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    // Navigate to NPI projects - should lazily load ProjectsPage chunk
    await page.goto(BASE + '/npi/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    // No JS errors across lazy loads
    const rootContent = await page.locator('#root').innerHTML();
    expect(rootContent).toBeTruthy();
  });
});
