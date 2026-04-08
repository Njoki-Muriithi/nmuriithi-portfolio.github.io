import { test, expect } from '@playwright/test';

/**
 * Image loading tests
 *
 * Verifies that all <img> elements with non-empty src attributes across
 * main pages load successfully (naturalWidth > 0). Catches broken image
 * references and missing assets.
 */

const PAGES = [
  { label: 'homepage', path: '/' },
  { label: 'about', path: '/about/' },
  { label: 'projects index', path: '/projects/' },
  { label: 'project-1 detail', path: '/projects/project-1/' },
  { label: 'project-2 detail', path: '/projects/project-2/' },
];

for (const { label, path } of PAGES) {
  test(`${label}: all images load successfully`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('load');

    const brokenImages = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll<HTMLImageElement>('img[src]'));
      return images
        .filter((img) => img.src && img.naturalWidth === 0)
        .map((img) => ({
          src: img.getAttribute('src') ?? '',
          alt: img.getAttribute('alt') ?? '',
        }));
    });

    expect(
      brokenImages,
      `${brokenImages.length} broken image(s) on ${label}:\n${brokenImages.map((i) => `  src="${i.src}" alt="${i.alt}"`).join('\n')}`,
    ).toHaveLength(0);
  });
}
