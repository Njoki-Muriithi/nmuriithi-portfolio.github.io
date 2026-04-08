import { test, expect } from '@playwright/test';

/**
 * Portfolio / Projects Index tests
 *
 * Covers:
 * - Projects index page renders project cards
 * - Each card has a thumbnail, title, category, and description
 * - Card links navigate to project detail pages
 *
 * Note: The homepage Isotope filtering UI (`.filters`, `.grid`) referenced in
 * custom.js and home-page.js is not currently rendered in any template.
 * These tests cover the projects index page card grid instead.
 */

test.describe('Projects index card rendering', () => {
  test('projects index page shows project cards', async ({ page }) => {
    await page.goto('/projects/');

    const cards = page.locator('.project-card');
    const count = await cards.count();
    expect(count, 'There should be at least one project card').toBeGreaterThan(0);
  });

  test('each project card has a title', async ({ page }) => {
    await page.goto('/projects/');

    const cards = page.locator('.project-card');
    const count = await cards.count();

    for (let i = 0; i < count; i++) {
      const title = cards.nth(i).locator('.card-title');
      await expect(title).toBeVisible();
      const text = (await title.textContent()) ?? '';
      expect(text.trim().length, `Card ${i + 1} has empty title`).toBeGreaterThan(0);
    }
  });

  test('each project card has a category label', async ({ page }) => {
    await page.goto('/projects/');

    const cards = page.locator('.project-card');
    const count = await cards.count();

    for (let i = 0; i < count; i++) {
      const category = cards.nth(i).locator('.card-category');
      await expect(category).toBeVisible();
      const text = (await category.textContent()) ?? '';
      expect(text.trim().length, `Card ${i + 1} has empty category`).toBeGreaterThan(0);
    }
  });

  test('each project card has a description', async ({ page }) => {
    await page.goto('/projects/');

    const cards = page.locator('.project-card');
    const count = await cards.count();

    for (let i = 0; i < count; i++) {
      const desc = cards.nth(i).locator('.card-description');
      await expect(desc).toBeVisible();
      const text = (await desc.textContent()) ?? '';
      expect(text.trim().length, `Card ${i + 1} has empty description`).toBeGreaterThan(0);
    }
  });
});

test.describe('Project card thumbnails', () => {
  test('cards with images have a visible thumbnail', async ({ page }) => {
    await page.goto('/projects/');
    await page.waitForLoadState('load');

    const thumbnails = page.locator('.project-card .card-thumbnail');
    const count = await thumbnails.count();

    // At least some cards should have thumbnails (projects 1 and 2 have images)
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const img = thumbnails.nth(i);
        await expect(img).toBeAttached();

        const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
        expect(naturalWidth, `Thumbnail ${i + 1} failed to load`).toBeGreaterThan(0);
      }
    }
  });
});

test.describe('Project card links', () => {
  test('each card has a "View Project" link pointing to a project detail page', async ({ page }) => {
    await page.goto('/projects/');

    const links = page.locator('.project-card .card-link');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href, `Card ${i + 1} link is empty`).toBeTruthy();
      expect(href).toContain('/projects/');
    }
  });

  test('card title links to the same project as the "View Project" link', async ({ page }) => {
    await page.goto('/projects/');

    const cards = page.locator('.project-card');
    const count = await cards.count();

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const titleHref = await card.locator('.card-title a').getAttribute('href');
      const viewHref = await card.locator('.card-link').getAttribute('href');

      if (titleHref && viewHref) {
        expect(titleHref).toBe(viewHref);
      }
    }
  });
});
