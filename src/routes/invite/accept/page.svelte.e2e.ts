import { expect, test } from '@playwright/test';

test('shows an error for an invalid invitation token', async ({ page }) => {
	const res = await page.goto('/invite/accept?token=not-a-real-token');
	expect(res?.status()).toBe(404);
});
