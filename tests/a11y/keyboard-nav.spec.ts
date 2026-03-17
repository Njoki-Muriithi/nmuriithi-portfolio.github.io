import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helper: collect every href value from top-level and submenu nav anchors.
// ---------------------------------------------------------------------------
async function collectNavHrefs(page: import('@playwright/test').Page): Promise<string[]> {
  return page.evaluate(() => {
    const anchors = Array.from(
      document.querySelectorAll<HTMLAnchorElement>('nav.main-nav a'),
    );
    return anchors.map((a) => a.getAttribute('href') ?? '');
  });
}

// ---------------------------------------------------------------------------
// 1. Tab through header navigation — every interactive element must show a
//    visible focus indicator.
// ---------------------------------------------------------------------------
test('header navigation — focus is visible on each interactive element when tabbing', async ({
  page,
}) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Collect all focusable elements inside the header.
  const focusableSelectors = [
    'header a',
    'header button',
    'header [tabindex]:not([tabindex="-1"])',
  ].join(', ');

  const focusableCount = await page.locator(focusableSelectors).count();
  expect(focusableCount, 'There should be at least one focusable element in the header').toBeGreaterThan(0);

  // Tab once to move past the skip link (which comes before the header in DOM
  // order) so that subsequent tabs land inside the header.
  await page.keyboard.press('Tab');

  for (let i = 0; i < focusableCount; i++) {
    // Retrieve the element that currently holds focus.
    const focusedOutlineStyle = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return null;

      const style = window.getComputedStyle(el);
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        outlineColor: style.outlineColor,
        // Some themes use box-shadow as a focus ring instead of outline.
        boxShadow: style.boxShadow,
        // Capture element info for better assertion messages.
        tag: el.tagName,
        text: el.textContent?.trim().slice(0, 60),
        className: el.className,
      };
    });

    expect(focusedOutlineStyle, `Focus style must not be null at tab index ${i}`).not.toBeNull();

    if (focusedOutlineStyle) {
      const hasOutline =
        focusedOutlineStyle.outlineStyle !== 'none' &&
        focusedOutlineStyle.outlineWidth !== '0px';
      const hasBoxShadowFocusRing =
        focusedOutlineStyle.boxShadow !== 'none' && focusedOutlineStyle.boxShadow !== '';

      expect(
        hasOutline || hasBoxShadowFocusRing,
        `Focus must be visible on <${focusedOutlineStyle.tag} class="${focusedOutlineStyle.className}"> ` +
          `("${focusedOutlineStyle.text}") — ` +
          `outline: ${focusedOutlineStyle.outlineStyle} ${focusedOutlineStyle.outlineWidth}, ` +
          `box-shadow: ${focusedOutlineStyle.boxShadow}`,
      ).toBe(true);
    }

    await page.keyboard.press('Tab');
  }
});

// ---------------------------------------------------------------------------
// 2. Dropdown trigger anchors must NOT use `javascript:;` as their href.
//    The header template uses href="#" with role="button", which is correct.
// ---------------------------------------------------------------------------
test('header navigation — submenu triggers do not use javascript:; href', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const hrefs = await collectNavHrefs(page);

  const jsHrefs = hrefs.filter((href) => href.toLowerCase().startsWith('javascript:'));

  expect(
    jsHrefs,
    `Found ${jsHrefs.length} nav anchor(s) using javascript:; which is inaccessible: ${JSON.stringify(jsHrefs)}`,
  ).toHaveLength(0);
});

// ---------------------------------------------------------------------------
// 3. On a project detail page the ESC key must close the info overlay.
//    The overlay is opened by the floating info button (#floatingBtn).
// ---------------------------------------------------------------------------
test('project-1 — ESC key closes the info overlay', async ({ page }) => {
  await page.goto('/projects/project-1/');
  await page.waitForLoadState('networkidle');

  const floatingBtn = page.locator('#floatingBtn');
  const infoOverlay = page.locator('#infoOverlay');

  // The floating button is only visible on smaller viewports in the CSS, but
  // it is present in the DOM on all viewports.  Force-click so the test is
  // viewport-independent.
  await floatingBtn.click({ force: true });

  // After opening, the overlay should have an "active" state.  The project JS
  // adds/removes a CSS class or changes aria-expanded to signal open state.
  // Check both mechanisms to be implementation-agnostic.
  const isOpenAfterClick = await page.evaluate(() => {
    const overlay = document.getElementById('infoOverlay');
    const btn = document.getElementById('floatingBtn');
    if (!overlay || !btn) return false;
    // Accept either an .active class on the overlay or aria-expanded="true"
    // on the button as proof the panel is open.
    return (
      overlay.classList.contains('active') ||
      btn.getAttribute('aria-expanded') === 'true'
    );
  });

  expect(isOpenAfterClick, 'Info overlay should be open after clicking the floating button').toBe(
    true,
  );

  // Press ESC and confirm the overlay is dismissed.
  await page.keyboard.press('Escape');

  const isClosedAfterEsc = await page.evaluate(() => {
    const overlay = document.getElementById('infoOverlay');
    const btn = document.getElementById('floatingBtn');
    if (!overlay || !btn) return false;
    return (
      !overlay.classList.contains('active') &&
      btn.getAttribute('aria-expanded') !== 'true'
    );
  });

  expect(isClosedAfterEsc, 'Info overlay should be closed after pressing ESC').toBe(true);
});
