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
