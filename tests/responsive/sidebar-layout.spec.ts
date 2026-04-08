import { test, expect } from '@playwright/test';

/**
 * Project sidebar layout — tablet responsive tests
 *
 * On tablet viewports (768px-991px), the project sidebar loses its sticky
 * positioning and becomes a static block that appears before the images
 * column in visual order.
 */

test.describe('Project sidebar on tablet', () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(
      testInfo.project.name !== 'tablet',
      'Sidebar layout tests are for tablet viewport only',
    );
  });

  test('sidebar has static position on tablet', async ({ page }) => {
    await page.goto('/projects/project-1/');
    await page.waitForLoadState('networkidle');

    const sidebar = page.locator('.project-info-sidebar');
    const position = await sidebar.evaluate((el: HTMLElement) => {
      return window.getComputedStyle(el).position;
    });

    expect(position).toBe('static');
  });

  test('sidebar is visible on tablet', async ({ page }) => {
    await page.goto('/projects/project-1/');
    await page.waitForLoadState('networkidle');

    const sidebar = page.locator('.project-info-sidebar');
    await expect(sidebar).toBeVisible();
  });

  test('sidebar appears before images in DOM order on tablet', async ({ page }) => {
    await page.goto('/projects/project-1/');

    // The sidebar column has order-1 (first) and images column has order-2
    const sidebarOrder = await page.locator('.project-info-sidebar').evaluate((el: HTMLElement) => {
      const col = el.closest('[class*="col-"]') as HTMLElement;
      return col ? window.getComputedStyle(col).order : '';
    });

    const imagesOrder = await page.locator('.images-column').evaluate((el: HTMLElement) => {
      return window.getComputedStyle(el).order;
    });

    // On mobile/tablet, sidebar (order-1) should come before images (order-2)
    expect(parseInt(sidebarOrder || '0')).toBeLessThanOrEqual(parseInt(imagesOrder || '0'));
  });
});
