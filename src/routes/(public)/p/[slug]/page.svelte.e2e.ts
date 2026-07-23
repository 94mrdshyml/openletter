import { expect, test } from '@playwright/test';

const slug = 'quiet-realignment-central-asian-gas-routes';

test(`stays on /p/${slug} when navigated to`, async ({ page }) => {
	await page.goto(`/p/${slug}`);
	await page.waitForTimeout(2000);
	expect(page.url()).toContain(`/p/${slug}`);
});

test('shows the full post title and body', async ({ page }) => {
	await page.goto(`/p/${slug}`);
	await expect(page.locator('h1')).toHaveText('The Quiet Realignment of Central Asian Gas Routes');
	await expect(page.getByTestId('subscribe-form')).toBeVisible();
});

test('returns a 404 for an unknown slug', async ({ page }) => {
	const response = await page.goto('/p/does-not-exist');
	expect(response?.status()).toBe(404);
});
