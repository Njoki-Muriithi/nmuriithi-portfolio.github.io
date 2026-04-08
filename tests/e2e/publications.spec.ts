import { test, expect } from '@playwright/test';

/**
 * Publications tests
 *
 * Covers:
 * - Publications index page loads
 * - Publication-1 detail page loads with correct structure
 * - Publication detail uses project layout with sidebar
 */

test.describe('Publications index page', () => {
  test('loads and returns HTTP 200', async ({ page }) => {
    const response = await page.goto('/publications/');
    expect(response?.status()).toBe(200);
  });

  test('page has a <title> element that includes the site name', async ({ page }) => {
    await page.goto('/publications/');
    const title = await page.title();
    expect(title.trim().length).toBeGreaterThan(0);
    expect(title).toContain('Njoki Muriithi');
  });

  test('header navigation is visible', async ({ page }) => {
    await page.goto('/publications/');
    const header = page.locator('header.header-area');
    await expect(header).toBeVisible();
  });

  test('footer is visible', async ({ page }) => {
    await page.goto('/publications/');
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });
});

test.describe('Publication-1 detail page', () => {
  test('loads with HTTP 200', async ({ page }) => {
    const response = await page.goto('/publications/publication-1/');
    expect(response?.status()).toBe(200);
  });

  test('renders the project layout with sidebar', async ({ page }) => {
    await page.goto('/publications/publication-1/');
    const sidebar = page.locator('.project-info-sidebar');
    await expect(sidebar).toBeVisible();
  });

  test('sidebar displays publication title', async ({ page }) => {
    await page.goto('/publications/publication-1/');
    const title = page.locator('.project-info-sidebar h2');
    await expect(title).toBeVisible();
    const text = (await title.textContent()) ?? '';
    expect(text.trim().length, 'Publication title should not be empty').toBeGreaterThan(0);
  });

  test('sidebar displays category', async ({ page }) => {
    await page.goto('/publications/publication-1/');
    const category = page.locator('.project-info-sidebar h6');
    await expect(category).toBeVisible();
    const text = (await category.textContent()) ?? '';
    expect(text.trim().length).toBeGreaterThan(0);
  });

  test('sidebar displays technologies', async ({ page }) => {
    await page.goto('/publications/publication-1/');
    const techStack = page.locator('.tech-stack');
    await expect(techStack).toBeVisible();
    const techItems = techStack.locator('li');
    const count = await techItems.count();
    expect(count, 'Should have at least one technology listed').toBeGreaterThan(0);
  });

  test('page has non-empty document title', async ({ page }) => {
    await page.goto('/publications/publication-1/');
    const title = await page.title();
    expect(title.trim().length).toBeGreaterThan(0);
    expect(title).not.toMatch(/^Njoki Muriithi Portfolio\s*$/);
  });
});
