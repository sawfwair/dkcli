import { expect, test } from '@playwright/test';

test('public components hydrate and complete release and theme flows', async ({ page }) => {
  /** @type {string[]} */
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Releases', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Create release' }).click();
  await expect(page.getByText('Correct the marked fields.')).toBeVisible();
  await page.getByRole('textbox', { name: 'Release name', exact: true }).fill('Browser release');
  await page.getByRole('textbox', { name: 'Release owner', exact: true }).fill('Rafi');
  await page.getByRole('button', { name: 'Create release' }).click();
  await expect(page.getByRole('status')).toHaveText('Created Browser release.');
  await page.getByRole('row').filter({ hasText: 'Browser release' }).getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Review release' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByLabel('Next status').selectOption('Ready');
  await page.getByRole('button', { name: 'Save status' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('row').filter({ hasText: 'Browser release' })).toContainText('Ready');
  await page.getByRole('combobox', { name: 'Status', exact: true }).selectOption('Archived');
  await expect(page.getByRole('row').filter({ hasText: 'Browser release' })).toHaveCount(0);
  await page.getByRole('combobox', { name: 'Status', exact: true }).selectOption('Active');
  await page.getByLabel('Find a release').fill('No matching release');
  await expect(page.getByText('No matching releases')).toBeVisible();
  await page.getByLabel('Find a release').fill('');
  await page.getByLabel('Theme name', { exact: true }).fill('Forest');
  await page.getByLabel('Brand color').fill('#28634e');
  await page.getByRole('combobox', { name: 'Mode', exact: true }).selectOption('dark');
  await page.getByRole('button', { name: 'Apply theme' }).click();
  await expect(page.getByRole('status')).toHaveText('Applied Forest.');
  await page.reload();
  await expect(page.locator('.app')).toHaveAttribute('data-mode', 'dark');
  await expect(page.getByRole('row').filter({ hasText: 'Browser release' })).toContainText('Ready');
  await page.getByRole('button', { name: 'Reset releases' }).click();
  await expect(page.getByRole('row').filter({ hasText: 'Browser release' })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('mobile layout fits and actions work without browser JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4186');
  await page.getByRole('textbox', { name: 'Release name', exact: true }).fill('No JS release');
  await page.getByRole('textbox', { name: 'Release owner', exact: true }).fill('Casey');
  await page.getByRole('textbox', { name: 'Release owner', exact: true }).press('Enter');
  await expect(page.getByRole('row').filter({ hasText: 'No JS release' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await context.close();
});
