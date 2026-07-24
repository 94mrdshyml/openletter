import type { Page } from '@playwright/test';

export async function loginAsTestWriter(page: Page, email?: string) {
	const url = email ? `/api/test/login?email=${encodeURIComponent(email)}` : '/api/test/login';
	const res = await page.request.get(url);
	const { cookies } = await res.json();
	await page.context().addCookies(cookies);
}
