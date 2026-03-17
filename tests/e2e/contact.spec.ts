import { test, expect } from '@playwright/test';

/**
 * Contact page tests
 *
 * Covers:
 * - Google Form iframe is visible
 * - Iframe has width="100%" (responsive, not a fixed pixel width)
 * - External links (LinkedIn, GitHub) have rel="noopener noreferrer"
 */

test.describe('Contact page loads', () => {
  test('returns HTTP 200', async ({ page }) => {
    const response = await page.goto('/contact/');
    expect(response?.status()).toBe(200);
  });

  test('has correct page title', async ({ page }) => {
    await page.goto('/contact/');
    const title = await page.title();
    expect(title).toContain('Contact');
  });
});

test.describe('Google Form iframe', () => {
  test('iframe pointing to Google Forms is present', async ({ page }) => {
    await page.goto('/contact/');

    const iframe = page.locator('iframe[src*="docs.google.com/forms"]');
    await expect(iframe).toBeAttached();
  });

  test('Google Form iframe is visible', async ({ page }) => {
    await page.goto('/contact/');

    const iframe = page.locator('iframe[src*="docs.google.com/forms"]');
    await expect(iframe).toBeVisible();
  });

  test('iframe has width="100%" for responsive layout', async ({ page }) => {
    await page.goto('/contact/');

    // The markup sets width="100%" directly on the iframe element.
    // A fixed pixel value (e.g. "640") would cause overflow on narrow screens.
    const iframe = page.locator('iframe[src*="docs.google.com/forms"]');
    const widthAttr = await iframe.getAttribute('width');
    expect(widthAttr).toBe('100%');
  });

  test('iframe src uses embedded=true parameter', async ({ page }) => {
    await page.goto('/contact/');

    const iframe = page.locator('iframe[src*="docs.google.com/forms"]');
    const src = (await iframe.getAttribute('src')) ?? '';
    expect(src).toContain('embedded=true');
  });

  test('iframe has a positive height attribute', async ({ page }) => {
    await page.goto('/contact/');

    const iframe = page.locator('iframe[src*="docs.google.com/forms"]');
    const heightAttr = await iframe.getAttribute('height');
    const height = parseInt(heightAttr ?? '0', 10);
    expect(height).toBeGreaterThan(0);
  });
});

test.describe('External contact links', () => {
  test('LinkedIn link is present and visible', async ({ page }) => {
    await page.goto('/contact/');

    const linkedInLink = page.locator('a[href*="linkedin.com"]');
    await expect(linkedInLink).toBeVisible();
  });

  test('LinkedIn link has rel="noopener noreferrer"', async ({ page }) => {
    await page.goto('/contact/');

    const linkedInLink = page.locator('a[href*="linkedin.com"]');
    const rel = (await linkedInLink.getAttribute('rel')) ?? '';
    expect(rel).toContain('noopener');
    expect(rel).toContain('noreferrer');
  });

  test('LinkedIn link opens in new tab (target="_blank")', async ({ page }) => {
    await page.goto('/contact/');

    const linkedInLink = page.locator('a[href*="linkedin.com"]');
    await expect(linkedInLink).toHaveAttribute('target', '_blank');
  });

  test('GitHub link is present and visible', async ({ page }) => {
    await page.goto('/contact/');

    const githubLink = page.locator('a[href*="github.com"]');
    await expect(githubLink).toBeVisible();
  });

  test('GitHub link has rel="noopener noreferrer"', async ({ page }) => {
    await page.goto('/contact/');

    const githubLink = page.locator('a[href*="github.com"]');
    const rel = (await githubLink.getAttribute('rel')) ?? '';
    expect(rel).toContain('noopener');
    expect(rel).toContain('noreferrer');
  });

  test('GitHub link opens in new tab (target="_blank")', async ({ page }) => {
    await page.goto('/contact/');

    const githubLink = page.locator('a[href*="github.com"]');
    await expect(githubLink).toHaveAttribute('target', '_blank');
  });
});

test.describe('Contact page layout', () => {
  test('Contact Info heading is visible', async ({ page }) => {
    await page.goto('/contact/');

    const contactInfoHeading = page.getByText('Contact Info:');
    await expect(contactInfoHeading).toBeVisible();
  });

  test('contact form column is present', async ({ page }) => {
    await page.goto('/contact/');

    const formColumn = page.locator('.contact-form');
    await expect(formColumn).toBeAttached();
  });
});
