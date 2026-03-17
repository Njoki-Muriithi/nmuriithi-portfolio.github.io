import { test, expect } from '@playwright/test';

/**
 * Publications tests
 *
 * Covers:
 * - Publications index page loads without error
 * - When publication cards exist, they render with title, description, and date
 *
 * Note: The _publications/ collection is currently empty. The tests are written
 * to pass in both states (empty collection and populated collection) so they
 * remain useful after publications are added.
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

test.describe('Publications collection cards (when publications exist)', () => {
  test('if publication cards are present, each has a non-empty title', async ({ page }) => {
    await page.goto('/publications/');

    // Cards are rendered if the collection is non-empty. The project layout
    // uses .project-info-sidebar h2 for the title in individual detail pages,
    // but an index page may use card wrappers. We look for any article, .card,
    // or list-item elements that represent publication entries.
    const cards = page.locator('.publication-card, article.publication, .col-lg-4.card, [data-publication]');
    const count = await cards.count();

    if (count === 0) {
      // Collection is empty — no cards to validate. This is the current state.
      test.info().annotations.push({
        type: 'note',
        description: 'No publication cards found. Collection may be empty.',
      });
      return;
    }

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const titleEl = card.locator('h2, h3, h4, .card-title').first();
      const titleText = (await titleEl.textContent()) ?? '';
      expect(titleText.trim().length, `Card ${i + 1} has empty title`).toBeGreaterThan(0);
    }
  });

  test('if publication cards are present, each has a non-empty description', async ({ page }) => {
    await page.goto('/publications/');

    const cards = page.locator('.publication-card, article.publication, [data-publication]');
    const count = await cards.count();

    if (count === 0) {
      return; // Empty collection — test vacuously passes.
    }

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const descEl = card.locator('p, .card-text, .description').first();
      const descText = (await descEl.textContent()) ?? '';
      expect(descText.trim().length, `Card ${i + 1} has empty description`).toBeGreaterThan(0);
    }
  });

  test('if publication cards are present, each has a visible date', async ({ page }) => {
    await page.goto('/publications/');

    const cards = page.locator('.publication-card, article.publication, [data-publication]');
    const count = await cards.count();

    if (count === 0) {
      return; // Empty collection — test vacuously passes.
    }

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const dateEl = card.locator('time, .date, [datetime], .pub-date').first();
      const dateText = (await dateEl.textContent()) ?? '';
      expect(dateText.trim().length, `Card ${i + 1} has empty date`).toBeGreaterThan(0);
    }
  });
});

test.describe('Individual publication detail pages (when publications exist)', () => {
  test('navigating to a publication URL renders a full page with sidebar', async ({ page }) => {
    // Try fetching a publication that would exist if the collection were
    // populated. Since the collection is empty right now, we verify the 404
    // page is rendered gracefully instead of crashing.
    const response = await page.goto('/publications/publication-1/');

    if (response?.status() === 404) {
      // Expected when collection is empty — verify custom 404 page is shown.
      const heading = page.locator('h1, h2').first();
      const headingText = (await heading.textContent()) ?? '';
      expect(headingText.trim().length).toBeGreaterThan(0);
      return;
    }

    // If a publication does exist, it uses the 'project' layout which includes
    // the .project-info-sidebar.
    expect(response?.status()).toBe(200);
    const sidebar = page.locator('.project-info-sidebar');
    await expect(sidebar).toBeVisible();
  });
});
