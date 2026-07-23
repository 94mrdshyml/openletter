import { expect, test } from '@playwright/test';

test('stays on /welcome when navigated to', async ({ page }) => {
	await page.goto('/welcome');
	await page.waitForTimeout(2000);
	expect(page.url()).toContain('/welcome');
});

test('shows the post-deploy welcome next steps', async ({ page }) => {
	await page.goto('/welcome');
	await expect(page.locator('h1')).toHaveText('Your publication is live');
	await expect(page.getByRole('link', { name: /Configure your publication/ })).toBeVisible();
	await expect(page.getByRole('link', { name: /Write your first post/ })).toBeVisible();
});
