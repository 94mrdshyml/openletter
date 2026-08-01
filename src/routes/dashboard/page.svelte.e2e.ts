import { expect, test } from '@playwright/test';
import { loginAsTestWriter } from '../../lib/test/auth';

test('redirects unauthenticated visitors to /login', async ({ page }) => {
	await page.goto('/dashboard');
	await expect(page).toHaveURL(/\/login/);
});

test('stays on /dashboard when navigated to', async ({ page }) => {
	await loginAsTestWriter(page);
	await page.goto('/dashboard');
	await page.waitForTimeout(2000);
	expect(page.url()).toContain('/dashboard');
});

test('shows subscriber count and published posts', async ({ page }) => {
	await loginAsTestWriter(page);
	await page.goto('/dashboard');
	// getByText('Subscribers') alone now also matches the "Subscribers" nav
	// link (dashboard/subscribers) — scope to the stat card's own <div>
	// label, not the top nav's <a>.
	await expect(page.locator('div').filter({ hasText: /^Subscribers$/ })).toBeVisible();
	await expect(page.getByText('0', { exact: true })).toBeVisible();
	await expect(
		page.getByRole('link', { name: 'The Quiet Realignment of Central Asian Gas Routes' })
	).toBeVisible();
	await expect(page.getByRole('link', { name: 'New post' })).toBeVisible();
});

test('logs out and re-gates the dashboard', async ({ page }) => {
	await loginAsTestWriter(page);
	await page.goto('/dashboard');
	await page.getByRole('button', { name: 'Account menu' }).click();
	await page.getByRole('button', { name: 'Log out' }).click();
	await expect(page).toHaveURL(/\/$/);
	await page.goto('/dashboard');
	await expect(page).toHaveURL(/\/login/);
});

test('navigates to My profile from the dashboard nav', async ({ page }) => {
	await loginAsTestWriter(page);
	await page.goto('/dashboard');
	await page.getByRole('button', { name: 'Account menu' }).click();
	await page.getByRole('link', { name: 'My profile' }).click();
	await expect(page).toHaveURL(/\/my-profile/);
});
