import { expect, test } from '@playwright/test';
import { loginAsTestWriter } from '../../../lib/test/auth';

test('stays on /dashboard/settings when navigated to', async ({ page }) => {
	await loginAsTestWriter(page);
	await page.goto('/dashboard/settings');
	await page.waitForTimeout(2000);
	expect(page.url()).toContain('/dashboard/settings');
});

test('shows the publication settings fields', async ({ page }) => {
	await loginAsTestWriter(page);
	await page.goto('/dashboard/settings');
	await expect(page.getByLabel('Publication name')).toHaveValue('The Meridian');
	await expect(page.getByRole('button', { name: 'Save changes' })).toBeVisible();
});

test('saves publication changes for real', async ({ page }) => {
	await loginAsTestWriter(page);
	await page.goto('/dashboard/settings');
	await page.getByLabel('Tagline').fill('Updated tagline for real');
	await page.getByRole('button', { name: 'Save changes' }).click();
	await expect(page.getByText('Saved.')).toBeVisible();
	await page.reload();
	await expect(page.getByLabel('Tagline')).toHaveValue('Updated tagline for real');
});

test('sends an admin invite', async ({ page }) => {
	await loginAsTestWriter(page);
	await page.goto('/dashboard/settings');
	await page.getByPlaceholder('colleague@example.com').fill('new-admin@example.com');
	await page.getByRole('button', { name: 'Send invite' }).click();
	await expect(page.getByText('Invitation sent.')).toBeVisible();
});
