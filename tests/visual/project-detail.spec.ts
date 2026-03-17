import { test, expect } from '@playwright/test';

// Full-page visual regression tests for individual project detail pages.
// project-1 and project-2 both have real image assets committed to the repo,
// making them the most representative pages for layout regressions in the
// sticky-sidebar / image-gallery layout (`_layouts/project.html`).

const PROJECT_PAGES = [
  { name: 'project-1', path: '/projects/project-1/' },
  { name: 'project-2', path: '/projects/project-2/' },
];

for (const { name, path } of PROJECT_PAGES) {
  test(`full-page snapshot — ${name} detail (${path})`, async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Full-page visual baselines are captured on desktop only',
    );

    await page.goto(path);

    // project.html renders a scrollable image gallery and a sticky sidebar.
    // networkidle ensures all gallery images have finished loading before the
    // snapshot is taken, preventing false positives caused by broken image slots.
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
  });
}
