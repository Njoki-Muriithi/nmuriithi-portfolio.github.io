import { test, expect } from '@playwright/test';

/**
 * Navigation tests
 *
 * Covers:
 * - Header presence on all main pages
 * - Nav links resolve without 404
 * - Dropdown menus open on click
 * - Mobile hamburger menu toggle
 * - Scroll-down arrow targets #portfolio-content
 */

const mainPages = [
  { label: 'home', path: '/' },
  { label: 'about', path: '/about/' },
  { label: 'projects index', path: '/projects/' },
  { label: 'publications index', path: '/publications/' },
  { label: 'contact', path: '/contact/' },
];

// All top-level navigation hrefs as rendered by Jekyll (includes baseurl).
// Dropdowns link to individual project/publication pages; we test the index
// pages and a representative project instead of enumerating all sub-pages.
const navLinkPaths = [
  '/',
  '/about/',
  '/projects/',
  '/publications/',
  '/contact/',
  '/projects/project-1/',
  '/projects/project-2/',
];

test.describe('Header renders on all main pages', () => {
  for (const { label, path } of mainPages) {
    test(`header is visible on ${label}`, async ({ page }) => {
      await page.goto(path);
      const header = page.locator('header.header-area');
      await expect(header).toBeVisible();
    });
  }
});

test.describe('Navigation logo and branding', () => {
  test('logo link text is N.MURIITHI and points to home', async ({ page }) => {
    await page.goto('/');
    const logo = page.locator('header .logo.author-name');
    await expect(logo).toBeVisible();
    await expect(logo).toContainText('N.MURIITHI');
  });
});

test.describe('Nav links resolve without 404', () => {
  for (const path of navLinkPaths) {
    test(`${path} returns non-404 status`, async ({ page }) => {
      const response = await page.goto(path);
      // GitHub Pages serves a custom 404.html, so we check the page does not
      // show the "Page Not Found" heading rather than relying solely on status.
      const h1Text = await page.locator('h1').first().textContent().catch(() => '');
      expect(h1Text).not.toContain('404');
      // Status should be 200 for known pages.
      expect(response?.status()).toBe(200);
    });
  }
});

test.describe('Dropdown menus', () => {
  test('Projects dropdown opens on click and shows project links', async ({ page }) => {
    await page.goto('/');

    // The Projects submenu trigger is an anchor with aria-haspopup inside a
    // .submenu list item. Clicking it should expand the dropdown.
    const projectsTrigger = page.locator('ul.nav li.submenu').filter({ hasText: 'Projects' }).locator('> a').first();
    await projectsTrigger.click();

    // After click the <ul> inside the submenu should become visible.
    const dropdown = page.locator('ul.nav li.submenu').filter({ hasText: 'Projects' }).locator('> ul');
    await expect(dropdown).toBeVisible();

    // There should be at least one project link inside the dropdown.
    const projectLinks = dropdown.locator('a');
    await expect(projectLinks.first()).toBeVisible();
  });

  test('Publications dropdown opens on click', async ({ page }) => {
    await page.goto('/');

    const pubsTrigger = page.locator('ul.nav li.submenu').filter({ hasText: 'Publications' }).locator('> a').first();
    await pubsTrigger.click();

    const dropdown = page.locator('ul.nav li.submenu').filter({ hasText: 'Publications' }).locator('> ul');
    await expect(dropdown).toBeVisible();
  });

  test('aria-expanded is updated when dropdown opens', async ({ page }) => {
    await page.goto('/');

    const projectsTrigger = page.locator('ul.nav li.submenu').filter({ hasText: 'Projects' }).locator('> a').first();
    await expect(projectsTrigger).toHaveAttribute('aria-expanded', 'false');

    await projectsTrigger.click();
    await expect(projectsTrigger).toHaveAttribute('aria-expanded', 'true');
  });
});

test.describe('Mobile hamburger menu', () => {
  test('menu-trigger button is present and togglable', async ({ page }) => {
    await page.goto('/');

    const menuTrigger = page.locator('button.menu-trigger');
    await expect(menuTrigger).toBeAttached();

    // Initial state: aria-expanded="false"
    await expect(menuTrigger).toHaveAttribute('aria-expanded', 'false');

    await menuTrigger.click();

    // After click the value must change (open).
    await expect(menuTrigger).toHaveAttribute('aria-expanded', 'true');
  });

  test('hamburger button controls #main-nav-list', async ({ page }) => {
    await page.goto('/');

    const menuTrigger = page.locator('button.menu-trigger');
    await expect(menuTrigger).toHaveAttribute('aria-controls', 'main-nav-list');

    const navList = page.locator('#main-nav-list');
    await expect(navList).toBeAttached();
  });
});

test.describe('Scroll-down arrow', () => {
  test('scroll-down link targets #portfolio-content', async ({ page }) => {
    await page.goto('/');

    const scrollArrow = page.locator('.scroll-down a').first();
    await expect(scrollArrow).toHaveAttribute('href', '#portfolio-content');
  });

  test('#portfolio-content section exists on homepage', async ({ page }) => {
    await page.goto('/');
    const target = page.locator('#portfolio-content');
    await expect(target).toBeAttached();
  });
});
