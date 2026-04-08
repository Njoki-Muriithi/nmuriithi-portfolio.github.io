import { test, expect } from '@playwright/test';

/**
 * Admin Panel tests
 *
 * Covers:
 * - Login view renders with GitHub OAuth button
 * - Dashboard view structure (cards for Projects and Publications)
 * - Editor sidebar toggle (collapse/expand, toggle stays visible)
 * - Editor form field presence (all front matter fields, action buttons)
 * - View navigation (dashboard → collection editor)
 *
 * Note: These tests validate UI structure and client-side interactions
 * without requiring a live Supabase/GitHub session.
 */

// ─── 2.1 Login View ──────────────────────────────────────────────

test.describe('Admin login view', () => {
  test('login card with "Admin Login" heading is visible', async ({ page }) => {
    await page.goto('/admin/');
    const heading = page.locator('.login-card h1');
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText('Admin Login');
  });

  test('"Sign in with GitHub" button is present', async ({ page }) => {
    await page.goto('/admin/');
    const btn = page.locator('#btn-github-login');
    await expect(btn).toBeVisible();
    const text = await btn.textContent();
    expect(text).toContain('Sign in with GitHub');
  });

  test('top navigation bar is hidden before login', async ({ page }) => {
    await page.goto('/admin/');
    const nav = page.locator('#admin-nav');
    await expect(nav).toBeHidden();
  });

  test('dashboard and editor views are hidden before login', async ({ page }) => {
    await page.goto('/admin/');
    await expect(page.locator('#view-dashboard')).toBeHidden();
    await expect(page.locator('#view-editor')).toBeHidden();
  });
});

// ─── 2.2 Dashboard View ──────────────────────────────────────────

test.describe('Admin dashboard view', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/');
    // Simulate authenticated state by showing dashboard
    await page.evaluate(() => {
      (document.getElementById('view-login') as HTMLElement).style.display = 'none';
      (document.getElementById('view-dashboard') as HTMLElement).style.display = '';
      (document.getElementById('admin-nav') as HTMLElement).style.display = '';
    });
  });

  test('dashboard has Projects and Publications cards', async ({ page }) => {
    const cards = page.locator('.dashboard-card');
    await expect(cards).toHaveCount(2);

    const projectsCard = page.locator('.dashboard-card', { hasText: 'Projects' });
    await expect(projectsCard).toBeVisible();

    const pubsCard = page.locator('.dashboard-card', { hasText: 'Publications' });
    await expect(pubsCard).toBeVisible();
  });

  test('each dashboard card has heading and description', async ({ page }) => {
    const cards = page.locator('.dashboard-card');
    const count = await cards.count();

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const h3 = card.locator('h3');
      await expect(h3).toBeVisible();
      const p = card.locator('p');
      await expect(p).toBeVisible();
    }
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
    await page.goto('/admin/');
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
    await page.goto('/admin/');
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
    await page.goto('/admin/');
    // Show dashboard
    await page.evaluate(() => {
      (document.getElementById('view-login') as HTMLElement).style.display = 'none';
      (document.getElementById('view-dashboard') as HTMLElement).style.display = '';
      (document.getElementById('admin-nav') as HTMLElement).style.display = '';
    });
  });

  test('clicking Projects card shows editor view', async ({ page }) => {
    const projectsCard = page.locator('.dashboard-card[data-collection="projects"]');
    await projectsCard.click();

    await expect(page.locator('#view-editor')).toBeVisible();
    await expect(page.locator('#view-dashboard')).toBeHidden();
  });

  test('clicking Publications card shows editor view', async ({ page }) => {
    const pubsCard = page.locator('.dashboard-card[data-collection="publications"]');
    await pubsCard.click();

    await expect(page.locator('#view-editor')).toBeVisible();
    await expect(page.locator('#view-dashboard')).toBeHidden();
  });

  test('editor heading updates based on collection', async ({ page }) => {
    // Click Projects nav link
    const projectsNav = page.locator('.nav-collection[data-collection="projects"]').first();
    await projectsNav.click();

    const heading = page.locator('#editor-heading');
    await expect(heading).toHaveText('Projects');
  });

  test('sidebar and editor main are visible in editor view', async ({ page }) => {
    const projectsCard = page.locator('.dashboard-card[data-collection="projects"]');
    await projectsCard.click();

    await expect(page.locator('#editor-sidebar')).toBeVisible();
    await expect(page.locator('#editor-main')).toBeVisible();
  });
});
