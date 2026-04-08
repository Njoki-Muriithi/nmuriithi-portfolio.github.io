import { test, expect } from '@playwright/test';

/**
 * Floating info button — mobile responsive tests
 *
 * The floating info button (#floatingBtn) on project detail pages is hidden by
 * default and becomes visible after scrolling past the hero section. On mobile
 * viewports it is always display: flex via CSS, but only gets the .show class
 * after scroll threshold is met via JS.
 */

test.describe('Floating info button on mobile', () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(
      testInfo.project.name === 'desktop',
      'Floating button tests are for mobile/tablet viewports',
    );
  });

  test('floating button is hidden before scrolling', async ({ page }) => {
    await page.goto('/projects/project-1/');
    await page.waitForLoadState('networkidle');

    const btn = page.locator('#floatingBtn');
    await expect(btn).toBeAttached();
    await expect(btn).not.toHaveClass(/show/);
  });

  test('floating button appears after scrolling past hero', async ({ page }) => {
    await page.goto('/projects/project-1/');
    await page.waitForLoadState('networkidle');

    // Scroll well past the hero section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    const btn = page.locator('#floatingBtn');
    await expect(btn).toHaveClass(/show/);
  });

  test('floating button has correct aria-label', async ({ page }) => {
    await page.goto('/projects/project-1/');
    const btn = page.locator('#floatingBtn');
    await expect(btn).toHaveAttribute('aria-label', 'Show project info');
  });
});
