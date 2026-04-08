import { test, expect } from '@playwright/test';

/**
 * Admin Panel tests
 *
 * Covers:
 * - Login view renders with GitHub OAuth button
 * - Dashboard view structure (stat cards, content health, recent edits)
 * - Editor sidebar toggle (collapse/expand, toggle stays visible)
 * - Editor form field presence (all front matter fields, action buttons)
 * - View navigation (nav links → collection editor)
 *
 * Note: These tests validate UI structure and client-side interactions
 * without requiring a live Supabase/GitHub session.
 */

// ─── 2.1 Login View ──────────────────────────────────────────────

test.describe('Admin login view', () => {
  test('login card with "Admin Login" heading is visible', async ({ page }) => {
    await page.goto('/nmuriithi-portfolio.github.io/admin/');
    const heading = page.locator('.login-card h1');
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText('Admin Login');
  });

  test('"Sign in with GitHub" button is present', async ({ page }) => {
    await page.goto('/nmuriithi-portfolio.github.io/admin/');
    const btn = page.locator('#btn-github-login');
    await expect(btn).toBeVisible();
    const text = await btn.textContent();
    expect(text).toContain('Sign in with GitHub');
  });

  test('top navigation bar is hidden before login', async ({ page }) => {
    await page.goto('/nmuriithi-portfolio.github.io/admin/');
    const nav = page.locator('#admin-nav');
    await expect(nav).toBeHidden();
  });

  test('dashboard and editor views are hidden before login', async ({ page }) => {
    await page.goto('/nmuriithi-portfolio.github.io/admin/');
    await expect(page.locator('#view-dashboard')).toBeHidden();
    await expect(page.locator('#view-editor')).toBeHidden();
  });
});

// ─── 2.2 Dashboard View ──────────────────────────────────────────

test.describe('Admin dashboard view', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/nmuriithi-portfolio.github.io/admin/');
    // Simulate authenticated state by showing dashboard
    await page.evaluate(() => {
      (document.getElementById('view-login') as HTMLElement).style.display = 'none';
      (document.getElementById('view-dashboard') as HTMLElement).style.display = '';
      (document.getElementById('admin-nav') as HTMLElement).style.display = '';
    });
  });

  test('dashboard has stat cards for Projects and Publications', async ({ page }) => {
    const statCards = page.locator('.stat-card');
    await expect(statCards).toHaveCount(2);

    await expect(page.locator('#stat-projects')).toBeVisible();
    await expect(page.locator('#stat-publications')).toBeVisible();
  });

  test('each stat card has number and label', async ({ page }) => {
    const statCards = page.locator('.stat-card');
    const count = await statCards.count();

    for (let i = 0; i < count; i++) {
      const card = statCards.nth(i);
      await expect(card.locator('.stat-number')).toBeVisible();
      await expect(card.locator('.stat-label')).toBeVisible();
    }
  });

  test('dashboard has Content Health section', async ({ page }) => {
    const healthSection = page.locator('#health-warnings');
    await expect(healthSection).toBeAttached();
  });

  test('dashboard has Recently Edited section', async ({ page }) => {
    const recentSection = page.locator('#recent-edits');
    await expect(recentSection).toBeAttached();
  });

  test('View Live Site link is present', async ({ page }) => {
    const siteLink = page.locator('.btn-site-link');
    await expect(siteLink).toBeVisible();
  });

  test('top nav shows Dashboard, Projects, and Publications links', async ({ page }) => {
    const nav = page.locator('#admin-nav');
    await expect(nav).toBeVisible();

    await expect(page.locator('#btn-back-dashboard')).toBeVisible();
    await expect(page.locator('.nav-collection[data-collection="projects"]')).toBeVisible();
    await expect(page.locator('.nav-collection[data-collection="publications"]')).toBeVisible();
  });

  test('logout button is visible', async ({ page }) => {
    await expect(page.locator('#btn-logout')).toBeVisible();
  });
});

// ─── 2.3 Editor Sidebar Toggle ───────────────────────────────────

test.describe('Admin editor sidebar toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/nmuriithi-portfolio.github.io/admin/');
    // Show editor view directly
    await page.evaluate(() => {
      (document.getElementById('view-login') as HTMLElement).style.display = 'none';
      (document.getElementById('view-editor') as HTMLElement).style.display = '';
      (document.getElementById('admin-nav') as HTMLElement).style.display = '';
    });
  });

  test('sidebar toggle button is visible', async ({ page }) => {
    const toggle = page.locator('#sidebar-toggle');
    await expect(toggle).toBeVisible();
  });

  test('sidebar collapses when toggle is clicked', async ({ page }) => {
    const toggle = page.locator('#sidebar-toggle');
    const sidebar = page.locator('#editor-sidebar');

    await toggle.click();
    await expect(sidebar).toHaveClass(/collapsed/);
  });

  test('toggle button remains visible when sidebar is collapsed', async ({ page }) => {
    const toggle = page.locator('#sidebar-toggle');
    await toggle.click();

    // The toggle button is outside the sidebar, so it should remain visible
    await expect(toggle).toBeVisible();
  });

  test('sidebar expands when toggle is clicked again', async ({ page }) => {
    const toggle = page.locator('#sidebar-toggle');
    const sidebar = page.locator('#editor-sidebar');

    // Collapse
    await toggle.click();
    await expect(sidebar).toHaveClass(/collapsed/);

    // Expand
    await toggle.click();
    await expect(sidebar).not.toHaveClass(/collapsed/);
  });
});

