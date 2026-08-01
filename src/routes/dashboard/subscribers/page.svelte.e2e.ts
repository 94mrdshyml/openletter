import { expect, test } from '@playwright/test';
import { loginAsTestWriter } from '../../../lib/test/auth';

test('stays on /dashboard/subscribers when navigated to', async ({ page }) => {
	await loginAsTestWriter(page);
	await page.goto('/dashboard/subscribers');
	await page.waitForTimeout(2000);
	expect(page.url()).toContain('/dashboard/subscribers');
});

test('redirects unauthenticated visitors to /login', async ({ page }) => {
	await page.goto('/dashboard/subscribers');
	await expect(page).toHaveURL(/\/login/);
});

test('shows the subscribers page heading', async ({ page }) => {
	// Doesn't assert a specific subscriber count or empty-vs-table state —
	// other specs subscribe real readers against this same shared D1, and
	// test files can run in parallel, so the count isn't a safe assumption
	// (same lesson as the analytics/settings specs).
	await loginAsTestWriter(page);
	await page.goto('/dashboard/subscribers');
	await expect(page.getByRole('heading', { name: /Subscribers/ })).toBeVisible();
});
