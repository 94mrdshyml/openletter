import { describe, expect, it } from 'vitest';
import { verifyResendWebhook } from './webhook';

const SECRET = 'whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw';

async function sign(id: string, timestamp: string, body: string, secret: string) {
	const secretBytes = Uint8Array.from(atob(secret.replace(/^whsec_/, '')), (c) => c.charCodeAt(0));
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

function headersFor(id: string, timestamp: string, signature: string) {
	return new Headers({
		'svix-id': id,
		'svix-timestamp': timestamp,
		'svix-signature': `v1,${signature}`
	});
}

describe('verifyResendWebhook', () => {
	it('accepts a correctly signed request', async () => {
		const body = '{"type":"email.opened"}';
		const id = 'msg_test';
		const timestamp = String(Math.floor(Date.now() / 1000));
		const signature = await sign(id, timestamp, body, SECRET);

		expect(await verifyResendWebhook(body, headersFor(id, timestamp, signature), SECRET)).toBe(
			true
		);
	});

	it('accepts a request with multiple space-delimited signatures, matching any one', async () => {
		const body = '{"type":"email.opened"}';
		const id = 'msg_test';
		const timestamp = String(Math.floor(Date.now() / 1000));
		const signature = await sign(id, timestamp, body, SECRET);
		const headers = new Headers({
			'svix-id': id,
			'svix-timestamp': timestamp,
			'svix-signature': `v1,bogus v1,${signature}`
		});

		expect(await verifyResendWebhook(body, headers, SECRET)).toBe(true);
	});

	it('rejects a tampered body', async () => {
		const body = '{"type":"email.opened"}';
		const id = 'msg_test';
		const timestamp = String(Math.floor(Date.now() / 1000));
		const signature = await sign(id, timestamp, body, SECRET);

		const tampered = '{"type":"email.clicked"}';
		expect(await verifyResendWebhook(tampered, headersFor(id, timestamp, signature), SECRET)).toBe(
			false
		);
	});

	it('rejects a signature produced with the wrong secret', async () => {
		const body = '{"type":"email.opened"}';
		const id = 'msg_test';
		const timestamp = String(Math.floor(Date.now() / 1000));
		const signature = await sign(id, timestamp, body, 'whsec_someOtherSecretEntirely1234');

		expect(await verifyResendWebhook(body, headersFor(id, timestamp, signature), SECRET)).toBe(
			false
		);
	});

	it('rejects a request missing signature headers', async () => {
		const body = '{"type":"email.opened"}';
		expect(await verifyResendWebhook(body, new Headers(), SECRET)).toBe(false);
	});

	it('rejects a stale timestamp outside the replay tolerance window', async () => {
		const body = '{"type":"email.opened"}';
		const id = 'msg_test';
		const staleTimestamp = String(Math.floor(Date.now() / 1000) - 3600);
		const signature = await sign(id, staleTimestamp, body, SECRET);

		expect(await verifyResendWebhook(body, headersFor(id, staleTimestamp, signature), SECRET)).toBe(
			false
		);
	});
});
