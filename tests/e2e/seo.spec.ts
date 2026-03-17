import { test, expect } from '@playwright/test';

/**
 * SEO tests
 *
 * Covers every main page:
 * - <link rel="canonical"> is present with an absolute href
 * - og:title, og:description, og:image meta tags are present
 * - twitter:card meta tag is present
 * - JSON-LD <script type="application/ld+json"> is present and valid
 * - Favicon link uses the Jekyll baseurl (not hardcoded root)
 */

const ALL_PAGES = [
  { label: 'homepage', path: '/' },
  { label: 'about', path: '/about/' },
  { label: 'contact', path: '/contact/' },
  { label: 'projects index', path: '/projects/' },
  { label: 'publications index', path: '/publications/' },
  { label: 'project-1 detail', path: '/projects/project-1/' },
  { label: 'project-2 detail', path: '/projects/project-2/' },
  { label: 'project-3 detail', path: '/projects/project-3/' },
];

test.describe('Canonical URL', () => {
  for (const { label, path } of ALL_PAGES) {
    test(`${label}: has exactly one <link rel="canonical">`, async ({ page }) => {
      await page.goto(path);
      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveCount(1);
    });

    test(`${label}: canonical href is absolute (https://...)`, async ({ page }) => {
      await page.goto(path);
      const canonical = page.locator('link[rel="canonical"]');
      const href = (await canonical.getAttribute('href')) ?? '';
      expect(href.trim().length).toBeGreaterThan(0);
      expect(href, `Canonical on ${label} is not absolute`).toMatch(/^https?:\/\//);
    });
  }
});

test.describe('Open Graph meta tags', () => {
  for (const { label, path } of ALL_PAGES) {
    test(`${label}: og:title is present and non-empty`, async ({ page }) => {
      await page.goto(path);
      const ogTitle = page.locator('meta[property="og:title"]');
      await expect(ogTitle).toHaveCount(1);
      const content = (await ogTitle.getAttribute('content')) ?? '';
      expect(content.trim().length, `og:title is empty on ${label}`).toBeGreaterThan(0);
    });

    test(`${label}: og:description is present and non-empty`, async ({ page }) => {
      await page.goto(path);
      const ogDesc = page.locator('meta[property="og:description"]');
      await expect(ogDesc).toHaveCount(1);
      const content = (await ogDesc.getAttribute('content')) ?? '';
      expect(content.trim().length, `og:description is empty on ${label}`).toBeGreaterThan(0);
    });

    test(`${label}: og:image is present and points to an absolute URL`, async ({ page }) => {
      await page.goto(path);
      const ogImage = page.locator('meta[property="og:image"]');
      await expect(ogImage).toHaveCount(1);
      const content = (await ogImage.getAttribute('content')) ?? '';
      expect(content.trim().length, `og:image is empty on ${label}`).toBeGreaterThan(0);
      expect(content, `og:image on ${label} is not absolute`).toMatch(/^https?:\/\//);
      // Must not reference the removed slide-01.jpg asset.
      expect(content).not.toContain('slide-01.jpg');
    });
  }
});

test.describe('Twitter card meta tags', () => {
  for (const { label, path } of ALL_PAGES) {
    test(`${label}: twitter:card is present`, async ({ page }) => {
      await page.goto(path);
      const twitterCard = page.locator('meta[name="twitter:card"]');
      await expect(twitterCard).toHaveCount(1);
      const content = (await twitterCard.getAttribute('content')) ?? '';
      expect(content.trim().length, `twitter:card is empty on ${label}`).toBeGreaterThan(0);
    });

    test(`${label}: twitter:title is present and non-empty`, async ({ page }) => {
      await page.goto(path);
      const twitterTitle = page.locator('meta[name="twitter:title"]');
      await expect(twitterTitle).toHaveCount(1);
      const content = (await twitterTitle.getAttribute('content')) ?? '';
      expect(content.trim().length, `twitter:title is empty on ${label}`).toBeGreaterThan(0);
    });
  }
});

test.describe('JSON-LD structured data', () => {
  for (const { label, path } of ALL_PAGES) {
    test(`${label}: JSON-LD script tag is present`, async ({ page }) => {
      await page.goto(path);
      const jsonLd = page.locator('script[type="application/ld+json"]');
      await expect(jsonLd).toHaveCount(1);
    });

    test(`${label}: JSON-LD content is valid JSON with @context schema.org`, async ({ page }) => {
      await page.goto(path);
      const jsonLd = page.locator('script[type="application/ld+json"]');
      const content = await jsonLd.textContent();
      expect(content, `JSON-LD on ${label} is empty`).toBeTruthy();

      let parsed: Record<string, unknown>;
      expect(() => {
        parsed = JSON.parse(content!);
      }, `JSON-LD on ${label} is not valid JSON`).not.toThrow();

      // parsed is assigned inside the expect callback above; access after.
      const data = JSON.parse(content!);
      expect(data['@context']).toBe('https://schema.org');
    });

    test(`${label}: JSON-LD has @type field`, async ({ page }) => {
      await page.goto(path);
      const jsonLd = page.locator('script[type="application/ld+json"]');
      const content = (await jsonLd.textContent()) ?? '{}';
      const data = JSON.parse(content);
      expect(data['@type']).toBeTruthy();
    });
  }
});

test.describe('Favicon', () => {
  for (const { label, path } of ALL_PAGES) {
    test(`${label}: favicon link is present`, async ({ page }) => {
      await page.goto(path);
      const favicon = page.locator('link[rel="icon"]');
      await expect(favicon).toHaveCount(1);
    });

    test(`${label}: favicon href includes the site baseurl (not hardcoded root)`, async ({ page }) => {
      await page.goto(path);
      const favicon = page.locator('link[rel="icon"]');
      const href = (await favicon.getAttribute('href')) ?? '';
      expect(href.trim().length, `Favicon href is empty on ${label}`).toBeGreaterThan(0);
      // The Jekyll site.baseurl is /nmuriithi-portfolio.github.io.
      // A hardcoded /favicon.ico (without baseurl) would break on GitHub Pages.
      expect(href, `Favicon on ${label} is missing the baseurl`).toContain(
        '/nmuriithi-portfolio.github.io/favicon.ico'
      );
      // Must not contain unrendered Liquid syntax.
      expect(href).not.toContain('{{');
    });
  }
});
