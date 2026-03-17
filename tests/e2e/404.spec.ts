import { test, expect } from '@playwright/test';

/**
 * 404 page tests
 *
 * Covers:
 * - Navigating to an invalid URL does not return a blank page
 * - The custom Jekyll 404 page is served with meaningful content
 * - The header and footer are still rendered (full layout)
 * - A "Back to Home" link is present so users can recover
 */

const INVALID_PATHS = [
  '/this-page-does-not-exist/',
  '/projects/nonexistent-project/',
  '/publications/fake-publication/',
  '/random/nested/path/',
];

test.describe('Invalid URLs do not return blank pages', () => {
  for (const path of INVALID_PATHS) {
    test(`${path}: body has content`, async ({ page }) => {
      await page.goto(path);

      const bodyText = await page.textContent('body');
      expect(bodyText, `Body is empty for ${path}`).toBeTruthy();
      expect(
        (bodyText ?? '').trim().length,
        `Body text is blank for ${path}`
      ).toBeGreaterThan(0);
    });
  }
});

test.describe('Custom 404 page content', () => {
  test('shows "404" visually on the page', async ({ page }) => {
    await page.goto('/this-page-does-not-exist/');

    // The custom 404.html renders a large "404" h1.
    const fourOhFour = page.locator('h1');
    await expect(fourOhFour).toBeVisible();
    const text = (await fourOhFour.textContent()) ?? '';
    expect(text).toContain('404');
  });

  test('shows "Page Not Found" heading', async ({ page }) => {
    await page.goto('/this-page-does-not-exist/');

    const pageNotFound = page.getByText('Page Not Found');
    await expect(pageNotFound).toBeVisible();
  });

  test('shows a human-readable error message', async ({ page }) => {
    await page.goto('/this-page-does-not-exist/');

    // The 404 page explains why the user landed here.
    const message = page.getByText("the page you're looking for doesn't exist", { exact: false });
    await expect(message).toBeVisible();
  });

  test('has a "Back to Home" link that points to the homepage', async ({ page }) => {
    await page.goto('/this-page-does-not-exist/');

    const backHomeLink = page.locator('a', { hasText: 'Back to Home' });
    await expect(backHomeLink).toBeVisible();

    const href = (await backHomeLink.getAttribute('href')) ?? '';
    // The link uses site.baseurl which resolves to /nmuriithi-portfolio.github.io/
    expect(href).toMatch(/\/$/);
    expect(href).not.toContain('{{');
  });
});

test.describe('404 page renders full layout', () => {
  test('header navigation is present', async ({ page }) => {
    await page.goto('/this-page-does-not-exist/');

    const header = page.locator('header.header-area');
    await expect(header).toBeVisible();
  });

  test('footer is present', async ({ page }) => {
    await page.goto('/this-page-does-not-exist/');

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('page has a <title> element', async ({ page }) => {
    await page.goto('/this-page-does-not-exist/');

    const title = await page.title();
    expect(title.trim().length).toBeGreaterThan(0);
  });

  test('solid header style is applied (header_style: solid)', async ({ page }) => {
    await page.goto('/this-page-does-not-exist/');

    // 404.html sets header_style: solid which adds the .header-solid class.
    const solidHeader = page.locator('header.header-solid');
    await expect(solidHeader).toBeAttached();
  });
});
