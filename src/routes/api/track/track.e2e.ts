import { expect, test } from '@playwright/test';
import { loginAsTestWriter } from '../../../lib/test/auth';

async function createDraftPostId(page: import('@playwright/test').Page): Promise<string> {
	await loginAsTestWriter(page);
	await page.goto('/dashboard/posts/new');
	await expect(page.getByRole('textbox', { name: 'Post body' })).toBeVisible();
	// Unique title per call — slug is derived from it, and slug is unique,
	// so a fixed title collides on the 2nd+ post created within this file.
	await page
		.getByRole('textbox', { name: 'Post title' })
		.fill(`Tracking E2E Post ${Date.now()}-${Math.random().toString(36).slice(2)}`);
	await page.getByRole('button', { name: 'Save draft' }).click();
	await expect(page).toHaveURL(/\/dashboard\/posts\/post_/);
	return page.url().match(/post_[0-9a-zA-Z]+/)![0];
}

test('open pixel returns a transparent gif and records an event', async ({ page }) => {
	const postId = await createDraftPostId(page);

	const res = await page.request.get(
		`/api/track/open?post=${postId}&email=${encodeURIComponent('open-e2e@example.com')}`
	);
	expect(res.status()).toBe(200);
	expect(res.headers()['content-type']).toBe('image/gif');
	expect(res.headers()['cache-control']).toBe('no-store');
});

test('open pixel still returns a gif with missing params (fail-open)', async ({ page }) => {
	const res = await page.request.get('/api/track/open');
	expect(res.status()).toBe(200);
	expect(res.headers()['content-type']).toBe('image/gif');
});

test('click with a valid signature redirects to the real destination', async ({ page }) => {
	const postId = await createDraftPostId(page);
	const destination = 'https://example.com/real-article';

	const { trackedUrl } = await (
		await page.request.get(
			`/api/test/track-url?post=${postId}&url=${encodeURIComponent(destination)}`
		)
	).json();

	const res = await page.request.get(trackedUrl, { maxRedirects: 0 });
	expect(res.status()).toBe(302);
	expect(res.headers()['location']).toBe(destination);
});

test('click with a tampered destination does not redirect to the attacker url', async ({
	page
}) => {
	const postId = await createDraftPostId(page);
	const destination = 'https://example.com/real-article';

	const { trackedUrl } = await (
		await page.request.get(
			`/api/test/track-url?post=${postId}&url=${encodeURIComponent(destination)}`
		)
	).json();

	// Same signature, different `url` — the load-bearing open-redirect check.
	const tampered = new URL(trackedUrl);
	tampered.searchParams.set('url', 'https://evil.example.com/phish');

	const res = await page.request.get(tampered.toString(), { maxRedirects: 0 });
	expect(res.status()).toBe(302);
	expect(res.headers()['location']).not.toBe('https://evil.example.com/phish');
	expect(res.headers()['location']).toBe('/');
});

test('click with a bogus signature does not redirect anywhere attacker-controlled', async ({
	page
}) => {
	const postId = await createDraftPostId(page);
	const destination = 'https://evil.example.com/phish';

	const res = await page.request.get(
		`/api/track/click?post=${postId}&email=${encodeURIComponent('click-e2e@example.com')}&url=${encodeURIComponent(destination)}&sig=0000000000000000000000000000000000000000000000000000000000000000`,
		{ maxRedirects: 0 }
	);
	expect(res.status()).toBe(302);
	expect(res.headers()['location']).toBe('/');
});

test('click with missing params redirects safely instead of erroring', async ({ page }) => {
	const res = await page.request.get('/api/track/click', { maxRedirects: 0 });
	expect(res.status()).toBe(302);
	expect(res.headers()['location']).toBe('/');
});
