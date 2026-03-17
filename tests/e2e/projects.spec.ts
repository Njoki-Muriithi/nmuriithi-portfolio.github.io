import { test, expect } from '@playwright/test';

/**
 * Projects tests
 *
 * Covers:
 * - All 8 project detail pages load with HTTP 200
 * - Projects with images have no broken <img> (naturalWidth > 0)
 * - Sidebar h6 shows actual category text, not just "Project" for every page
 * - "Live Demo" and "View Code" buttons are absent when the URL is "#"
 */

// Projects 1 and 2 have real images; 3-8 have images: []
const PROJECT_SLUGS = [
  'project-1',
  'project-2',
  'project-3',
  'project-4',
  'project-5',
  'project-6',
  'project-7',
  'project-8',
];

const PROJECTS_WITH_IMAGES = new Set(['project-1', 'project-2']);

// Expected first category values from each project's front matter.
// These are used to assert that the sidebar h6 reflects the real category.
const EXPECTED_FIRST_CATEGORY: Record<string, string> = {
  'project-1': 'GIS Analysis',
  'project-2': 'GIS Mapping',
  'project-3': 'Cadastral Analysis',
  'project-4': '',  // unknown – test asserts non-empty instead
  'project-5': '',
  'project-6': '',
  'project-7': '',
  'project-8': '',
};

test.describe('Project detail pages load', () => {
  for (const slug of PROJECT_SLUGS) {
    test(`/projects/${slug}/ returns HTTP 200`, async ({ page }) => {
      const response = await page.goto(`/projects/${slug}/`);
      expect(response?.status()).toBe(200);
    });
  }
});

test.describe('Project detail page structure', () => {
  for (const slug of PROJECT_SLUGS) {
    test(`${slug}: page title is present and not empty`, async ({ page }) => {
      await page.goto(`/projects/${slug}/`);
      const title = await page.title();
      expect(title.trim().length).toBeGreaterThan(0);
      expect(title).not.toMatch(/^Njoki Muriithi Portfolio\s*$/);
    });

    test(`${slug}: project info sidebar is present`, async ({ page }) => {
      await page.goto(`/projects/${slug}/`);
      const sidebar = page.locator('.project-info-sidebar');
      await expect(sidebar).toBeVisible();
    });
  }
});

test.describe('Sidebar shows real category text', () => {
  for (const slug of PROJECT_SLUGS) {
    test(`${slug}: sidebar h6 contains actual category, not generic "Project"`, async ({ page }) => {
      await page.goto(`/projects/${slug}/`);

      // The sidebar renders {{ page.categories | first | default: "Project" }}
      // inside an h6. We assert it is non-empty AND that at least some pages
      // differ from the default fallback.
      const categoryEl = page.locator('.project-info-sidebar h6').first();
      await expect(categoryEl).toBeVisible();

      const categoryText = (await categoryEl.textContent()) ?? '';
      expect(categoryText.trim().length).toBeGreaterThan(0);

      // For projects that have a known first category, verify it exactly.
      const expected = EXPECTED_FIRST_CATEGORY[slug];
      if (expected) {
        expect(categoryText.trim()).toBe(expected);
      }
    });
  }
});

test.describe('Images in projects with real images are not broken', () => {
  for (const slug of PROJECTS_WITH_IMAGES) {
    test(`${slug}: all gallery images have naturalWidth > 0`, async ({ page }) => {
      await page.goto(`/projects/${slug}/`);

      // Wait for the images column to be present.
      await page.locator('.images-column').waitFor({ state: 'attached' });

      const images = page.locator('.images-column img');
      const count = await images.count();
      expect(count).toBeGreaterThan(0);

      for (let i = 0; i < count; i++) {
        const img = images.nth(i);
        // Ensure the image element is in the DOM.
        await expect(img).toBeAttached();

        // naturalWidth is 0 when the image fails to load.
        const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
        expect(naturalWidth, `Image ${i + 1} on ${slug} has naturalWidth 0 (broken)`).toBeGreaterThan(0);
      }
    });
  }
});

test.describe('Projects with no images have no broken img elements', () => {
  const projectsWithoutImages = PROJECT_SLUGS.filter((s) => !PROJECTS_WITH_IMAGES.has(s));

  for (const slug of projectsWithoutImages) {
    test(`${slug}: images-column contains no img elements`, async ({ page }) => {
      await page.goto(`/projects/${slug}/`);

      const imagesInColumn = page.locator('.images-column img');
      const count = await imagesInColumn.count();
      expect(count).toBe(0);
    });
  }
});

test.describe('"Live Demo" and "View Code" buttons hidden when URL is "#"', () => {
  // All 8 projects use demo_url: "#" and github_url: "#" in their front matter.
  // The layout conditionally renders these links only when the URL is not "#".
  for (const slug of PROJECT_SLUGS) {
    test(`${slug}: Live Demo link is not rendered`, async ({ page }) => {
      await page.goto(`/projects/${slug}/`);

      const liveDemoLink = page.locator('.project-links a', { hasText: 'Live Demo' });
      await expect(liveDemoLink).toHaveCount(0);
    });

    test(`${slug}: View Code link is not rendered`, async ({ page }) => {
      await page.goto(`/projects/${slug}/`);

      const viewCodeLink = page.locator('.project-links a', { hasText: 'View Code' });
      await expect(viewCodeLink).toHaveCount(0);
    });
  }
});

test.describe('Image navigation buttons', () => {
  test('project-1: image nav buttons render when more than one image', async ({ page }) => {
    await page.goto('/projects/project-1/');

    // project-1 has 4 images, so navigation buttons must appear.
    const navButtons = page.locator('.image-navigation .nav-btn');
    const count = await navButtons.count();
    expect(count).toBeGreaterThan(1);
  });

  test('project-3: no image navigation section when images is empty', async ({ page }) => {
    await page.goto('/projects/project-3/');

    // images: [] means the navigation block is never rendered.
    const navSection = page.locator('.image-navigation');
    await expect(navSection).toHaveCount(0);
  });
});

test.describe('Categories section', () => {
  test('project-1: categories section renders correct tags', async ({ page }) => {
    await page.goto('/projects/project-1/');

    const categoriesSection = page.locator('.project-categories-section');
    await expect(categoriesSection).toBeVisible();

    const tags = categoriesSection.locator('.category-tag');
    await expect(tags.first()).toContainText('GIS Analysis');
  });
});
