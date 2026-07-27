import type { Page } from '@playwright/test';

export async function loginAsTestWriter(page: Page, email?: string) {
	// role=admin is explicit: the endpoint defaults to reader, so that a
	// missing or malformed role can never silently mint an admin session.
	const target = email ?? 'test-writer@example.com';
	const url = `/api/test/login?email=${encodeURIComponent(target)}&role=admin`;
	const res = await page.request.get(url);
	const { cookies } = await res.json();
	await page.context().addCookies(cookies);
}

export async function loginAsTestReader(page: Page, email: string) {
	const url = `/api/test/login?email=${encodeURIComponent(email)}&role=reader`;
	const res = await page.request.get(url);
	const { cookies } = await res.json();
	await page.context().addCookies(cookies);
}
