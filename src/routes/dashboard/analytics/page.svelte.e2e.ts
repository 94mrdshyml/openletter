import { expect, test } from '@playwright/test';
import { loginAsTestWriter } from '../../../lib/test/auth';

test('stays on /dashboard/analytics when navigated to', async ({ page }) => {
	await loginAsTestWriter(page);
	await page.goto('/dashboard/analytics');
	await page.waitForTimeout(2000);
	expect(page.url()).toContain('/dashboard/analytics');
});

test('shows the stats row and post performance table', async ({ page }) => {
	await loginAsTestWriter(page);
	await page.goto('/dashboard/analytics');
	await expect(page.getByText('Total subscribers')).toBeVisible();
	await expect(page.getByRole('table')).toBeVisible();
});
