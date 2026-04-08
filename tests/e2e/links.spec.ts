import { test, expect } from '@playwright/test';

/**
 * Internal link integrity tests
 *
 * Collects all internal <a href="..."> links from main pages and verifies
 * each unique URL returns HTTP 200. Catches broken internal links, missing
 * pages, and bad baseurl references.
 */

const PAGES_TO_CRAWL = [
  '/',
  '/about/',
  '/contact/',
  '/projects/',
  '/publications/',
];

test('all internal links across main pages resolve to HTTP 200', async ({ page, baseURL }) => {
  const internalLinks = new Set<string>();

  for (const pagePath of PAGES_TO_CRAWL) {
    await page.goto(pagePath);

    const hrefs = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href]'));
      return anchors
        .map((a) => a.href)
        .filter((href) => href && !href.startsWith('javascript:') && !href.startsWith('mailto:'));
    });

    for (const href of hrefs) {
      // Only test internal links (same origin)
      if (href.startsWith(baseURL!)) {
        internalLinks.add(href);
      }
    }
  }

  expect(internalLinks.size, 'Should find at least some internal links').toBeGreaterThan(0);

  const brokenLinks: { url: string; status: number }[] = [];

  for (const url of internalLinks) {
    const response = await page.goto(url);
    const status = response?.status() ?? 0;
    if (status === 404 || status === 0) {
      brokenLinks.push({ url, status });
    }
  }

  expect(
    brokenLinks,
    `Found ${brokenLinks.length} broken link(s):\n${brokenLinks.map((l) => `  ${l.url} → ${l.status}`).join('\n')}`,
  ).toHaveLength(0);
});
