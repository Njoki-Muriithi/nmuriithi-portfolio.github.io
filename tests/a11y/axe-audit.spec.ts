import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Pages to audit. All paths are relative so playwright.config.ts baseURL is used.
const PAGES = [
  { name: 'homepage',           path: '/' },
  { name: 'about',              path: '/about/' },
  { name: 'contact',            path: '/contact/' },
  { name: 'projects index',     path: '/projects/' },
  { name: 'publications index', path: '/publications/' },
  { name: 'project-1 detail',   path: '/projects/project-1/' },
  { name: 'project-2 detail',   path: '/projects/project-2/' },
];

for (const { name, path } of PAGES) {
  test(`WCAG 2.1 AA — zero violations on ${name} (${path})`, async ({ page }) => {
    await page.goto(path);

    // Wait for the page to be fully rendered before scanning.
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    if (results.violations.length > 0) {
      // Log structured violation details so failures are easy to diagnose in CI.
      const summary = results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        helpUrl: v.helpUrl,
        nodes: v.nodes.map((n) => ({
          html: n.html,
          target: n.target,
          failureSummary: n.failureSummary,
        })),
      }));
      console.error(
        `[axe] ${results.violations.length} violation(s) on "${name}":\n` +
          JSON.stringify(summary, null, 2),
      );
    }

    expect(
      results.violations,
      `Expected zero WCAG 2.1 AA violations on "${name}" but found ${results.violations.length}`,
    ).toHaveLength(0);
  });
}