// ─── 2.4 Editor Form Fields ─────────────────────────────────────

test.describe('Admin editor form fields', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/nmuriithi-portfolio.github.io/admin/');
    // Show editor view and form
    await page.evaluate(() => {
      (document.getElementById('view-login') as HTMLElement).style.display = 'none';
      (document.getElementById('view-editor') as HTMLElement).style.display = '';
      (document.getElementById('admin-nav') as HTMLElement).style.display = '';
      (document.getElementById('editor-form-container') as HTMLElement).style.display = '';
      (document.getElementById('editor-placeholder') as HTMLElement).style.display = 'none';
    });
  });

  test('form contains menu_label input', async ({ page }) => {
    await expect(page.locator('#field-menu_label')).toBeVisible();
  });

  test('form contains title input', async ({ page }) => {
    await expect(page.locator('#field-title')).toBeVisible();
  });

  test('form contains description textarea', async ({ page }) => {
    await expect(page.locator('#field-description')).toBeVisible();
  });

  test('form contains date input', async ({ page }) => {
    await expect(page.locator('#field-date')).toBeVisible();
  });

  test('form contains display_order input', async ({ page }) => {
    await expect(page.locator('#field-display_order')).toBeVisible();
  });

  test('form contains categories tag input', async ({ page }) => {
    await expect(page.locator('#tag-input-categories')).toBeVisible();
    await expect(page.locator('#btn-add-tag-categories')).toBeVisible();
  });

  test('form contains technologies tag input', async ({ page }) => {
    await expect(page.locator('#tag-input-technologies')).toBeVisible();
    await expect(page.locator('#btn-add-tag-technologies')).toBeVisible();
  });

  test('form contains demo_url and github_url inputs', async ({ page }) => {
    await expect(page.locator('#field-demo_url')).toBeVisible();
    await expect(page.locator('#field-github_url')).toBeVisible();
  });

  test('form contains images section with add button', async ({ page }) => {
    await expect(page.locator('#btn-add-image')).toBeVisible();
  });

  test('form contains body content textarea', async ({ page }) => {
    await expect(page.locator('#field-body')).toBeVisible();
  });

  test('action buttons (save, cancel, delete) are present', async ({ page }) => {
    await expect(page.locator('#btn-save')).toBeAttached();
    await expect(page.locator('#btn-cancel')).toBeAttached();
    await expect(page.locator('#btn-delete')).toBeAttached();
  });
});

// ─── 2.5 View Navigation ────────────────────────────────────────

test.describe('Admin view navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/nmuriithi-portfolio.github.io/admin/');
    // Show dashboard
    await page.evaluate(() => {
      (document.getElementById('view-login') as HTMLElement).style.display = 'none';
      (document.getElementById('view-dashboard') as HTMLElement).style.display = '';
      (document.getElementById('admin-nav') as HTMLElement).style.display = '';
    });
  });

  test('clicking Projects nav link shows editor view', async ({ page }) => {
    const projectsNav = page.locator('.nav-collection[data-collection="projects"]').first();
    await projectsNav.click();

    await expect(page.locator('#view-editor')).toBeVisible();
    await expect(page.locator('#view-dashboard')).toBeHidden();
  });

  test('clicking Publications nav link shows editor view', async ({ page }) => {
    const pubsNav = page.locator('.nav-collection[data-collection="publications"]').first();
    await pubsNav.click();

    await expect(page.locator('#view-editor')).toBeVisible();
    await expect(page.locator('#view-dashboard')).toBeHidden();
  });

  test('editor heading updates based on collection', async ({ page }) => {
    const projectsNav = page.locator('.nav-collection[data-collection="projects"]').first();
    await projectsNav.click();

    const heading = page.locator('#editor-heading');
    await expect(heading).toHaveText('Projects');
  });

  test('sidebar and editor main are visible in editor view', async ({ page }) => {
    const projectsNav = page.locator('.nav-collection[data-collection="projects"]').first();
    await projectsNav.click();

    await expect(page.locator('#editor-sidebar')).toBeVisible();
    await expect(page.locator('#editor-main')).toBeVisible();
  });
});
