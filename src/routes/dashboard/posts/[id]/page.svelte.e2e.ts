import { expect, test } from '@playwright/test';
import { loginAsTestWriter } from '../../../../lib/test/auth';

test('stays on /dashboard/posts/[id] when navigated to', async ({ page }) => {
	await loginAsTestWriter(page);
	await page.goto('/dashboard/posts/new');
	await expect(page.getByRole('textbox', { name: 'Post body' })).toBeVisible();
	await page.getByRole('textbox', { name: 'Post title' }).fill('Nav Test Post');
	await page.getByRole('button', { name: 'Save draft' }).click();
	await expect(page).toHaveURL(/\/dashboard\/posts\/post_/);

	const editUrl = page.url();
	await page.goto(editUrl);
	await page.waitForTimeout(2000);
	expect(page.url()).toContain('/dashboard/posts/post_');
});

test('returns a 404 for an unknown post id', async ({ page }) => {
	await loginAsTestWriter(page);
	const response = await page.goto('/dashboard/posts/post_doesnotexist');
	expect(response?.status()).toBe(404);
});

test('editing an existing draft and saving keeps the changes', async ({ page }) => {
	await loginAsTestWriter(page);
	await page.goto('/dashboard/posts/new');
	await expect(page.getByRole('textbox', { name: 'Post body' })).toBeVisible();
	await page.getByRole('textbox', { name: 'Post title' }).fill('Editable Draft');
	await page.getByRole('button', { name: 'Save draft' }).click();
	await expect(page).toHaveURL(/\/dashboard\/posts\/post_/);

	await page.getByRole('textbox', { name: 'Post title' }).fill('Editable Draft, Edited');
	await page.getByRole('button', { name: 'Save draft' }).click();
	await page.reload();
	await expect(page.getByRole('textbox', { name: 'Post title' })).toHaveValue(
		'Editable Draft, Edited'
	);
});
