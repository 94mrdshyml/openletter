import { expect, test } from '@playwright/test';
import { loginAsTestWriter } from '../../lib/test/auth';

test('stays on /welcome when navigated to', async ({ page }) => {
	await page.goto('/welcome');
	await page.waitForTimeout(2000);
	expect(page.url()).toContain('/welcome');
});

test('shows publication name and subscribe form', async ({ page }) => {
	await page.goto('/welcome');
	await expect(page.locator('h1')).toHaveText('The Meridian');
	await expect(page.getByTestId('subscribe-form')).toBeVisible();
	await expect(page.locator('input[name="email"]')).toHaveValue('');
});

test('prefills the email field for a logged-in reader', async ({ page }) => {
	await loginAsTestWriter(page, 'reader-welcome@example.com');
	await page.goto('/welcome');
	await expect(page.locator('input[name="email"]')).toHaveValue('reader-welcome@example.com');
});
