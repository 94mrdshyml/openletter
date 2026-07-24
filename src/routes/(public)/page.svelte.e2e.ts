import { expect, test } from '@playwright/test';

test('stays on / when navigated to', async ({ page }) => {
	await page.goto('/');
	await page.waitForTimeout(2000);
	expect(page.url()).toContain('/');
});

test('shows the subscribe form and post list', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByTestId('subscribe-form')).toBeVisible();
	await expect(page.locator('h1')).toHaveText('The Meridian');
	await expect(
		page.getByRole('link', { name: /The Quiet Realignment of Central Asian Gas Routes/ })
	).toBeVisible();
});

test('shows an inline confirmation after subscribing', async ({ page }) => {
	await page.goto('/');
	await page
		.getByTestId('subscribe-form')
		.getByPlaceholder('your@email.com')
		.fill('reader@example.com');
	await page.getByTestId('subscribe-form').getByRole('button', { name: 'Subscribe' }).click();
	await expect(page.getByText('Check your inbox to confirm your subscription.')).toBeVisible();
});
