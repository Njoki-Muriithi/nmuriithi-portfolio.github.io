import { test, expect } from '@playwright/test';

/**
 * Homepage tests
 *
 * Covers:
 * - Hero banner renders with heading and subtitle
 * - Open Graph meta tags are present and properly escaped
 * - Twitter (X) meta tags are present
 */

test.describe('Hero banner', () => {
  test('main banner section is visible', async ({ page }) => {
    await page.goto('/');
    const banner = page.locator('.main-banner');
    await expect(banner).toBeVisible();
  });

  test('hero heading (h3) is visible and non-empty', async ({ page }) => {
    await page.goto('/');
    const heading = page.locator('.main-banner .text-content h3');
    await expect(heading).toBeVisible();
    const text = (await heading.textContent()) ?? '';
    expect(text.trim().length).toBeGreaterThan(0);
  });

  test('hero heading contains expected welcome text', async ({ page }) => {
    await page.goto('/');
    const heading = page.locator('.main-banner .text-content h3');
    await expect(heading).toContainText('Welcome To My Portfolio');
  });

  test('hero subtitle (h5) is visible and non-empty', async ({ page }) => {
    await page.goto('/');
    const subtitle = page.locator('.main-banner .text-content h5');
    await expect(subtitle).toBeVisible();
    const text = (await subtitle.textContent()) ?? '';
    expect(text.trim().length).toBeGreaterThan(0);
  });

  test('hero subtitle contains expected text', async ({ page }) => {
    await page.goto('/');
    const subtitle = page.locator('.main-banner .text-content h5');
    await expect(subtitle).toContainText('Feel Free To Explore');
  });

  test('"About Me" CTA button in hero links to /about/', async ({ page }) => {
    await page.goto('/');
    const ctaButton = page.locator('.main-banner .text-content a.main-stroked-button');
    await expect(ctaButton).toBeVisible();
    await expect(ctaButton).toContainText('About Me');

    const href = await ctaButton.getAttribute('href');
    expect(href).toMatch(/\/about\/$/);
  });

  test('Modern-Slider container is present', async ({ page }) => {
    await page.goto('/');
    const slider = page.locator('.Modern-Slider');
    await expect(slider).toBeAttached();
  });
});

test.describe('Open Graph meta tags', () => {
  test('og:type is present', async ({ page }) => {
    await page.goto('/');
    const ogType = page.locator('meta[property="og:type"]');
    await expect(ogType).toHaveAttribute('content', 'website');
  });

  test('og:title is present and non-empty', async ({ page }) => {
    await page.goto('/');
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toBeAttached();
    const content = await ogTitle.getAttribute('content');
    expect(content?.trim().length).toBeGreaterThan(0);
  });

  test('og:title contains site name', async ({ page }) => {
    await page.goto('/');
    const ogTitle = page.locator('meta[property="og:title"]');
    const content = await ogTitle.getAttribute('content');
    expect(content).toContain('Njoki Muriithi');
  });

  test('og:title does not contain unescaped HTML entities', async ({ page }) => {
    await page.goto('/');
    const ogTitle = page.locator('meta[property="og:title"]');
    const content = (await ogTitle.getAttribute('content')) ?? '';
    // These raw characters would indicate the Liquid | escape filter failed.
    expect(content).not.toContain('<');
    expect(content).not.toContain('>');
    expect(content).not.toContain('"');
  });

  test('og:description is present and non-empty', async ({ page }) => {
    await page.goto('/');
    const ogDesc = page.locator('meta[property="og:description"]');
    await expect(ogDesc).toBeAttached();
    const content = await ogDesc.getAttribute('content');
    expect(content?.trim().length).toBeGreaterThan(0);
  });

  test('og:description does not contain unescaped HTML entities', async ({ page }) => {
    await page.goto('/');
    const ogDesc = page.locator('meta[property="og:description"]');
    const content = (await ogDesc.getAttribute('content')) ?? '';
    expect(content).not.toContain('<');
    expect(content).not.toContain('>');
  });

  test('og:image is present and points to an absolute URL', async ({ page }) => {
    await page.goto('/');
    const ogImage = page.locator('meta[property="og:image"]');
    await expect(ogImage).toBeAttached();
    const content = (await ogImage.getAttribute('content')) ?? '';
    expect(content.trim().length).toBeGreaterThan(0);
    // absolute_url filter should produce a fully-qualified URL.
    expect(content).toMatch(/^https?:\/\//);
  });

  test('og:url is present and absolute', async ({ page }) => {
    await page.goto('/');
    const ogUrl = page.locator('meta[property="og:url"]');
    await expect(ogUrl).toBeAttached();
    const content = (await ogUrl.getAttribute('content')) ?? '';
    expect(content).toMatch(/^https?:\/\//);
  });
});

test.describe('Twitter (X) meta tags', () => {
  test('twitter:card is present with summary_large_image', async ({ page }) => {
    await page.goto('/');
    const twitterCard = page.locator('meta[name="twitter:card"]');
    await expect(twitterCard).toBeAttached();
    await expect(twitterCard).toHaveAttribute('content', 'summary_large_image');
  });

  test('twitter:title is present and non-empty', async ({ page }) => {
    await page.goto('/');
    const twitterTitle = page.locator('meta[name="twitter:title"]');
    await expect(twitterTitle).toBeAttached();
    const content = await twitterTitle.getAttribute('content');
    expect(content?.trim().length).toBeGreaterThan(0);
  });

  test('twitter:description is present and non-empty', async ({ page }) => {
    await page.goto('/');
    const twitterDesc = page.locator('meta[name="twitter:description"]');
    await expect(twitterDesc).toBeAttached();
    const content = await twitterDesc.getAttribute('content');
    expect(content?.trim().length).toBeGreaterThan(0);
  });

  test('twitter:image is present and absolute', async ({ page }) => {
    await page.goto('/');
    const twitterImage = page.locator('meta[name="twitter:image"]');
    await expect(twitterImage).toBeAttached();
    const content = (await twitterImage.getAttribute('content')) ?? '';
    expect(content).toMatch(/^https?:\/\//);
  });

  test('twitter:url is present and absolute', async ({ page }) => {
    await page.goto('/');
    const twitterUrl = page.locator('meta[name="twitter:url"]');
    await expect(twitterUrl).toBeAttached();
    const content = (await twitterUrl.getAttribute('content')) ?? '';
    expect(content).toMatch(/^https?:\/\//);
  });
});
