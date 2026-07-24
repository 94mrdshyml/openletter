import { expect, test } from '@playwright/test';
import { loginAsTestWriter } from '../../../lib/test/auth';

test('stays on /dashboard/posts when navigated to', async ({ page }) => {
	await loginAsTestWriter(page);
	await page.goto('/dashboard/posts');
	await page.waitForTimeout(2000);
	expect(page.url()).toContain('/dashboard/posts');
});

test('shows drafts and published sections', async ({ page }) => {
	await loginAsTestWriter(page);
	await page.goto('/dashboard/posts');
	await expect(page.getByText('Drafts')).toBeVisible();
	await expect(page.getByText('Published')).toBeVisible();
	await expect(page.getByText("The South China Sea's Quiet Insurance War")).toBeVisible();
});
