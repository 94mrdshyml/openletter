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
	await expect(page.getByText('Subscribers')).toBeVisible();
	await expect(page.getByText('847')).toBeVisible();
	await expect(page.getByRole('link', { name: 'New post' })).toBeVisible();
});

test('logs out and re-gates the dashboard', async ({ page }) => {
	await loginAsTestWriter(page);
	await page.goto('/dashboard');
	await page.getByRole('button', { name: 'Log out' }).click();
	await expect(page).toHaveURL(/\/$/);
	await page.goto('/dashboard');
	await expect(page).toHaveURL(/\/login/);
});
