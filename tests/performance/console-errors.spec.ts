import { test, expect } from '@playwright/test';

/**
 * Console error tests
 *
 * Verifies that no JavaScript console errors occur on any main page.
 * Console warnings are allowed; only errors cause test failure.
 */

const PAGES = [
  { label: 'homepage', path: '/' },
  { label: 'about', path: '/about/' },
  { label: 'contact', path: '/contact/' },
  { label: 'projects index', path: '/projects/' },
  { label: 'publications index', path: '/publications/' },
  { label: 'project-1 detail', path: '/projects/project-1/' },
  { label: 'project-2 detail', path: '/projects/project-2/' },
];

for (const { label, path } of PAGES) {
  test(`${label}: no console errors`, async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(path);
    await page.waitForLoadState('networkidle');

    expect(
      errors,
      `Console errors on ${label}:\n${errors.join('\n')}`,
    ).toHaveLength(0);
  });
}
