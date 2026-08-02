import { expect, test } from '@playwright/test';
import { loginAsTestWriter } from '../../../../lib/test/auth';
import { createTestApiKey } from '../../../../lib/test/api-key';

const BASE = `http://localhost:${process.env.E2E_PORT ?? 4173}`;

test('rejects requests with no or invalid API key', async ({ page }) => {
	const noAuth = await page.request.get(`${BASE}/api/v1/subscribers`);
	expect(noAuth.status()).toBe(401);

	const badAuth = await page.request.get(`${BASE}/api/v1/subscribers`, {
		headers: { Authorization: 'Bearer ol_bogus' }
	});
	expect(badAuth.status()).toBe(401);
});

test('add, list, and unsubscribe a subscriber via the API', async ({ page }) => {
	await loginAsTestWriter(page);
	const key = await createTestApiKey(page, 'subscribers e2e key');
	const headers = { Authorization: `Bearer ${key}`, 'content-type': 'application/json' };
	const email = 'api-e2e-subscriber@example.com';

	const created = await page.request.post(`${BASE}/api/v1/subscribers`, {
		headers,
		data: { email }
	});
	expect(created.status()).toBe(201);
	const createdBody = await created.json();
	expect(createdBody.email).toBe(email);
	expect(createdBody.id).toMatch(/^sub_/);

	// Idempotent — same email again doesn't error or duplicate.
	const again = await page.request.post(`${BASE}/api/v1/subscribers`, {
		headers,
		data: { email }
	});
	expect(again.ok()).toBe(true);

	const malformed = await page.request.post(`${BASE}/api/v1/subscribers`, {
		headers,
		data: { email: 'not-an-email' }
	});
	expect(malformed.status()).toBe(400);

	const list = await page.request.get(`${BASE}/api/v1/subscribers?limit=200`, { headers });
	expect(list.ok()).toBe(true);
	const listBody = await list.json();
	expect(listBody.data.some((s: { email: string }) => s.email === email)).toBe(true);

	// e2e's Resend API key is a placeholder (see e2e-global-setup.ts), so the
	// real PATCH /contacts/.../topics call genuinely fails auth — this
	// exercises the real failure path, same honesty as the /unsubscribe page
	// e2e test (see unsubscribe/page.svelte.e2e.ts).
	const unsub = await page.request.patch(`${BASE}/api/v1/subscribers/${createdBody.id}`, {
		headers,
		data: { unsubscribed: true }
	});
	expect(unsub.status()).toBe(200);
	expect((await unsub.json()).ok).toBe(false);

	const notFound = await page.request.patch(`${BASE}/api/v1/subscribers/sub_doesnotexist`, {
		headers,
		data: { unsubscribed: true }
	});
	expect(notFound.status()).toBe(404);
});
