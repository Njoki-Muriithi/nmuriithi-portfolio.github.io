import { test, expect } from '@playwright/test';

/**
 * Info overlay panel — mobile responsive tests
 *
 * On mobile viewports, clicking the floating info button opens a slide-in
 * overlay panel with project information. It can be closed via the close
 * button, backdrop click, or ESC key.
 */

test.describe('Info overlay panel on mobile', () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(
      testInfo.project.name === 'desktop',
      'Overlay panel tests are for mobile/tablet viewports',
    );
  });

  test('overlay opens when floating button is clicked', async ({ page }) => {
    await page.goto('/projects/project-1/');
    await page.waitForLoadState('networkidle');

    const floatingBtn = page.locator('#floatingBtn');
    const overlay = page.locator('#infoOverlay');

    // Force-click since visibility depends on scroll position
    await floatingBtn.click({ force: true });

    await expect(overlay).toHaveClass(/active/);
  });

  test('backdrop is visible when overlay is open', async ({ page }) => {
    await page.goto('/projects/project-1/');
    await page.waitForLoadState('networkidle');

    await page.locator('#floatingBtn').click({ force: true });

    const backdrop = page.locator('#overlayBackdrop');
    await expect(backdrop).toHaveClass(/active/);
  });

  test('overlay closes when close button is clicked', async ({ page }) => {
    await page.goto('/projects/project-1/');
    await page.waitForLoadState('networkidle');

    await page.locator('#floatingBtn').click({ force: true });

    const overlay = page.locator('#infoOverlay');
    await expect(overlay).toHaveClass(/active/);

    await page.locator('.close-overlay').click();
    await expect(overlay).not.toHaveClass(/active/);
  });

  test('overlay closes when backdrop is clicked', async ({ page }) => {
    await page.goto('/projects/project-1/');
    await page.waitForLoadState('networkidle');

    await page.locator('#floatingBtn').click({ force: true });

    const overlay = page.locator('#infoOverlay');
    await expect(overlay).toHaveClass(/active/);

    await page.locator('#overlayBackdrop').click({ force: true });
    await expect(overlay).not.toHaveClass(/active/);
  });

  test('aria-expanded updates on floating button', async ({ page }) => {
    await page.goto('/projects/project-1/');
    await page.waitForLoadState('networkidle');

    const btn = page.locator('#floatingBtn');
    await expect(btn).toHaveAttribute('aria-expanded', 'false');

    await btn.click({ force: true });
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
  });
});
