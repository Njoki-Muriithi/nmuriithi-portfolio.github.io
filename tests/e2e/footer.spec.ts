import { test, expect } from '@playwright/test';

/**
 * Footer tests
 *
 * Covers:
 * - Footer is present on all main pages
 * - Social links (LinkedIn, GitHub) are present with correct attributes
 * - Copyright text is current
 */

const MAIN_PAGES = [
  { label: 'homepage', path: '/' },
  { label: 'about', path: '/about/' },
  { label: 'contact', path: '/contact/' },
  { label: 'projects index', path: '/projects/' },
  { label: 'publications index', path: '/publications/' },
];

test.describe('Footer presence on all pages', () => {
  for (const { label, path } of MAIN_PAGES) {
    test(`${label}: footer is visible`, async ({ page }) => {
      await page.goto(path);
      const footer = page.locator('footer');
      await expect(footer).toBeVisible();
    });
  }
});

test.describe('Footer social links', () => {
  test('footer contains at least one social link', async ({ page }) => {
    await page.goto('/');
    const socialLinks = page.locator('footer .social-icons a');
    const count = await socialLinks.count();
    expect(count, 'Footer should have at least one social link').toBeGreaterThan(0);
  });

  test('LinkedIn link is present in footer', async ({ page }) => {
    await page.goto('/');
    const linkedIn = page.locator('footer .social-icons a[href*="linkedin.com"]');
    await expect(linkedIn).toBeAttached();
  });

  test('GitHub link is present in footer', async ({ page }) => {
    await page.goto('/');
    const github = page.locator('footer .social-icons a[href*="github.com"]');
    await expect(github).toBeAttached();
  });

  test('social links open in new tab', async ({ page }) => {
    await page.goto('/');
    const socialLinks = page.locator('footer .social-icons a[href^="http"]');
    const count = await socialLinks.count();

    for (let i = 0; i < count; i++) {
      await expect(socialLinks.nth(i)).toHaveAttribute('target', '_blank');
    }
  });

  test('social links have rel="noopener" or "noreferrer"', async ({ page }) => {
    await page.goto('/');
    const socialLinks = page.locator('footer .social-icons a[href^="http"]');
    const count = await socialLinks.count();

    for (let i = 0; i < count; i++) {
      const rel = (await socialLinks.nth(i).getAttribute('rel')) ?? '';
      expect(rel, `Social link ${i + 1} missing noopener/noreferrer`).toContain('noopener');
    }
  });

  test('social links have aria-label for accessibility', async ({ page }) => {
    await page.goto('/');
    const socialLinks = page.locator('footer .social-icons a[href^="http"]');
    const count = await socialLinks.count();

    for (let i = 0; i < count; i++) {
      const label = await socialLinks.nth(i).getAttribute('aria-label');
      expect(label, `Social link ${i + 1} missing aria-label`).toBeTruthy();
    }
  });
});

test.describe('Footer copyright', () => {
  test('copyright text contains author name', async ({ page }) => {
    await page.goto('/');
    const copyright = page.locator('footer .footer-copyright');
    const text = (await copyright.textContent()) ?? '';
    expect(text).toContain('Njoki Muriithi');
  });

  test('copyright text contains current year', async ({ page }) => {
    await page.goto('/');
    const copyright = page.locator('footer .footer-copyright');
    const text = (await copyright.textContent()) ?? '';
    const currentYear = new Date().getFullYear().toString();
    expect(text).toContain(currentYear);
  });
});
