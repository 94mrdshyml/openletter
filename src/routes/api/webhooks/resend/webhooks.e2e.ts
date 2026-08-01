import { expect, test } from '@playwright/test';
import { loginAsTestWriter } from '../../../../lib/test/auth';

const BASE = `http://localhost:${process.env.E2E_PORT ?? 4173}`;
const SECRET = 'whsec_e2etestwebhooksecretvalue123';

// Mirrors src/lib/server/webhook.ts's own algorithm — see webhook.spec.ts for
// the unit-level coverage of that function itself. This just needs to
// produce a request the real endpoint accepts, to test the endpoint (auth
// gating, malformed-event handling), not re-prove the crypto.
async function sign(id: string, timestamp: string, body: string) {
	const secretBytes = Uint8Array.from(atob(SECRET.replace(/^whsec_/, '')), (c) => c.charCodeAt(0));
	const key = await crypto.subtle.importKey(
		'raw',
		secretBytes as BufferSource,
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const bytes = await crypto.subtle.sign(
		'HMAC',
		key,
		new TextEncoder().encode(`${id}.${timestamp}.${body}`) as BufferSource
	);
	return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

test('rejects a webhook event when no signing secret is configured', async ({ page }) => {
	const res = await page.request.post(`${BASE}/api/webhooks/resend`, {
		data: '{"type":"email.opened","data":{}}',
		headers: {
			'content-type': 'application/json',
			'svix-id': 'msg_1',
			'svix-timestamp': String(Math.floor(Date.now() / 1000)),
			'svix-signature': 'v1,bogus'
		}
	});
	expect(res.status()).toBe(404);
});

test('rejects and accepts webhook events once a secret is configured', async ({ page }) => {
	await loginAsTestWriter(page);
	await page.goto('/dashboard/settings');
	await page.getByLabel('Resend webhook signing secret').fill(SECRET);
	await page.getByRole('button', { name: 'Save changes' }).click();
	await expect(page.getByText('Saved.')).toBeVisible();

	const body =
		'{"type":"email.opened","data":{"broadcast_id":"nonexistent","to":["r@example.com"]}}';
	const id = 'msg_2';
	const timestamp = String(Math.floor(Date.now() / 1000));

	const badRes = await page.request.post(`${BASE}/api/webhooks/resend`, {
		data: body,
		headers: {
			'content-type': 'application/json',
			'svix-id': id,
			'svix-timestamp': timestamp,
			'svix-signature': 'v1,thisIsNotValid'
		}
	});
	expect(badRes.status()).toBe(401);

	const signature = await sign(id, timestamp, body);
	const goodRes = await page.request.post(`${BASE}/api/webhooks/resend`, {
		data: body,
		headers: {
			'content-type': 'application/json',
			'svix-id': id,
			'svix-timestamp': timestamp,
			'svix-signature': `v1,${signature}`
		}
	});
	expect(goodRes.status()).toBe(200);
	expect(await goodRes.json()).toEqual({ ok: true });
});

test('accepts a contact.updated (unsubscribe) event for a non-matching email', async ({ page }) => {
	// No real subscriber to flip an unsubscribedAt on here — creating one
	// requires a real magic-link click, which e2e can't do without
	// intercepting a real email (see docs/SESSION_LOG.md). This still
	// exercises the real code path (parses the event, no-ops safely when
	// no subscriber row matches), same as the broadcast-id no-match case
	// above.
	await loginAsTestWriter(page);
	await page.goto('/dashboard/settings');
	await page.getByLabel('Resend webhook signing secret').fill(SECRET);
	await page.getByRole('button', { name: 'Save changes' }).click();
	await expect(page.getByText('Saved.')).toBeVisible();

	const body =
		'{"type":"contact.updated","data":{"email":"nonexistent@example.com","unsubscribed":true}}';
	const id = 'msg_3';
	const timestamp = String(Math.floor(Date.now() / 1000));
	const signature = await sign(id, timestamp, body);

	const res = await page.request.post(`${BASE}/api/webhooks/resend`, {
		data: body,
		headers: {
			'content-type': 'application/json',
			'svix-id': id,
			'svix-timestamp': timestamp,
			'svix-signature': `v1,${signature}`
		}
	});
	expect(res.status()).toBe(200);
	expect(await res.json()).toEqual({ ok: true });
});
