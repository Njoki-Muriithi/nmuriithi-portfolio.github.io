import { test, expect } from '@playwright/test';

// Full-page visual regression tests for the main site pages.
// All paths are relative so playwright.config.ts baseURL is the single source
// of truth for the origin. Screenshots are only taken on the desktop project
// to keep baselines stable; tablet and mobile viewports are skipped here and
// handled by dedicated breakpoint suites if required.

const PAGES = [
  { name: 'homepage',           path: '/' },
  { name: 'about',              path: '/about/' },
  { name: 'contact',            path: '/contact/' },
  { name: 'projects-index',     path: '/projects/' },
  { name: 'publications-index', path: '/publications/' },
];

for (const { name, path } of PAGES) {
  test(`full-page snapshot — ${name} (${path})`, async ({ page }, testInfo) => {
    // Restrict to the desktop project only. The projectName property on
    // testInfo reflects the name defined in playwright.config.ts.
    test.skip(
      testInfo.project.name !== 'desktop',
      'Full-page visual baselines are captured on desktop only',
    );

    await page.goto(path);

    // Wait for network activity to settle so lazy-loaded images and any
    // JS-driven layout shifts are complete before capturing the snapshot.
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
  });
}
