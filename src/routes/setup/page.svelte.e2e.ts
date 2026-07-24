import { expect, test } from '@playwright/test';

// globalSetup (e2e-global-setup.ts) already completes setup for real before
// any test runs, so by the time these run, /setup is always already claimed.
test('redirects to /login once setup is already complete', async ({ page }) => {
	await page.goto('/setup');
	await expect(page).toHaveURL(/\/login/);
});

test('any other route no longer redirects to /setup once complete', async ({ page }) => {
	await page.goto('/');
	await page.waitForTimeout(2000);
	expect(page.url()).not.toContain('/setup');
});
