import { test, expect } from '@playwright/test';

/**
 * About page tests
 *
 * Covers:
 * - About page renders correctly
 * - No unclosed <b> tags causing bold bleed across the whole page
 * - Profile image loads (naturalWidth > 0)
 */

test.describe('About page loads', () => {
  test('returns HTTP 200', async ({ page }) => {
    const response = await page.goto('/about/');
    expect(response?.status()).toBe(200);
  });

  test('has correct page title containing "About"', async ({ page }) => {
    await page.goto('/about/');
    const title = await page.title();
    expect(title).toContain('About');
  });

  test('header is visible', async ({ page }) => {
    await page.goto('/about/');
    const header = page.locator('header.header-area');
    await expect(header).toBeVisible();
  });
});

test.describe('About page content', () => {
  test('main heading "Who I Am & What I Do" is present', async ({ page }) => {
    await page.goto('/about/');
    const heading = page.getByText('Who I Am & What I Do');
    await expect(heading).toBeVisible();
  });

  test('"My Journey" section is present', async ({ page }) => {
    await page.goto('/about/');
    const journeyHeading = page.getByText('My Journey');
    await expect(journeyHeading).toBeVisible();
  });

  test('"Skills:" section heading is present', async ({ page }) => {
    await page.goto('/about/');
    const skillsHeading = page.getByText('Skills:');
    await expect(skillsHeading).toBeVisible();
  });

  test('left text content column is present', async ({ page }) => {
    await page.goto('/about/');
    const leftContent = page.locator('.left-text-content');
    await expect(leftContent).toBeAttached();
  });

  test('should not contain template filler text', async ({ page }) => {
    await page.goto('/about/');
    const content = await page.textContent('body');
    expect(content).not.toContain('From startups to established companies');
    expect(content).not.toContain('staying current with industry trends');
  });
});

test.describe('No unclosed <b> tag bold bleed', () => {
  /**
   * A mis-formed or accidentally unclosed <b> can make the entire remaining
   * page bold. We detect this by checking that elements outside known bold
   * regions — such as the footer and plain paragraphs — do not have
   * font-weight >= 700.
   *
   * The about page uses <b> inline inside <li> elements intentionally (e.g.
   * "<b>Translating complexity into clarity:</b>"). We verify those are
   * properly closed by checking sibling/unrelated elements are not bold.
   */
  test('footer text is not bold (no bold-bleed from unclosed <b>)', async ({ page }) => {
    await page.goto('/about/');

    const footerEl = page.locator('footer').first();
    await expect(footerEl).toBeAttached();

    const fontWeight = await footerEl.evaluate((el: HTMLElement) => {
      return window.getComputedStyle(el).fontWeight;
    });

    // Normal body weight is 400. 700 or higher indicates bold bleed.
    const weight = parseInt(fontWeight, 10);
    expect(weight, 'Footer appears bold — possible unclosed <b> tag').toBeLessThan(700);
  });

  test('"My Journey" paragraph text is not bold', async ({ page }) => {
    await page.goto('/about/');

    // The "My Journey" section contains plain <p> tags that must not be bold.
    const journeySection = page.locator('.row').filter({ hasText: 'My Journey' });
    const paragraphs = journeySection.locator('p');
    const count = await paragraphs.count();

    expect(count, 'No paragraphs found in My Journey section').toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const fontWeight = await paragraphs.nth(i).evaluate((el: HTMLElement) => {
        return window.getComputedStyle(el).fontWeight;
      });
      const weight = parseInt(fontWeight, 10);
      expect(
        weight,
        `Paragraph ${i + 1} in My Journey is bold — possible unclosed <b> tag`
      ).toBeLessThan(700);
    }
  });

  test('list item containing "ESRI Field Maps" is not bold (no bleed past closed <b>)', async ({ page }) => {
    await page.goto('/about/');

    // "ESRI Field Maps" appears in a plain <li> without a <b> wrapper.
    // If bold is bleeding from an unclosed tag above it, this will be 700.
    const regularListItem = page.locator('li').filter({ hasText: 'ESRI Field Maps' });
    if (await regularListItem.count() > 0) {
      const fontWeight = await regularListItem.evaluate((el: HTMLElement) => {
        return window.getComputedStyle(el).fontWeight;
      });
      expect(parseInt(fontWeight, 10)).toBeLessThan(700);
    }
  });

  test('bold elements inside skills list are properly scoped to their <b> element', async ({ page }) => {
    await page.goto('/about/');

    // If <b> is properly closed, the computed weight on the parent <li> is the
    // inherited body weight (400), not 700.
    const skillsLis = page.locator('.skills-section li');
    const count = await skillsLis.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const li = skillsLis.nth(i);
      const fontWeight = await li.evaluate((el: HTMLElement) => {
        return window.getComputedStyle(el).fontWeight;
      });
      const weight = parseInt(fontWeight, 10);
      expect(
        weight,
        `<li> element ${i + 1} in skills section has unexpected bold weight — check for unclosed <b>`
      ).toBeLessThan(700);
    }
  });
});

test.describe('Profile image', () => {
  test('profile image is present in the right column', async ({ page }) => {
    await page.goto('/about/');

    const profileImage = page.locator('.right-image img');
    await expect(profileImage).toBeAttached();
  });

  test('profile image has a non-empty alt attribute', async ({ page }) => {
    await page.goto('/about/');

    const profileImage = page.locator('img[alt="About Njoki Muriithi"]');
    await expect(profileImage).toBeAttached();
    const alt = (await profileImage.getAttribute('alt')) ?? '';
    expect(alt.trim().length).toBeGreaterThan(0);
  });

  test('profile image is visible', async ({ page }) => {
    await page.goto('/about/');

    const profileImage = page.locator('img[alt="About Njoki Muriithi"]');
    await expect(profileImage).toBeVisible();
  });

  test('profile image has loaded (naturalWidth > 0)', async ({ page }) => {
    await page.goto('/about/');

    const profileImage = page.locator('img[alt="About Njoki Muriithi"]');
    await expect(profileImage).toBeAttached();

    await page.waitForLoadState('load');

    const naturalWidth = await profileImage.evaluate((el: HTMLImageElement) => el.naturalWidth);
    expect(naturalWidth, 'Profile image failed to load (naturalWidth is 0)').toBeGreaterThan(0);
  });

  test('profile image src uses baseurl prefix', async ({ page }) => {
    await page.goto('/about/');

    const profileImage = page.locator('.right-image img');
    const src = (await profileImage.getAttribute('src')) ?? '';
    // The baseurl is /nmuriithi-portfolio.github.io; images are served under
    // that path rather than from the root.
    expect(src).toContain('/nmuriithi-portfolio.github.io/assets/images/');
  });
});
