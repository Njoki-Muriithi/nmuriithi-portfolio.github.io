import { test, expect } from '@playwright/test';

// Targeted component-level visual regression tests.
// Each assertion clips a specific element rather than capturing the full page,
// which makes these snapshots cheaper to update and easier to reason about
// when a single component changes without affecting the rest of the layout.

test.describe('component snapshots', () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Component visual baselines are captured on desktop only',
    );
  });

  test('header — header.header-area', async ({ page }) => {
    // Navigate to the homepage so the header renders in its default
    // transparent/sticky state. Inner pages use `header_style: solid`;
    // those variants are intentionally a separate concern.
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const header = page.locator('header.header-area');
    await expect(header).toHaveScreenshot('header.png');
  });

  test('footer — footer', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const footer = page.locator('footer');
    await expect(footer).toHaveScreenshot('footer.png');
  });

  test('project card grid — .row on /projects/', async ({ page }) => {
    // The projects index page renders project cards inside a single `.row`
    // container (see projects/index.html). Targeting this element isolates
    // card layout regressions from header/footer changes.
    await page.goto('/projects/');
    await page.waitForLoadState('networkidle');

    // All card thumbnails are lazy-loaded. Scroll to the bottom so the browser
    // decodes every image before the snapshot is taken.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForLoadState('networkidle');

    const cardGrid = page.locator('.row').first();
    await expect(cardGrid).toHaveScreenshot('project-card-grid.png');
  });
});
