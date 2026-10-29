import { expect, test } from '@playwright/test';

/** Marker attributes look like `s:example-<hash>-<n>`, one per stylesheet. */
const SCOPE_MARKER = /^s:example-[0-9a-f]+-\d+$/;

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#app button').first()).toBeVisible();
});

test('renders the demo tree', async ({ page }) => {
  await expect(page.locator('#app button')).toHaveCount(3);
  await expect(page.getByRole('button', { name: 'Show Div' })).toBeVisible();
});

test('marks every styled host element with its sheet scope', async ({ page }) => {
  const markers = await page.evaluate((scope) => {
    const pattern = new RegExp(scope);
    return [...document.querySelectorAll('#app button, #app div')].map((el) =>
      el.getAttributeNames().filter((name) => pattern.test(name)),
    );
  }, SCOPE_MARKER.source);

  expect(markers.length).toBeGreaterThan(0);
  for (const names of markers) {
    expect(names).toHaveLength(1);
  }
});

test('applies `:global` rules outside the scope', async ({ page }) => {
  const body = await page.evaluate(() => {
    const style = getComputedStyle(document.body);
    return { display: style.display, margin: style.margin };
  });

  expect(body.display).toBe('flex');
  expect(body.margin).toBe('0px');
});

test('applies a `<style jsx>` sheet to its own component only', async ({ page }) => {
  const toggle = page.locator('button.toggle');
  await expect(toggle).toHaveCSS('background-color', 'rgb(17, 24, 39)');
  await expect(toggle).toHaveCSS('border-radius', '8px');

  // The sibling components use `css` sheets and never pick up `.toggle`.
  const others = page.locator('#app button:not(.toggle)');
  await expect(others).toHaveCount(2);
  for (const button of await others.all()) {
    await expect(button).not.toHaveCSS('background-color', 'rgb(17, 24, 39)');
  }
});

test('applies a `css` sheet to its component', async ({ page }) => {
  const button = page.locator('#app button:not(.toggle)').first();
  await expect(button).toHaveCSS('font-size', '32px');
  await expect(button).toHaveCSS('border-radius', '8px');
});

test('updates interpolated values through CSS variables', async ({ page }) => {
  const button = page.locator('#app button:not(.toggle)').first();
  await expect(button).toHaveAttribute('style', /#48c6ef/);

  await button.click();

  await expect(button).toHaveText('Red');
  await expect(button).toHaveAttribute('style', /#ff0844/);
});

test('keeps sibling instances of a component independent', async ({ page }) => {
  const buttons = page.locator('#app button:not(.toggle)');
  await buttons.first().click();

  await expect(buttons.nth(0)).toHaveText('Red');
  await expect(buttons.nth(1)).toHaveText('Blue');
  await expect(buttons.nth(1)).toHaveAttribute('style', /#48c6ef/);
});

test('injects one deduplicated style element per sheet', async ({ page }) => {
  const ids = await page.evaluate(() =>
    [...document.head.querySelectorAll('style[s\\:id]')].map((node) => node.getAttribute('s:id')),
  );

  // Three components, three sheets, and the two `ToggleButton` instances share one.
  expect(ids).toHaveLength(3);
  expect(new Set(ids).size).toBe(3);
});

test('keeps the sheet set stable as children mount', async ({ page }) => {
  const countSheets = async (): Promise<number> =>
    await page.evaluate(() => document.head.querySelectorAll('style[s\\:id]').length);

  const before = await countSheets();
  await page.getByRole('button', { name: 'Show Div' }).click();
  await expect(page.locator('#app div div button')).toBeVisible();
  expect(await countSheets()).toBe(before);
});
