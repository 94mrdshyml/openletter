import { expect, test } from '@playwright/test';

test('stays on /dashboard/posts/new when navigated to', async ({ page }) => {
	await page.goto('/dashboard/posts/new');
	await page.waitForTimeout(2000);
	expect(page.url()).toContain('/dashboard/posts/new');
});

test('shows the editor toolbar and title/body fields', async ({ page }) => {
	await page.goto('/dashboard/posts/new');
	await expect(page.getByRole('button', { name: 'Bold' })).toBeVisible();
	await expect(page.getByRole('textbox', { name: 'Post title' })).toBeVisible();
	await expect(page.getByRole('textbox', { name: 'Post body' })).toBeVisible();
});

test('opens the publish confirmation dialog', async ({ page }) => {
	await page.goto('/dashboard/posts/new');
	await page.getByRole('button', { name: 'Publish', exact: true }).click();
	await expect(page.getByText('Publish this post?')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Publish now' })).toBeVisible();
});
