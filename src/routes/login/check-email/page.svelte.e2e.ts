import { expect, test } from '@playwright/test';

test('stays on /login/check-email when navigated to', async ({ page }) => {
	await page.goto('/login/check-email');
	await page.waitForTimeout(2000);
	expect(page.url()).toContain('/login/check-email');
});

test('shows the check-your-inbox confirmation', async ({ page }) => {
	await page.goto('/login/check-email');
	await expect(page.locator('h2')).toHaveText('Check your inbox');
	await expect(page.getByRole('button', { name: 'resend the link' })).toBeVisible();
});

test('shows the submitted email from the query param', async ({ page }) => {
	await page.goto('/login/check-email?email=someone%40example.com');
	await expect(page.getByText('someone@example.com')).toBeVisible();
});
