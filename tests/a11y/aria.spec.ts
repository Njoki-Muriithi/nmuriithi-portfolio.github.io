import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// 1. No nav <ul> should carry role="menubar".
//    The ARIA menubar pattern requires a full roving-tabindex keyboard
//    implementation that this theme does not provide, so the role must be
//    absent.  Checked on the homepage as a representative page.
// ---------------------------------------------------------------------------
test('navigation — no <ul> inside <nav> has role="menubar"', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const menubarCount = await page.evaluate(() => {
    const lists = Array.from(document.querySelectorAll('nav ul'));
    return lists.filter((el) => el.getAttribute('role') === 'menubar').length;
  });

  expect(
    menubarCount,
    `Found ${menubarCount} <ul> element(s) inside <nav> with role="menubar". ` +
      'Remove this role unless a full ARIA menubar keyboard pattern is implemented.',
  ).toBe(0);
});

// ---------------------------------------------------------------------------
// 2. The skip link (a.skip-link) must be the first focusable element in the
//    DOM so keyboard users can bypass repetitive navigation immediately.
//    Checked on the homepage; the default layout places it before the
//    preloader and header includes.
// ---------------------------------------------------------------------------
test('skip link — a.skip-link is the first focusable element in the DOM', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const result = await page.evaluate(() => {
    // Build the ordered list of all focusable candidates across the whole DOM.
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const all = Array.from(document.querySelectorAll<HTMLElement>(focusableSelectors));

    const first = all[0] ?? null;
    const skipLink = document.querySelector<HTMLElement>('a.skip-link');

    return {
      firstTag: first?.tagName ?? null,
      firstClass: first?.className ?? null,
      firstHref: (first as HTMLAnchorElement | null)?.getAttribute('href') ?? null,
      firstIsSkipLink: first !== null && first === skipLink,
      skipLinkExists: skipLink !== null,
      skipLinkHref: skipLink?.getAttribute('href') ?? null,
    };
  });

  expect(result.skipLinkExists, 'a.skip-link must exist in the DOM').toBe(true);

  expect(
    result.firstIsSkipLink,
    `The first focusable element must be a.skip-link (href="${result.skipLinkHref}") ` +
      `but found <${result.firstTag} class="${result.firstClass}" href="${result.firstHref}"> instead.`,
  ).toBe(true);

  // The skip link target must point to #main-content.
  expect(
    result.skipLinkHref,
    'The skip link href must be "#main-content" to match the <main id="main-content"> landmark',
  ).toBe('#main-content');
});

// ---------------------------------------------------------------------------
// 3. On project detail pages the overlay backdrop (#overlayBackdrop) must
//    have role="button" and tabindex="0" so keyboard users can close the
//    info panel by activating it directly.
//    Verified on both project-1 and project-2.
// ---------------------------------------------------------------------------
const PROJECT_PAGES = ['/projects/project-1/', '/projects/project-2/'];

for (const path of PROJECT_PAGES) {
  test(`project detail (${path}) — #overlayBackdrop has role="button" and tabindex="0"`, async ({
    page,
  }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');

    const backdrop = page.locator('#overlayBackdrop');

    await expect(
      backdrop,
      `#overlayBackdrop must exist on ${path}`,
    ).toHaveCount(1);

    await expect(
      backdrop,
      `#overlayBackdrop must have role="button" on ${path}`,
    ).toHaveAttribute('role', 'button');

    await expect(
      backdrop,
      `#overlayBackdrop must have tabindex="0" on ${path} so keyboard users can activate it`,
    ).toHaveAttribute('tabindex', '0');
  });
}
