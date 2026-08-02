import { expect, test } from '@playwright/test';
import { loginAsTestWriter } from '../../../../lib/test/auth';
import { createTestApiKey } from '../../../../lib/test/api-key';

const BASE = `http://localhost:${process.env.E2E_PORT ?? 4173}`;
const PUBLISHED_SLUG = 'quiet-realignment-central-asian-gas-routes';
const DRAFT_SLUG = 'south-china-sea-insurance-war';

test('rejects requests with no API key', async ({ page }) => {
	const res = await page.request.get(`${BASE}/api/v1/posts`);
	expect(res.status()).toBe(401);
});

test('lists published posts and excludes drafts', async ({ page }) => {
	await loginAsTestWriter(page);
	const key = await createTestApiKey(page, 'posts e2e key');
	const headers = { Authorization: `Bearer ${key}` };

	const list = await page.request.get(`${BASE}/api/v1/posts?limit=200`, { headers });
	expect(list.ok()).toBe(true);
	const { data } = await list.json();
	expect(data.some((p: { slug: string }) => p.slug === PUBLISHED_SLUG)).toBe(true);
	expect(data.some((p: { slug: string }) => p.slug === DRAFT_SLUG)).toBe(false);
});

test('gets a published post by slug with full body, 404s for drafts and unknown slugs', async ({
	page
}) => {
	await loginAsTestWriter(page);
	const key = await createTestApiKey(page, 'posts e2e key 2');
	const headers = { Authorization: `Bearer ${key}` };

	const found = await page.request.get(`${BASE}/api/v1/posts/${PUBLISHED_SLUG}`, { headers });
	expect(found.ok()).toBe(true);
	const body = await found.json();
	expect(body.slug).toBe(PUBLISHED_SLUG);
	expect(body.body).toBeTruthy();

	const draft = await page.request.get(`${BASE}/api/v1/posts/${DRAFT_SLUG}`, { headers });
	expect(draft.status()).toBe(404);

	const unknown = await page.request.get(`${BASE}/api/v1/posts/does-not-exist`, { headers });
	expect(unknown.status()).toBe(404);
});
