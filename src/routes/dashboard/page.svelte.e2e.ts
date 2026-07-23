import { expect, test } from '@playwright/test';

// No auth exists yet (Better Auth lands in a future session) - this only
// verifies the route renders and holds its URL, not that it's auth-gated.
test('stays on /dashboard when navigated to', async ({ page }) => {
	await page.goto('/dashboard');
	await page.waitForTimeout(2000);
	expect(page.url()).toContain('/dashboard');
});

test('shows subscriber count and published posts', async ({ page }) => {
	await page.goto('/dashboard');
	await expect(page.getByText('Subscribers')).toBeVisible();
	await expect(page.getByText('847')).toBeVisible();
	await expect(page.getByRole('link', { name: 'New post' })).toBeVisible();
});
