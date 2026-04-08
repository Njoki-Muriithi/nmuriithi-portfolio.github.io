import { test, expect } from '@playwright/test';

/**
 * Page load performance tests
 *
 * Verifies that all main pages complete DOMContentLoaded within acceptable
 * thresholds on the local dev server. Threshold is 5000ms to accommodate
 * Jekyll's dev server overhead.
 */

const PAGES = [
  { label: 'homepage', path: '/' },
  { label: 'about', path: '/about/' },
  { label: 'contact', path: '/contact/' },
  { label: 'projects index', path: '/projects/' },
  { label: 'publications index', path: '/publications/' },
  { label: 'project-1 detail', path: '/projects/project-1/' },
];

const DOM_CONTENT_LOADED_THRESHOLD_MS = 5000;

for (const { label, path } of PAGES) {
  test(`${label}: DOMContentLoaded within ${DOM_CONTENT_LOADED_THRESHOLD_MS}ms`, async ({ page }) => {
    const startTime = Date.now();

    await page.goto(path, { waitUntil: 'domcontentloaded' });

    const loadTime = Date.now() - startTime;

    expect(
      loadTime,
      `${label} took ${loadTime}ms to reach DOMContentLoaded (threshold: ${DOM_CONTENT_LOADED_THRESHOLD_MS}ms)`,
    ).toBeLessThan(DOM_CONTENT_LOADED_THRESHOLD_MS);

    // Page should have a non-empty title
    const title = await page.title();
    expect(title.trim().length).toBeGreaterThan(0);
  });
}
