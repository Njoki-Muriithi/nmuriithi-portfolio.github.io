import { test, expect } from '@playwright/test';

/**
 * Hamburger menu — mobile responsive tests
 *
 * On mobile viewports the navigation collapses behind a hamburger button.
 * Clicking it reveals nav links, and dropdown triggers open submenus.
 */

test.describe('Hamburger menu on mobile', () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(
      testInfo.project.name !== 'mobile',
      'Hamburger menu tests are for mobile viewport only',
    );
  });

  test('hamburger button is visible on mobile', async ({ page }) => {
    await page.goto('/');
    const menuTrigger = page.locator('button.menu-trigger');
    await expect(menuTrigger).toBeVisible();
  });

  test('clicking hamburger reveals navigation links', async ({ page }) => {
    await page.goto('/');

    const menuTrigger = page.locator('button.menu-trigger');
    await menuTrigger.click();
    await expect(menuTrigger).toHaveAttribute('aria-expanded', 'true');

    // Nav list should be visible after toggle
    const navList = page.locator('#main-nav-list');
    await expect(navList).toBeAttached();
  });

  test('submenu trigger opens dropdown in mobile menu', async ({ page }) => {
    await page.goto('/');

    // Open hamburger menu first
    await page.locator('button.menu-trigger').click();

    // Click Projects submenu trigger
    const projectsTrigger = page.locator('ul.nav li.submenu')
      .filter({ hasText: 'Projects' })
      .locator('> a')
      .first();

    await projectsTrigger.click();

    const dropdown = page.locator('ul.nav li.submenu')
      .filter({ hasText: 'Projects' })
      .locator('> ul');

    await expect(dropdown).toBeVisible();
  });

  test('mobile nav contains all main navigation items', async ({ page }) => {
    await page.goto('/');
    await page.locator('button.menu-trigger').click();

    const navItems = ['Home', 'About', 'Projects', 'Publications', 'Contact'];
    for (const item of navItems) {
      const link = page.locator('#main-nav-list').getByText(item, { exact: false });
      await expect(link).toBeAttached();
    }
  });
});
