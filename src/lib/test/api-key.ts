import type { Page } from '@playwright/test';

// Assumes loginAsTestWriter has already run in this test — creates a key
// through the real dashboard/settings form (not a raw D1 insert) and reads
// the raw value back off the one-time reveal box.
export async function createTestApiKey(page: Page, name = 'e2e test key'): Promise<string> {
	await page.goto('/dashboard/settings');
	await page.getByPlaceholder('e.g. Zapier integration').fill(name);
	await page.getByRole('button', { name: 'Create key' }).click();
	const input = page.locator('input[readonly]');
	await input.waitFor();
	return input.inputValue();
}
