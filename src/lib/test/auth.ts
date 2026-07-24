import type { Page } from '@playwright/test';

export async function loginAsTestWriter(page: Page) {
	const res = await page.request.get('/api/test/login');
	const { cookies } = await res.json();
	await page.context().addCookies(cookies);
}
