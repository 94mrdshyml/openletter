import { expect, test } from '@playwright/test';
import { loginAsTestReader, loginAsTestWriter } from '../../lib/test/auth';

test('stays on /my-profile when navigated to', async ({ page }) => {
	await loginAsTestReader(page, 'profile-reader@example.com');
	await page.goto('/my-profile');
	await page.waitForTimeout(2000);
	expect(page.url()).toContain('/my-profile');
});

test('redirects unauthenticated visitors to /login', async ({ page }) => {
	await page.goto('/my-profile');
	await page.waitForTimeout(500);
	expect(page.url()).toContain('/login');
});

test('shows the profile fields and an avatar', async ({ page }) => {
	await loginAsTestReader(page, 'profile-reader-2@example.com');
	await page.goto('/my-profile');
	await expect(page.getByLabel('First name')).toBeVisible();
	await expect(page.getByLabel('Last name')).toBeVisible();
	await expect(page.locator('img[alt=""]')).toBeVisible();
});

test('saves profile changes for real', async ({ page }) => {
	await loginAsTestWriter(page, 'profile-admin@example.com');
	await page.goto('/my-profile');
	await page.getByLabel('First name').fill('Ada');
	await page.getByLabel('Last name').fill('Lovelace');
	await page.getByRole('button', { name: 'Save changes' }).click();
	await expect(page.getByText('Saved.')).toBeVisible();
	await page.reload();
	await expect(page.getByLabel('First name')).toHaveValue('Ada');
	await expect(page.getByLabel('Last name')).toHaveValue('Lovelace');
});
