import { expect, test } from '@playwright/test';
import { loginAsTestReader, loginAsTestWriter } from '../../lib/test/auth';

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

test('shows a Log in link when logged out, no account menu', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Account menu' })).toHaveCount(0);
});

test('shows My profile but not Dashboard for a reader', async ({ page }) => {
	await loginAsTestReader(page, 'nav-reader@example.com');
	await page.goto('/');
	await page.getByRole('button', { name: 'Account menu' }).click();
	await expect(page.getByRole('link', { name: 'My profile' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Dashboard' })).toHaveCount(0);
});

test('shows Dashboard and My profile for an admin', async ({ page }) => {
	await loginAsTestWriter(page, 'nav-admin@example.com');
	await page.goto('/');
	await page.getByRole('button', { name: 'Account menu' }).click();
	await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'My profile' })).toBeVisible();
});

test('shows a Log out button for a signed-in reader, absent when logged out', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('button', { name: 'Log out' })).toHaveCount(0);

	await loginAsTestReader(page, 'nav-logout-reader@example.com');
	await page.goto('/');
	await page.getByRole('button', { name: 'Account menu' }).click();
	await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();
});

test('logs out from the homepage nav', async ({ page }) => {
	await loginAsTestReader(page, 'nav-logout-reader-2@example.com');
	await page.goto('/');
	await page.getByRole('button', { name: 'Account menu' }).click();
	await page.getByRole('button', { name: 'Log out' }).click();
	await expect(page).toHaveURL(/\/$/);
	await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
});
